<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\CamelCaseAttributes;

class OrderItem extends Model
{
    use HasFactory, CamelCaseAttributes;

    public $timestamps = false;

    protected $fillable = ['order_id', 'item_id', 'quantity', 'unit_price', 'item_note', 'status'];
    protected $casts = ['unit_price' => 'decimal:2'];

    public function order(): BelongsTo
    {
        return $this->belongsTo(Order::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'item_id');
    }
}
