<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;

class AuditLogController extends Controller
{
    // GET /api/audit-logs — admin only
    public function index()
    {
        $logs = AuditLog::with('admin')
            ->orderByDesc('timestamp')
            ->take(200)
            ->get();

        return response()->json($logs);
    }

    // DELETE /api/audit-logs/{id} — admin only: clear a single log entry
    public function destroy($id)
    {
        AuditLog::findOrFail($id)->delete();

        return response()->json(null, 204);
    }
}
