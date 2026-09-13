<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\CamelCaseAttributes;

class Category extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $fillable = ['category_name', 'display_order', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function menuItems(): HasMany
    {
        return $this->hasMany(MenuItem::class);
    }
}
