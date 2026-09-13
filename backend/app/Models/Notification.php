<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\CamelCaseAttributes;

class Notification extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $fillable = ['order_id', 'staff_id', 'customer_id', 'message', 'type', 'is_read'];
    protected $casts = ['is_read' => 'boolean'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function staff(): BelongsTo
    {
        return $this->belongsTo(Staff::class);
    }

    public function customer(): BelongsTo
    {
        return $this->belongsTo(Customer::class);
    }
}
