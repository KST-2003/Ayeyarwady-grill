# Ayeyarwady Grill — Laravel backend

This is an alternative backend to `../backend` (the Node/Express version),
built against the exact same 21-entity schema and API shape, so the
`../frontend` React app works against either one unchanged — just point
`VITE_API_URL` at whichever is running.

- **Stack:** PHP, Laravel 11, Sanctum (API tokens), Eloquent + PostgreSQL, Laravel Reverb (WebSockets)
- **Real-time:** four broadcast events (`OrderCreated`, `OrderStatusChanged`, `TableStatusChanged`, `BookingCreated`) on a shared `staff-room` channel — the Reverb equivalent of the Node version's Socket.io room
- **camelCase JSON:** Eloquent returns snake_case by default; every model uses a `CamelCaseAttributes` trait (`app/Traits/CamelCaseAttributes.php`) so the JSON output matches what the frontend already expects (`bookingDate`, `menuItems`, `qrCode`, etc.) — this is what makes swapping backends actually work without touching frontend interfaces.

---

## 1. Installing PHP, Composer and Reverb's requirements on a fresh Mac

If you already installed Node/PostgreSQL/Homebrew for the Node backend,
skip to 1.2.

### 1.1 Homebrew (skip if already installed)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### 1.2 PHP and Composer
```bash
brew install php composer
php -v        # should print PHP 8.2 or newer
composer -V
```

### 1.3 PostgreSQL (skip if already set up for the Node backend)
```bash
brew install postgresql@16
brew services start postgresql@16
createdb ayeyarwady_grill
```
This is the **same database** the Node backend uses — you don't need a
second one. Either backend can point at it (though don't run both
backends' migrations against it in a way that conflicts — pick one at a
time per the steps below).

---

## 2. Project setup (run once)

```bash
cd ayeyarwady-grill/backend-laravel
composer install
cp .env.example .env
php artisan key:generate
```

Open `.env` and confirm the `DB_*` values match your local Postgres
(the defaults work with the setup above). Then create the tables:
```bash
php artisan migrate
```
Load demo data (same accounts as the Node version):
```bash
php artisan db:seed
```

### Reverb (WebSocket server)
Reverb ships as part of this project already configured in `.env.example`
with local defaults. No extra install step needed beyond `composer install`
above.

---

## 3. Running the app locally

You need **three** terminal tabs this time (API server, Reverb, frontend).

**Tab 1 — Laravel API:**
```bash
cd ayeyarwady-grill/backend-laravel
php artisan serve
```
Runs on `http://localhost:8000`.

**Tab 2 — Reverb (WebSocket server, powers the live staff dashboard):**
```bash
cd ayeyarwady-grill/backend-laravel
php artisan reverb:start
```

**Tab 3 — frontend:**
```bash
cd ayeyarwady-grill/frontend
cp .env.example .env
npm install
npm run dev
```
The frontend's `.env.example` already points `VITE_API_URL` at
`http://localhost:8000/api` (Laravel's port) instead of the Node backend's
port 4000 — that's the one line that actually switches which backend the
frontend talks to.

Open **http://localhost:5173**. Same demo logins as the Node version:

| Role | Email | Password |
|---|---|---|
| Admin | admin@ayeyarwadygrill.com | password123 |
| Staff | waiter@ayeyarwadygrill.com | password123 |
| Customer | customer@example.com | password123 |

### Inspecting the database
```bash
php artisan tinker
# then, e.g.:
>>> \App\Models\Order::with('items.item')->get();
```
Or use TablePlus / any Postgres GUI — same database, same tables either backend uses.

---

## 4. Switching back to the Node backend later

The frontend only cares about two things: `VITE_API_URL` and, for
real-time updates, whether `lib/socket.ts` is written for Socket.io or
Echo. Since this Laravel build rewrote `lib/socket.ts` and the listener
code in `StaffDashboard.tsx` to use Echo, going back to Node means
reverting those two files to the Socket.io versions (kept in your chat
history / the original zip) and changing `VITE_API_URL` back to
`http://localhost:4000/api`.

---

## 5. What's different from the Node version, mechanically

- **IDs:** auto-increment integers (Laravel's default), not Prisma's
  `cuid()` strings. The frontend's TypeScript interfaces still say
  `id: string` in places — this is a harmless type label mismatch, not a
  runtime bug (JS doesn't enforce it), but worth knowing about if you're
  asked about it.
- **Auth:** Sanctum-issued personal access tokens instead of hand-signed
  JWTs. Functionally identical from the frontend's perspective — still a
  Bearer token in the `Authorization` header.
- **QR codes** are generated as SVG data URLs (`simplesoftwareio/simple-qrcode`),
  not PNG, specifically so this works without installing the PHP GD or
  Imagick extensions.
- **Payments** are still mocked exactly as in the Node version — a
  `Payment` row is written with `status = 'PAID'` instantly rather than
  calling a real gateway.

---

## 6. Deploying to DigitalOcean later

Same droplet shape as the Node version, adapted for PHP:
1. Ubuntu droplet with PHP 8.2+, Composer, PostgreSQL (or Managed Postgres), and Nginx.
2. `composer install --no-dev --optimize-autoloader`, then serve `public/`
   via Nginx + PHP-FPM (standard Laravel deployment — the `php artisan serve`
   command above is for local development only, not production).
3. Run Reverb as a persistent background process (e.g. via `supervisor` or
   `pm2`), since — like Socket.io — it needs a long-running process, not a
   request/response cycle.
4. Set `REVERB_HOST`/`REVERB_PORT`/`APP_URL`/`CLIENT_URL` to your real
   domain, and point the frontend's `VITE_API_URL`/`VITE_REVERB_*` at it.
