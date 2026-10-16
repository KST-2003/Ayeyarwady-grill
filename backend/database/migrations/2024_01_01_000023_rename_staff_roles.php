<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

// The system only has admins and staff — no manager role.
return new class extends Migration
{
    public function up(): void
    {
        DB::table('staff_roles')->where('role_name', 'Manager')->update(['role_name' => 'Admin']);
        DB::table('staff_roles')->where('role_name', 'Waiter')->update(['role_name' => 'Staff']);
    }

    public function down(): void
    {
        DB::table('staff_roles')->where('role_name', 'Admin')->update(['role_name' => 'Manager']);
        DB::table('staff_roles')->where('role_name', 'Staff')->update(['role_name' => 'Waiter']);
    }
};
