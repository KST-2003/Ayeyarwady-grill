<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\CamelCaseAttributes;

class AuditLog extends Model
{
    use HasFactory, CamelCaseAttributes;

    public $timestamps = false;

    protected $fillable = ['admin_id', 'action', 'table_name', 'record_id', 'old_value', 'new_value', 'timestamp'];
    protected $casts = ['timestamp' => 'datetime'];

    public function admin(): BelongsTo
    {
        return $this->belongsTo(Admin::class);
    }
}
