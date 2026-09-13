<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\CamelCaseAttributes;

class Booking extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $fillable = [
        'customer_id', 'table_id', 'booking_date', 'booking_time',
        'guest_count', 'special_request', 'status', 'deposit_amount',
    ];
    protected $casts = ['booking_date' => 'date', 'deposit_amount' => 'decimal:2'];

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }

    public function table(): BelongsTo
    {
        return $this->belongsTo(DiningTable::class, 'table_id');
    }

    public function statusLogs(): HasMany
    {
        return $this->hasMany(BookingStatusLog::class);
    }

    public function payments(): HasMany
    {
        return $this->hasMany(Payment::class);
    }
}
