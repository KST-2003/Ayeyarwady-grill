<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\CamelCaseAttributes;

class TableSection extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $fillable = ['section_name', 'description'];

    public function tables(): HasMany
    {
        return $this->hasMany(DiningTable::class, 'section_id');
    }
}
