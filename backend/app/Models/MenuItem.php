<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\CamelCaseAttributes;

class MenuItem extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $fillable = [
        'category_id', 'name', 'description', 'price',
        'is_available', 'prep_time_min',
    ];
    protected $casts = ['is_available' => 'boolean', 'price' => 'decimal:2'];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(MenuItemImage::class, 'item_id');
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class, 'item_id');
    }
}
