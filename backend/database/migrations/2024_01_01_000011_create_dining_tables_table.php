<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('dining_tables', function (Blueprint $table) {
            $table->id();
            $table->foreignId('section_id')->constrained('table_sections');
            $table->unsignedInteger('table_number')->unique();
            $table->unsignedInteger('capacity');
            $table->string('status')->default('AVAILABLE');
            $table->unsignedInteger('floor')->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('dining_tables');
    }
};
