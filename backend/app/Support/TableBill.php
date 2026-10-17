<?php

namespace App\Support;

use App\Models\DiningTable;
use App\Models\Order;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

// The "check" for a table: every order at it that the diner has asked to pay
// for (bill_requested_at set) and that has no PAID payment yet. Shared by the
// QR page (guest receipt), the cashier page and the live table cards.
class TableBill
{
    // Orders older than this are never swept into a new bill, so stale rows
    // from days ago can't land on a fresh diner's check.
    const SESSION_HOURS = 12;

    private static function unpaid(Builder $query): Builder
    {
        return $query->where('status', '!=', 'CANCELLED')
            ->whereDoesntHave('payments', fn ($p) => $p->where('status', 'PAID'));
    }

    /** Orders the diner can still ask the bill for. */
    public static function billable(int|string $tableId): Builder
    {
        return self::unpaid(Order::where('table_id', $tableId))
            ->whereNull('bill_requested_at')
            ->where('created_at', '>=', now()->subHours(self::SESSION_HOURS));
    }

    /** Orders already billed and waiting for the cashier. */
    public static function pending(int|string $tableId): Builder
    {
        return self::unpaid(Order::where('table_id', $tableId))
            ->whereNotNull('bill_requested_at');
    }

    /** Extra fields for a table's API / broadcast payload. */
    public static function summary(DiningTable $table): array
    {
        $orders = self::pending($table->id)->get(['total_amount', 'bill_requested_at']);

        return [
            'amountDue' => (float) $orders->sum('total_amount'),
            'billRequested' => $orders->isNotEmpty(),
        ];
    }

    /** Receipt data, or null when nothing is waiting to be paid. */
    public static function receipt(DiningTable $table): ?array
    {
        $orders = self::pending($table->id)->with('items.item')->orderBy('id')->get();
        if ($orders->isEmpty()) {
            return null;
        }

        $lines = $orders->flatMap->items
            ->groupBy(fn ($i) => $i->item_id.'|'.$i->unit_price)
            ->map(fn (Collection $group) => [
                'name' => $group->first()->item->name,
                'quantity' => (int) $group->sum('quantity'),
                'unitPrice' => (float) $group->first()->unit_price,
                'lineTotal' => (float) $group->sum(fn ($i) => $i->unit_price * $i->quantity),
            ])
            ->values();

        return [
            'tableId' => $table->id,
            'tableNumber' => $table->table_number,
            'requestedAt' => $orders->min('bill_requested_at'),
            'orderIds' => $orders->pluck('id')->all(),
            'lines' => $lines->all(),
            'total' => (float) $orders->sum('total_amount'),
        ];
    }
}
