<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Set when a diner taps "Check bill". An order with this set and no
        // PAID payment is waiting at the counter for the cashier.
        Schema::table('orders', function (Blueprint $table) {
            $table->timestamp('bill_requested_at')->nullable()->after('special_instructions');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn('bill_requested_at');
        });
    }
};
