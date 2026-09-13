<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')->constrained('customers');
            $table->foreignId('table_id')->nullable()->constrained('dining_tables')->nullOnDelete();
            $table->date('booking_date');
            $table->string('booking_time');
            $table->unsignedInteger('guest_count');
            $table->string('special_request')->nullable();
            $table->string('status')->default('PENDING');
            $table->decimal('deposit_amount', 10, 2)->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
