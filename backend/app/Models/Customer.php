<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\CamelCaseAttributes;

class Customer extends Authenticatable
{
    use HasFactory, HasApiTokens, CamelCaseAttributes;

    protected $fillable = [
        'name', 'email', 'phone', 'address', 'password',
        'registration_date', 'is_active',
    ];
    protected $hidden = ['password'];
    protected $casts = ['is_active' => 'boolean', 'registration_date' => 'datetime'];

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'customer_id');
    }

    public function getRoleTypeAttribute(): string
    {
        return 'CUSTOMER';
    }
}
