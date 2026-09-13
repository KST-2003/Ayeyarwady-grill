<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Laravel\Sanctum\HasApiTokens;
use App\Traits\CamelCaseAttributes;

class Admin extends Authenticatable
{
    use HasFactory, HasApiTokens, CamelCaseAttributes;

    protected $fillable = ['name', 'email', 'phone', 'password', 'is_active'];
    protected $hidden = ['password'];
    protected $casts = ['is_active' => 'boolean'];

    public function staffManaged(): HasMany
    {
        return $this->hasMany(Staff::class, 'managed_by_admin_id');
    }

    public function auditLogs(): HasMany
    {
        return $this->hasMany(AuditLog::class);
    }

    // Used by RoleMiddleware and controllers to identify this account's role
    public function getRoleTypeAttribute(): string
    {
        return 'ADMIN';
    }
}
