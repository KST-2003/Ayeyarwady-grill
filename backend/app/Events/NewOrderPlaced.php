<?php

namespace App\Events;

use App\Contracts\SendsWebPush;
use App\Models\Order;
use Illuminate\Foundation\Events\Dispatchable;

class NewOrderPlaced implements SendsWebPush
{
    use Dispatchable;

    public function __construct(public Order $order) {}

    public function webPushRoles(): array
    {
        return ['ADMIN', 'STAFF'];
    }

    public function webPushPayload(): array
    {
        $table = $this->order->table;

        return [
            'title' => 'New order',
            'body' => $table ? "New order placed for Table {$table->table_number}." : 'New walk-in order placed.',
            'url' => '/staff/orders',
        ];
    }
}
