<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Attendance;
use App\Models\AttendanceType;
use App\Models\Booking;
use App\Models\BookingStatusLog;
use App\Models\Category;
use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderStatusLog;
use App\Models\Payment;
use App\Models\PaymentMethod;
use App\Models\Staff;
use App\Models\StaffRole;
use App\Models\TableSection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;

// Bulk demo data for demos and for trying out the admin pages with a
// realistic amount of history:
//
//   php artisan db:seed --class=DemoDataSeeder --force
//
// Additive only — it never edits or deletes existing rows. Every fake person
// has an @demo.example.com email (password "password123"). Orders are all
// COMPLETED or CANCELLED and bookings are all in the past with a final status,
// so nothing shows up as live work on the Live Orders / Bookings pages.
// Running it twice is a no-op.
class DemoDataSeeder extends Seeder
{
    private const DOMAIN = '@demo.example.com';

    private const CUSTOMERS = [
        'Aye Chan', 'Hla Myint', 'Su Su Hlaing', 'Kyaw Zin', 'Mya Thandar', 'Zaw Min Htet', 'Khin Thazin',
        'Nay Chi Oo', 'Phyo Wai', 'Htet Htet Aung', 'Min Thu', 'Ei Mon', 'Thura Soe', 'Yadanar Phyo',
        'Aung Ko Ko', 'Moe Moe Lwin', 'Lin Lin', 'Wai Yan Tun', 'Cho Cho', 'Sai Kham', 'Nang Mo', 'Ko Ko Gyi',
        'Thet Naing', 'May Phyu', 'Ye Yint', 'Hnin Si', 'Sithu Aung', 'Pyae Sone', 'Shwe Yee', 'Zin Mar',
        'Arkar Htun', 'Nandar', 'Kaung Myat', 'Thae Su', 'Lwin Oo', 'Swe Zin', 'Naing Lin', 'Hninn Wutt', 'Bo Bo', 'Tun Tun',
    ];

    private const STAFF = [
        'Thiha Soe', 'Ma Ngwe', 'Kyaw Swar', 'Hnin Pwint', 'Zayar Linn', 'Mi Mi Khaing',
        'Aung Thura', 'Su Mon', 'Htoo Lwin', 'Ei Phyu', 'Naing Win', 'Khaing Zar',
    ];

    // [category, name, description, price, prep minutes]
    private const MENU = [
        ['Grilled Specials', 'Lemongrass Grilled Chicken', 'Half chicken marinated in lemongrass and turmeric, charcoal-grilled.', 14500, 25],
        ['Grilled Specials', 'Spicy Grilled Mutton Chops', 'Mutton chops rubbed with chili and cumin, finished over open flame.', 24000, 30],
        ['Grilled Specials', 'Grilled Garlic Mussels', 'Mussels grilled in the shell with garlic butter.', 15500, 15],
        ['Grilled Specials', 'Mixed Seafood Platter', 'Prawns, squid and fish fillet with three dips. Serves two.', 38000, 35],
        ['Starters', 'Tea Leaf Salad (Lahpet Thoke)', 'Fermented tea leaves, crispy beans, peanuts, sesame and tomato.', 6500, 8],
        ['Starters', 'Samosa Platter', 'Six crisp samosas with tamarind chutney.', 5000, 10],
        ['Starters', 'Crispy Fish Cakes', 'Spiced fish cakes with sweet chili sauce.', 7500, 12],
        ['Starters', 'Ginger Salad', 'Pickled ginger, fried garlic, nuts and lime.', 5500, 8],
        ['Starters', 'Fried Tofu with Tamarind Dip', 'Shan-style chickpea tofu, fried golden.', 6000, 10],
        ['Rice & Noodles', 'Mohinga', 'Catfish noodle soup, the national breakfast.', 5500, 10],
        ['Rice & Noodles', 'Shan Noodles', 'Rice noodles with marinated chicken and pickled mustard greens.', 6500, 12],
        ['Rice & Noodles', 'Coconut Chicken Noodles (Ohn No Khao Swe)', 'Wheat noodles in a coconut chicken curry.', 7500, 15],
        ['Rice & Noodles', 'Burmese Fried Rice', 'Wok-fried rice with egg, garlic and spring onion.', 5000, 10],
        ['Rice & Noodles', 'Nan Gyi Thoke', 'Thick rice noodle salad with chicken curry and chili oil.', 6500, 10],
        ['Rice & Noodles', 'Plain Steamed Rice', 'Bowl of steamed jasmine rice.', 1500, 3],
        ['Desserts', 'Shwe Yin Aye', 'Cool coconut milk dessert with sago and jelly.', 4500, 5],
        ['Desserts', 'Mont Let Saung', 'Sweet glutinous rice balls in palm sugar syrup.', 4000, 5],
        ['Desserts', 'Grilled Banana with Coconut', 'Charcoal-grilled banana, toasted coconut, palm sugar.', 4500, 8],
        ['Drinks', 'Laphet Yay (Milk Tea)', 'Sweet Burmese milk tea.', 2000, 3],
        ['Drinks', 'Fresh Sugarcane Juice', 'Pressed to order.', 2500, 4],
        ['Drinks', 'Iced Lemon Tea', 'House iced tea with lemon.', 2500, 3],
        ['Drinks', 'Mandalay Beer', '500ml bottle.', 4000, 2],
        ['Drinks', 'Bottled Water', '500ml.', 800, 1],
        ['Drinks', 'Fresh Coconut', 'Served in the shell.', 3000, 3],
    ];

    private const NOTES = [
        'Less spicy please', 'No peanuts', 'Extra lime', 'Well done', 'Bring with the main', 'No onion',
    ];

    private Carbon $now;

    public function run(): void
    {
        if (Customer::where('email', 'like', '%'.self::DOMAIN)->exists()) {
            $this->command->warn('Demo data is already present — nothing to do.');

            return;
        }

        mt_srand(2026); // same dataset on every run
        $this->now = now();
        $password = Hash::make('password123');

        $this->command->info('Seeding demo data...');

        [$staff, $admin] = $this->staff($password);
        $customers = $this->customers($password);
        $items = $this->menu();
        $tables = $this->tables();
        $this->attendance($staff);
        $this->orders($customers, $staff, $items, $tables);
        $this->bookings($customers, $staff, $tables);

        $this->command->info('Done. Demo logins use password "password123" (emails end in '.self::DOMAIN.').');
    }

    private function pick(array|\Illuminate\Support\Collection $list)
    {
        $list = is_array($list) ? array_values($list) : $list->values()->all();

        return $list[mt_rand(0, count($list) - 1)];
    }

    private function slug(string $name, int $n): string
    {
        return strtolower(preg_replace('/[^a-z0-9]+/i', '.', $name)).'.'.$n.self::DOMAIN;
    }

    /** A random moment N days back, during opening hours (11:00–21:30). */
    private function when(int $daysBack): Carbon
    {
        return $this->now->copy()->subDays($daysBack)->setTime(mt_rand(11, 21), mt_rand(0, 59));
    }

    private function staff(string $password): array
    {
        $role = StaffRole::firstOrCreate(
            ['role_name' => 'Staff'],
            ['description' => 'Takes orders and serves tables', 'permissions' => 'orders,tables']
        );
        $admin = Admin::first();

        $staff = collect(self::STAFF)->map(fn ($name, $i) => Staff::create([
            'name' => $name,
            'email' => $this->slug($name, $i + 1),
            'phone' => '09-'.mt_rand(250000000, 799999999),
            'password' => $password,
            'role_id' => $role->id,
            'hired_date' => $this->now->copy()->subDays(mt_rand(30, 900))->toDateString(),
            'is_active' => $i < count(self::STAFF) - 1, // one former employee
            'managed_by_admin_id' => $admin?->id,
        ]));

        return [$staff, $admin];
    }

    private function customers(string $password)
    {
        return collect(self::CUSTOMERS)->map(function ($name, $i) use ($password) {
            $c = Customer::create([
                'name' => $name,
                'email' => $this->slug($name, $i + 1),
                'phone' => '09-'.mt_rand(250000000, 799999999),
                'password' => $password,
                'is_active' => true,
            ]);
            $joined = $this->when(mt_rand(20, 200));
            $c->forceFill(['registration_date' => $joined, 'created_at' => $joined, 'updated_at' => $joined])->save();

            return $c;
        });
    }

    private function menu()
    {
        $order = Category::max('display_order') ?? 0;
        $categories = [];

        return collect(self::MENU)->map(function ($row) use (&$categories, &$order) {
            [$cat, $name, $description, $price, $prep] = $row;
            $categories[$cat] ??= Category::firstOrCreate(['category_name' => $cat], ['display_order' => ++$order]);

            return MenuItem::firstOrCreate(
                ['category_id' => $categories[$cat]->id, 'name' => $name],
                ['description' => $description, 'price' => $price, 'prep_time_min' => $prep]
            );
        });
    }

    private function tables()
    {
        $indoor = TableSection::firstOrCreate(['section_name' => 'Indoor'], ['description' => 'Air-conditioned indoor seating']);
        $river = TableSection::firstOrCreate(['section_name' => 'Riverfront'], ['description' => 'Tables facing the Yangon River']);

        foreach (range(1, 35) as $n) {
            DiningTable::firstOrCreate(
                ['table_number' => $n],
                ['capacity' => [2, 4, 4, 6][$n % 4], 'section_id' => $n <= 10 ? $indoor->id : $river->id]
            );
        }

        return DiningTable::all();
    }

    private function attendance($staff): void
    {
        $in = AttendanceType::firstOrCreate(['type_name' => 'Clock In']);
        $out = AttendanceType::firstOrCreate(['type_name' => 'Clock Out']);

        foreach ($staff->where('is_active', true) as $member) {
            foreach (range(1, 14) as $daysBack) {
                if (mt_rand(1, 100) <= 25) {
                    continue; // day off
                }
                $start = $this->now->copy()->subDays($daysBack)->setTime(mt_rand(9, 11), mt_rand(0, 40));
                foreach ([[$in, $start], [$out, $start->copy()->addHours(8)->addMinutes(mt_rand(0, 45))]] as [$type, $at]) {
                    $row = Attendance::create(['staff_id' => $member->id, 'type_id' => $type->id, 'timestamp' => $at]);
                    $row->forceFill(['created_at' => $at, 'updated_at' => $at])->save();
                }
            }
        }
    }

    private function orders($customers, $staff, $items, $tables): void
    {
        $active = $staff->where('is_active', true);

        foreach (range(1, 160) as $_) {
            $placed = $this->when(mt_rand(0, 60));
            if ($placed->greaterThan($this->now)) {
                $placed = $this->now->copy()->subHours(2);
            }

            // ~60% of diners were logged in; the rest ordered as guests.
            $customer = mt_rand(1, 100) <= 60 ? $this->pick($customers) : null;
            $walkin = ! $customer && mt_rand(1, 100) <= 25;
            $final = mt_rand(1, 100) <= 6 ? 'CANCELLED' : 'COMPLETED';

            $lines = collect(range(1, mt_rand(1, 5)))
                ->map(fn () => $this->pick($items))
                ->unique('id')
                ->map(fn ($item) => ['item' => $item, 'qty' => mt_rand(1, 3)]);

            $order = new Order();
            $order->forceFill([
                'table_id' => $this->pick($tables)->id,
                'customer_id' => $customer?->id,
                'staff_id' => $walkin ? $this->pick($active)->id : null,
                'is_walkin' => $walkin,
                'status' => $final,
                'total_amount' => $lines->sum(fn ($l) => $l['item']->price * $l['qty']),
                'special_instructions' => mt_rand(1, 100) <= 15 ? $this->pick(self::NOTES) : null,
                'created_at' => $placed,
                'updated_at' => $placed->copy()->addMinutes(mt_rand(40, 90)),
            ])->save();

            foreach ($lines as $line) {
                $order->items()->create([
                    'item_id' => $line['item']->id,
                    'quantity' => $line['qty'],
                    'unit_price' => $line['item']->price,
                    'item_note' => mt_rand(1, 100) <= 10 ? $this->pick(self::NOTES) : null,
                    'status' => $final === 'CANCELLED' ? 'CANCELLED' : 'SERVED',
                ]);
            }

            // Status history, one entry every few minutes.
            $path = $final === 'CANCELLED' ? ['PLACED', 'CANCELLED'] : ['PLACED', 'PREPARING', 'READY', 'SERVED', 'COMPLETED'];
            $at = $placed->copy();
            for ($i = 1; $i < count($path); $i++) {
                $at = $at->copy()->addMinutes(mt_rand(4, 18));
                OrderStatusLog::create([
                    'order_id' => $order->id,
                    'staff_id' => $this->pick($active)->id,
                    'old_status' => $path[$i - 1],
                    'new_status' => $path[$i],
                    'changed_at' => $at,
                ]);
            }
        }
    }

    private function bookings($customers, $staff, $tables): void
    {
        $method = PaymentMethod::firstOrCreate(['method_name' => 'KBZPay']);
        $active = $staff->where('is_active', true);
        $statuses = ['COMPLETED', 'COMPLETED', 'COMPLETED', 'CONFIRMED', 'CANCELLED', 'NO_SHOW'];

        foreach (range(1, 45) as $_) {
            $date = $this->now->copy()->subDays(mt_rand(1, 60));
            $status = $this->pick($statuses);
            $deposit = in_array($status, ['COMPLETED', 'CONFIRMED'], true) ? $this->pick([0, 5000, 10000, 20000]) : 0;

            $booking = new Booking();
            $booking->forceFill([
                'customer_id' => $this->pick($customers)->id,
                'table_id' => $this->pick($tables)->id,
                'booking_date' => $date->toDateString(),
                'booking_time' => $this->pick(['12:00', '12:30', '13:00', '18:30', '19:00', '19:30', '20:00']),
                'guest_count' => mt_rand(2, 8),
                'special_request' => mt_rand(1, 100) <= 20 ? $this->pick(['Birthday', 'Window seat', 'High chair needed', 'Quiet corner']) : null,
                'status' => $status,
                'deposit_amount' => $deposit,
                'created_at' => $date->copy()->subDays(mt_rand(1, 7)),
                'updated_at' => $date,
            ])->save();

            BookingStatusLog::create([
                'booking_id' => $booking->id,
                'staff_id' => $this->pick($active)->id,
                'old_status' => 'PENDING',
                'new_status' => $status,
                'changed_at' => $booking->created_at->copy()->addHours(mt_rand(1, 20)),
            ]);

            if ($deposit > 0) {
                Payment::create([
                    'booking_id' => $booking->id,
                    'method_id' => $method->id,
                    'amount' => $deposit,
                    'payment_date' => $booking->created_at->copy()->addHours(2),
                    'transaction_id' => 'DEMO'.mt_rand(100000, 999999),
                    'status' => 'PAID',
                ]);
            }
        }
    }
}
