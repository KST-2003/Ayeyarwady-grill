<?php

namespace App\Events;

use App\Contracts\SendsWebPush;
use App\Models\DiningTable;
use Illuminate\Foundation\Events\Dispatchable;

class BillRequested implements SendsWebPush
{
    use Dispatchable;

    public function __construct(public DiningTable $table, public float $total) {}

    public function webPushRoles(): array
    {
        return ['ADMIN', 'STAFF'];
    }

    public function webPushPayload(): array
    {
        return [
            'title' => 'Collect money',
            'body' => "Table {$this->table->table_number} asked for the bill — ".number_format($this->total).' MMK.',
            'url' => '/staff/cashier/'.$this->table->id,
        ];
    }
}
