<?php

use App\Models\DiningTable;
use App\Models\TableSection;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        $indoor = TableSection::firstOrCreate(['section_name' => 'Indoor'], ['description' => 'Air-conditioned indoor seating']);
        $river = TableSection::firstOrCreate(['section_name' => 'Riverfront'], ['description' => 'Tables facing the Yangon River']);

        foreach (range(21, 35) as $n) {
            DiningTable::firstOrCreate(
                ['table_number' => $n],
                ['capacity' => [2, 4, 4, 6][$n % 4], 'section_id' => $n <= 10 ? $indoor->id : $river->id]
            );
        }
    }

    public function down(): void
    {
        DiningTable::whereBetween('table_number', [21, 35])->doesntHave('orders')->doesntHave('bookings')->delete();
    }
};
