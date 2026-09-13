<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use App\Support\AuditLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class PaymentMethodController extends Controller
{
    // GET /api/payment-methods — admin only
    public function index()
    {
        return response()->json(PaymentMethod::orderBy('method_name')->get());
    }

    // GET /api/payment-methods/qr — any authenticated user (customer booking
    // flow needs this to render the scan-to-pay QR). Returns whichever
    // active method currently has a QR image uploaded — the frontend
    // doesn't need to know or hardcode which method that is.
    public function activeQr()
    {
        $method = PaymentMethod::where('is_active', true)
            ->get()
            ->first(fn (PaymentMethod $m) => $m->qrImageUrl !== null);

        return response()->json([
            'methodName' => $method?->method_name,
            'qrImageUrl' => $method?->qrImageUrl,
        ]);
    }

    // POST /api/payment-methods — admin only
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'methodName' => 'required|string|max:255|unique:payment_methods,method_name',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $method = PaymentMethod::create([
            'method_name' => $request->input('methodName'),
        ]);

        AuditLogger::record($request, 'create', 'payment_methods', $method->id, null, $method->toArray());

        return response()->json($method, 201);
    }

    // PATCH /api/payment-methods/{id} — admin only (rename / toggle active)
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'methodName' => 'sometimes|string|max:255|unique:payment_methods,method_name,'.$id,
            'isActive' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        $method = PaymentMethod::findOrFail($id);
        $oldValue = $method->toArray();

        $data = [];
        if ($request->has('methodName')) {
            $data['method_name'] = $request->input('methodName');
        }
        if ($request->has('isActive')) {
            $data['is_active'] = $request->boolean('isActive');
        }
        $method->update($data);

        AuditLogger::record($request, 'update', 'payment_methods', $method->id, $oldValue, $method->toArray());

        return response()->json($method);
    }

    // POST /api/payment-methods/{id}/qr-image — admin only: upload/replace
    // the scan-to-pay QR customers see for this method during checkout.
    public function uploadQr(Request $request, $id)
    {
        $method = PaymentMethod::findOrFail($id);

        $validator = Validator::make($request->all(), [
            // Matches this server's php.ini upload_max_filesize (2MB) —
            // see PaymentController::uploadProof for the same constraint.
            'qrImage' => 'required|image|max:2048',
        ]);

        if ($validator->fails()) {
            return response()->json(['error' => $validator->errors()->first()], 400);
        }

        foreach (PaymentMethod::QR_EXTENSIONS as $ext) {
            Storage::disk('public')->delete("payment-method-qr/{$id}.{$ext}");
        }

        $file = $request->file('qrImage');
        $ext = strtolower($file->getClientOriginalExtension() ?: $file->extension());
        $file->storeAs('payment-method-qr', "{$id}.{$ext}", 'public');

        AuditLogger::record($request, 'upload_qr', 'payment_methods', $method->id);

        return response()->json($method->fresh());
    }
}
