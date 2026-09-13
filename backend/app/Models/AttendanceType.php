<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\CamelCaseAttributes;

class AttendanceType extends Model
{
    use HasFactory, CamelCaseAttributes;

    protected $fillable = ['type_name'];

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class, 'type_id');
    }
}
