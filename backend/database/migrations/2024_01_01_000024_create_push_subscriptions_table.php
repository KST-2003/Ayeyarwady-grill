<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Admins and staff live in separate tables whose ids overlap, so a
        // subscription is identified by (user_type, user_id) with no real
        // foreign key. Rows are removed on logout, on a 404/410 from the push
        // service, and when an account's credentials change or it is disabled.
        Schema::create('push_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->string('user_type', 10); // ADMIN | STAFF
            $table->unsignedBigInteger('user_id');
            $table->text('endpoint');
            $table->string('endpoint_hash', 64)->unique(); // sha256 — endpoints are too long to index directly
            $table->string('p256dh');
            $table->string('auth');
            $table->string('user_agent')->nullable();
            $table->timestamps();

            $table->index(['user_type', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('push_subscriptions');
    }
};
