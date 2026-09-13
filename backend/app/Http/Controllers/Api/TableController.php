<?php

namespace App\Http\Controllers\Api;

use App\Events\TableStatusChanged;
use App\Http\Controllers\Controller;
use App\Models\DiningTable;
use App\Models\QrCode as QrCodeModel;
use App\Support\AuditLogger;
use App\Support\SafeBroadcast;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use SimpleSoftwareIO\QrCode\Facades\QrCode;

class TableController extends Controller
{
    // How long a table stays RESERVED after a QR scan with no order placed,
    // before it's treated as free again. No dedicated "reserved at" column
    // exists (or is needed) — dining_tables.updated_at already gets bumped
    // whenever status changes, so it doubles as that timestamp for free.
    const RESERVATION_TIMEOUT_MINUTES = 20;

    // Flips any table that's been sitting RESERVED past the timeout back to
    // AVAILABLE. Called at the top of the two read paths that matter most
    // (staff table list, customer QR scan) instead of a scheduled job —
    // this codebase has no cron/queue worker running, so a lazy check on
    // read keeps the fix self-contained with no extra process to operate.
    private function reapStaleReservations(): void
    {
        DiningTable::where('status', 'RESERVED')
            ->where('updated_at', '<', now()->subMinutes(self::RESERVATION_TIMEOUT_MINUTES))
            ->get()
            ->each(function (DiningTable $table) {
                $table->update(['status' => 'AVAILABLE']);
                SafeBroadcast::send(new TableStatusChanged($table));
            });
    }

    // GET /api/tables — staff/admin: list all tables with current status
    public function index()
    {
        $this->reapStaleReservations();

        $tables = DiningTable::with(['section', 'qrCode'])
            ->orderBy('table_number')
            ->get();

        return response()->json($tables);
    }

    // GET /api/tables/verify-qr?table=12&token=xyz
    // Used by the mobile QR ordering page to confirm the scanned code is
    // valid. Also the moment a table goes AVAILABLE -> RESERVED — an
    // already-OCCUPIED/NEEDS_CLEANING/RESERVED table is left alone, and
    // re-scanning an already-RESERVED table does not restart its timer.
    public function verifyQr(Request $request)
    {
        $this->reapStaleReservations();

        $table = DiningTable::where('table_number', $request->query('table'))
            ->with('qrCode')
            ->first();

        $token = $request->query('token');

        if (! $table || ! $table->qrCode || $table->qrCode->token !== $token || ! $table->qrCode->is_active) {
            return response()->json(['error' => 'Invalid or expired QR code'], 404);
        }

        if ($table->status === 'AVAILABLE') {
            $table->update(['status' => 'RESERVED']);
            SafeBroadcast::send(new TableStatusChanged($table));
        }

        return response()->json([
            'tableId' => $table->id,
            'tableNumber' => $table->table_number,
        ]);
    }

    // POST /api/tables — admin only
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'sectionId' => 'required|exists:table_sections,id',
            'tableNumber' => 'required|integer|unique:dining_tables,table_number',
            'capacity' => 'required|integer|min:1',
            'floor' => 'nullable|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $table = DiningTable::create([
            'section_id' => $request->input('sectionId'),
            'table_number' => $request->input('tableNumber'),
            'capacity' => $request->input('capacity'),
            'floor' => $request->input('floor', 1),
        ]);

        AuditLogger::record($request, 'create', 'dining_tables', $table->id, null, $table->toArray());

        return response()->json($table, 201);
    }

    // POST /api/tables/{id}/qr — admin only: (re)generate a table's QR code
    public function generateQr(Request $request, $id)
    {
        $table = DiningTable::findOrFail($id);

        $token = (string) Str::uuid();

        $qrCode = QrCodeModel::updateOrCreate(
            ['table_id' => $table->id],
            ['token' => $token, 'is_active' => true, 'generated_at' => now()]
        );

        $clientUrl = config('services.client_url');
        $url = "{$clientUrl}/order?table={$table->table_number}&token={$token}";

        // Generated as SVG (not PNG) so this works with zero extra PHP
        // extensions installed — no GD/Imagick required.
        $svg = QrCode::format('svg')->size(400)->generate($url);
        $imageDataUrl = 'data:image/svg+xml;base64,'.base64_encode($svg);

        AuditLogger::record($request, 'generate_qr', 'qr_codes', $qrCode->id, null, ['tableId' => $table->id, 'token' => $token]);

        return response()->json([
            'id' => $qrCode->id,
            'tableId' => $qrCode->table_id,
            'token' => $qrCode->token,
            'url' => $url,
            'imageDataUrl' => $imageDataUrl,
        ]);
    }

    // PATCH /api/tables/{id}/status — staff/admin
    public function updateStatus(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:AVAILABLE,OCCUPIED,NEEDS_CLEANING,RESERVED',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $table = DiningTable::findOrFail($id);
        $oldStatus = $table->status;
        $table->update(['status' => $request->input('status')]);

        AuditLogger::record($request, 'update', 'dining_tables', $table->id, ['status' => $oldStatus], ['status' => $table->status]);

        SafeBroadcast::send(new TableStatusChanged($table));

        return response()->json($table);
    }
}
