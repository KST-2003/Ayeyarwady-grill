<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\CamelCaseAttributes;

class Staff extends Authenticatable
{
    use HasFactory, HasApiTokens, CamelCaseAttributes;

    protected $table = 'staff';

    protected $fillable = [
        'name', 'email', 'phone', 'password', 'hired_date',
        'is_active', 'role_id', 'managed_by_admin_id',
    ];
    protected $hidden = ['password'];
    protected $casts = ['is_active' => 'boolean', 'hired_date' => 'date'];

    public function role(): BelongsTo
    {
        return $this->belongsTo(StaffRole::class, 'role_id');
    }

    public function managedByAdmin(): BelongsTo
    {
        return $this->belongsTo(Admin::class, 'managed_by_admin_id');
    }

    public function attendance(): HasMany
    {
        return $this->hasMany(Attendance::class);
    }

    public function ordersHandled(): HasMany
    {
        return $this->hasMany(Order::class, 'staff_id');
    }

    public function orderStatusLogs(): HasMany
    {
        return $this->hasMany(OrderStatusLog::class);
    }

    public function bookingStatusLogs(): HasMany
    {
        return $this->hasMany(BookingStatusLog::class);
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class, 'staff_id');
    }

    public function getRoleTypeAttribute(): string
    {
        return 'STAFF';
    }
}
