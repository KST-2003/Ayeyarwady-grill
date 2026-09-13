<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;
use App\Traits\CamelCaseAttributes;

class Payment extends Model
{
    use HasFactory, CamelCaseAttributes;

    public $timestamps = false;

    protected $fillable = [
        'order_id', 'booking_id', 'method_id', 'amount',
        'payment_date', 'transaction_id', 'status', 'notes',
    ];
    protected $casts = ['amount' => 'decimal:2', 'payment_date' => 'datetime'];

    // Not a real column — the schema has no image field for payments, so a
    // customer-uploaded proof-of-payment screenshot is stored on disk (the
    // `public` storage disk) and only its relative path is kept in the
    // existing `notes` column. This accessor turns that path back into a
    // browsable URL for the frontend without adding anything to the schema.
    protected $appends = ['screenshot_url'];

    public function getScreenshotUrlAttribute(): ?string
    {
        return $this->notes ? Storage::disk('public')->url($this->notes) : null;
    }

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class);
    }

    public function method(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class, 'method_id');
    }
}
