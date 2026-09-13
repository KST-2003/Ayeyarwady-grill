<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\CamelCaseAttributes;

class BookingStatusLog extends Model
{
    use HasFactory, CamelCaseAttributes;

    public $timestamps = false;

    protected $fillable = ['booking_id', 'staff_id', 'old_status', 'new_status', 'changed_at'];
    protected $casts = ['changed_at' => 'datetime'];

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }
}
