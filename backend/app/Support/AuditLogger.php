<?php

namespace App\Support;

use App\Models\AuditLog;
use Illuminate\Http\Request;

class AuditLogger
{
    // audit_logs.admin_id only has a place for an Admin actor (no staff_id
    // column on this table), so a Staff-performed action is simply not
    // recorded here — it isn't attributable the way the schema models it.
    public static function record(
        Request $request,
        string $action,
        string $tableName,
        string|int|null $recordId = null,
        mixed $oldValue = null,
        mixed $newValue = null,
    ): void {
        if ($request->user()?->roleType !== 'ADMIN') {
            return;
        }

        AuditLog::create([
            'admin_id' => $request->user()->id,
            'action' => $action,
            'table_name' => $tableName,
            'record_id' => $recordId !== null ? (string) $recordId : null,
            'old_value' => $oldValue !== null ? json_encode($oldValue) : null,
            'new_value' => $newValue !== null ? json_encode($newValue) : null,
        ]);
    }
}
