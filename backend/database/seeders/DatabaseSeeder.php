<?php

namespace Database\Seeders;

use App\Models\Admin;
use App\Models\Category;
use App\Models\Customer;
use App\Models\DiningTable;
use App\Models\MenuItem;
use App\Models\MenuItemImage;
use App\Models\PaymentMethod;
use App\Models\Staff;
use App\Models\StaffRole;
use App\Models\TableSection;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('Seeding database...');

        // Roles
        $managerRole = StaffRole::firstOrCreate(
            ['role_name' => 'Manager'],
            ['description' => 'Full staff permissions', 'permissions' => 'all']
        );
        $waiterRole = StaffRole::firstOrCreate(
            ['role_name' => 'Waiter'],
            ['description' => 'Table service', 'permissions' => 'orders,tables']
        );

        // Accounts — same password for all demo accounts: "password123"
        $password = Hash::make('password123');

        $admin = Admin::firstOrCreate(
            ['email' => 'admin@ayeyarwadygrill.com'],
            ['name' => 'Kaung Satt Kyaw', 'password' => $password]
        );

        Staff::firstOrCreate(
            ['email' => 'waiter@ayeyarwadygrill.com'],
            [
                'name' => 'Thiha Aung',
                'password' => $password,
                'role_id' => $waiterRole->id,
                'managed_by_admin_id' => $admin->id,
            ]
        );

        Customer::firstOrCreate(
            ['email' => 'customer@example.com'],
            [
                'name' => 'Thinzar Win',
                'password' => $password,
                'phone' => '09-123-456-789',
            ]
        );

        // Payment methods
        foreach (['KBZPay', 'Cash', 'Card'] as $methodName) {
            PaymentMethod::firstOrCreate(['method_name' => $methodName]);
        }

        // Table sections + tables
        $riverfront = TableSection::firstOrCreate(
            ['section_name' => 'Riverfront'],
            ['description' => 'Tables facing the Yangon River']
        );
        $indoor = TableSection::firstOrCreate(
            ['section_name' => 'Indoor'],
            ['description' => 'Air-conditioned indoor seating']
        );

        foreach ([[8, 4, $riverfront->id], [12, 4, $riverfront->id], [15, 6, $indoor->id]] as [$num, $cap, $sectionId]) {
            DiningTable::firstOrCreate(
                ['table_number' => $num],
                ['capacity' => $cap, 'section_id' => $sectionId]
            );
        }

        // Menu
        $grilled = Category::firstOrCreate(
            ['category_name' => 'Grilled Specials'],
            ['display_order' => 1]
        );
        $drinks = Category::firstOrCreate(
            ['category_name' => 'Drinks'],
            ['display_order' => 2]
        );

        $menuItems = [
            [
                'category_id' => $grilled->id,
                'name' => 'Grilled Tiger Prawns',
                'description' => 'Jumbo river prawns marinated in garlic butter and chili, grilled until smoky and succulent.',
                'price' => 18500,
                'image' => '1-1789575515.jpg',
            ],
            [
                'category_id' => $grilled->id,
                'name' => 'Whole Grilled River Fish',
                'description' => 'Fresh Ayeyarwady river fish stuffed with lemongrass and kaffir lime, charcoal-grilled whole.',
                'price' => 22000,
                'image' => '2-1789575515.jpeg',
            ],
            [
                'category_id' => $grilled->id,
                'name' => 'Beef Satay Skewers',
                'description' => 'Tender beef strips on bamboo skewers with housemade peanut sauce and pickled cucumber.',
                'price' => 12000,
                'image' => '3-1789575515.webp',
            ],
            [
                'category_id' => $grilled->id,
                'name' => 'Charcoal BBQ Pork Ribs',
                'description' => 'Slow-grilled pork ribs glazed in a smoky tamarind BBQ sauce, finished with spring onion.',
                'price' => 21000,
                'image' => '4-1789575515.jpg',
            ],
            [
                'category_id' => $grilled->id,
                'name' => 'Butter Grilled Fish Fillet',
                'description' => 'Flaky white fish fillet grilled in herb butter, served with a squeeze of fresh lime.',
                'price' => 19500,
                'image' => '5-1789575515.jpeg',
            ],
            [
                'category_id' => $grilled->id,
                'name' => 'Charred Squid & Chili Dip',
                'description' => 'Whole grilled squid rings over charcoal, served with a fiery Myanmar-style chili dip.',
                'price' => 16000,
                'image' => '6-1789575515.jpeg',
            ],
            [
                'category_id' => $drinks->id,
                'name' => 'Myanmar Beer',
                'description' => '500ml draft',
                'price' => 4000,
                'image' => '7-1788941405.jpg',
            ],
        ];
        foreach ($menuItems as $item) {
            $menuItem = MenuItem::firstOrCreate(
                ['category_id' => $item['category_id'], 'name' => $item['name']],
                ['description' => $item['description'], 'price' => $item['price']]
            );

            // Photos are committed in storage/app/public/menu-item-images/;
            // the URL is built from APP_URL, same as MenuController::uploadImage.
            MenuItemImage::firstOrCreate(
                ['item_id' => $menuItem->id, 'is_primary' => true],
                ['image_url' => Storage::disk('public')->url('menu-item-images/'.$item['image'])]
            );
        }

        $this->command->info('Seed complete.');
        $this->command->info('Demo logins (password: password123):');
        $this->command->info('  Admin:    admin@ayeyarwadygrill.com');
        $this->command->info('  Staff:    waiter@ayeyarwadygrill.com');
        $this->command->info('  Customer: customer@example.com');
    }
}
