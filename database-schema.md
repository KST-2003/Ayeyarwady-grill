# Ayeyarwady Grill — Database Schema

21 domain tables (matching the class diagram, Figure 2.2) + 1 authentication
infrastructure table added by Laravel Sanctum = **22 tables total**.

---

## People / Access (4 tables)

### `admins`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| name | string | |
| email | string | unique |
| phone | string | nullable |
| password | string | hashed |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

### `staff_roles`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| role_name | string | unique — e.g. Manager, Waiter |
| description | string | nullable |
| permissions | string | nullable |
| created_at, updated_at | timestamp | |

### `staff`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| name | string | |
| email | string | unique |
| phone | string | nullable |
| password | string | hashed |
| hired_date | date | nullable |
| is_active | boolean | default true |
| role_id | FK → staff_roles.id | |
| managed_by_admin_id | FK → admins.id | nullable |
| created_at, updated_at | timestamp | |

### `customers`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| name | string | |
| email | string | unique |
| phone | string | nullable |
| address | string | nullable |
| password | string | hashed |
| registration_date | timestamp | default now |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

---

## Attendance (2 tables)

### `attendance_types`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| type_name | string | unique — "Clock In" / "Clock Out" |
| created_at, updated_at | timestamp | |

### `attendance`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| staff_id | FK → staff.id | cascade on delete |
| type_id | FK → attendance_types.id | |
| timestamp | timestamp | default now |
| notes | string | nullable |
| created_at, updated_at | timestamp | |

---

## Menu (3 tables)

### `categories`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| category_name | string | unique |
| display_order | integer | default 0 |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

### `menu_items`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| category_id | FK → categories.id | |
| name | string | |
| description | text | nullable |
| price | decimal(10,2) | |
| is_available | boolean | default true |
| prep_time_min | integer | default 15 |
| created_at, updated_at | timestamp | |

### `menu_item_images`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| item_id | FK → menu_items.id | cascade on delete |
| image_url | string | |
| is_primary | boolean | default false |
| created_at, updated_at | timestamp | |

---

## Tables / QR (3 tables)

### `table_sections`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| section_name | string | unique — e.g. Riverfront, Indoor |
| description | string | nullable |
| created_at, updated_at | timestamp | |

### `dining_tables`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| section_id | FK → table_sections.id | |
| table_number | unsigned integer | unique |
| capacity | unsigned integer | |
| status | string | default AVAILABLE — AVAILABLE / OCCUPIED / NEEDS_CLEANING / RESERVED |
| floor | unsigned integer | default 1 |
| created_at, updated_at | timestamp | |

### `qr_codes`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| table_id | FK → dining_tables.id | unique, cascade on delete |
| token | string | unique — the security token embedded in the QR URL |
| generated_at | timestamp | default now |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

---

## Booking (2 tables)

### `bookings`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| customer_id | FK → customers.id | |
| table_id | FK → dining_tables.id | nullable |
| booking_date | date | |
| booking_time | string | e.g. "19:00" |
| guest_count | unsigned integer | |
| special_request | string | nullable |
| status | string | default PENDING — PENDING / CONFIRMED / CANCELLED / COMPLETED / NO_SHOW |
| deposit_amount | decimal(10,2) | default 0 |
| created_at, updated_at | timestamp | |

### `booking_status_logs`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| booking_id | FK → bookings.id | cascade on delete |
| staff_id | FK → staff.id | nullable |
| old_status | string | |
| new_status | string | |
| changed_at | timestamp | default now |

---

## Orders (3 tables)

### `orders`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| table_id | FK → dining_tables.id | nullable |
| customer_id | FK → customers.id | nullable — set when a logged-in customer ordered |
| staff_id | FK → staff.id | nullable — set when staff took a walk-in order |
| is_walkin | boolean | default false |
| status | string | default PLACED — PLACED / PREPARING / READY / SERVED / COMPLETED / CANCELLED |
| total_amount | decimal(10,2) | default 0 |
| special_instructions | string | nullable |
| created_at, updated_at | timestamp | |

### `order_items`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| order_id | FK → orders.id | cascade on delete |
| item_id | FK → menu_items.id | |
| quantity | unsigned integer | |
| unit_price | decimal(10,2) | price snapshot at time of order |
| item_note | string | nullable |
| status | string | default PENDING |

### `order_status_logs`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| order_id | FK → orders.id | cascade on delete |
| staff_id | FK → staff.id | nullable |
| old_status | string | |
| new_status | string | |
| changed_at | timestamp | default now |

---

## Payments (2 tables)

### `payment_methods`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| method_name | string | unique — e.g. KBZPay, Cash, Card |
| is_active | boolean | default true |
| created_at, updated_at | timestamp | |

### `payments`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| order_id | FK → orders.id | nullable |
| booking_id | FK → bookings.id | nullable |
| method_id | FK → payment_methods.id | |
| amount | decimal(10,2) | |
| payment_date | timestamp | default now |
| transaction_id | string | nullable |
| status | string | default PENDING |
| notes | string | nullable |

*A payment links to either an order OR a booking (deposit), never both — enforced at the application level, not a DB constraint.*

---

## Notifications / Audit (2 tables)

### `notifications`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| order_id | FK → orders.id | nullable |
| staff_id | FK → staff.id | nullable |
| customer_id | FK → customers.id | nullable |
| message | string | |
| type | string | BOOKING_REMINDER / ORDER_UPDATE / DEPOSIT_RECEIPT / etc. |
| is_read | boolean | default false |
| created_at, updated_at | timestamp | |

### `audit_logs`
| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| admin_id | FK → admins.id | nullable |
| action | string | |
| table_name | string | which table was affected |
| record_id | string | nullable |
| old_value | text | nullable |
| new_value | text | nullable |
| timestamp | timestamp | default now |

---

## Authentication infrastructure (1 table — not part of the domain model)

### `personal_access_tokens`
Added automatically by Laravel Sanctum, not hand-designed against the class
diagram. Stores API tokens for **all three** authenticatable models (Admin,
Staff, Customer) via a polymorphic link — one shared table rather than one
per role.

| Column | Type | Notes |
|---|---|---|
| id | bigint, PK | |
| tokenable_type, tokenable_id | polymorphic | which model (Admin/Staff/Customer) and which row owns this token |
| name | string | |
| token | string(64) | unique, hashed |
| abilities | text | nullable |
| last_used_at | timestamp | nullable |
| expires_at | timestamp | nullable |
| created_at, updated_at | timestamp | |

---

## Entity relationship summary

```
Admin ──< Staff ──< Attendance
  │         │
  │         ├──< OrderStatusLog
  │         ├──< BookingStatusLog
  │         └──< Notification
  │
  └──< AuditLog

StaffRole ──< Staff

Customer ──< Booking ──< BookingStatusLog
   │            │
   │            └──< Payment
   │
   └──< Order ──< OrderItem >── MenuItem ──< MenuItemImage
                │                   │
                ├──< OrderStatusLog └── Category
                ├──< Payment
                └──< Notification

TableSection ──< DiningTable ──┬──  QRCode (1:1)
                                ├──< Booking
                                └──< Order

PaymentMethod ──< Payment
```
