<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Traits\CamelCaseAttributes;

class MenuItemImage extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $fillable = ['item_id', 'image_url', 'is_primary'];
    protected $casts = ['is_primary' => 'boolean'];

    public function item(): BelongsTo
    {
        return $this->belongsTo(MenuItem::class, 'item_id');
    }
}
