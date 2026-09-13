<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\CamelCaseAttributes;

class Attendance extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $table = 'attendance';

    protected $fillable = ['staff_id', 'type_id', 'timestamp', 'notes'];
    protected $casts = ['timestamp' => 'datetime'];

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function type(): BelongsTo
    {
        return $this->belongsTo(AttendanceType::class, 'type_id');
    }
}
