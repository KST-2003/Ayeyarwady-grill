<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\CamelCaseAttributes;

class StaffRole extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $fillable = ['role_name', 'description', 'permissions'];

    public function staff(): HasMany
    {
        return $this->hasMany(Staff::class, 'role_id');
    }
}
