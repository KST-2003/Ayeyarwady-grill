# Ayeyarwady Grill — Hybrid Restaurant Booking & QR Ordering System

Full-stack scaffold matching the Interim Report design. **Two interchangeable
backends are included** — pick one:

- **`backend/`** — Node.js, Express, TypeScript, Prisma ORM, PostgreSQL, Socket.io, JWT auth
- **`backend-laravel/`** — PHP, Laravel 11, Sanctum, Eloquent, PostgreSQL, Laravel Reverb (WebSockets)

Both implement the identical 21-entity schema and API shape, so
**`frontend/` works against either one unchanged** — see each backend's own
README for its specific setup steps. This top-level README covers the
Node path; for Laravel, go straight to `backend-laravel/README.md`.

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, React Router, real-time client (Socket.io or Echo depending on backend)

---

## 1. Installing everything on a fresh Mac

Open **Terminal** and run these one at a time.

### 1.1 Install Homebrew (Mac's package manager — skip if you already have it)
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```
Follow the on-screen instructions at the end — it may ask you to run two
more commands to add Homebrew to your PATH. Do that, then close and reopen
Terminal.

### 1.2 Install Node.js (v20 LTS recommended)
```bash
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```
Verify:
```bash
node -v     # should print v20.x.x
npm -v
```

### 1.3 Install PostgreSQL
```bash
brew install postgresql@16
brew services start postgresql@16
```
Verify it's running:
```bash
brew services list
```
Create the project's database:
```bash
createdb ayeyarwady_grill
```
> If `createdb` says "role does not exist", run `createuser -s postgres` first,
> then try again.

### 1.4 Install Git (usually pre-installed on Mac, but just in case)
```bash
brew install git
```

### 1.5 (Optional) Install a Postgres GUI
`brew install --cask tableplus` — makes it easy to browse your tables visually.
Prisma Studio (included below) also works fine without this.

---

## 2. Project setup (run once)

Unzip this project, then in Terminal:

```bash
cd ayeyarwady-grill
```

### 2.1 Backend
```bash
cd backend
npm install
cp .env.example .env
```
Open `.env` and check `DATABASE_URL` matches your local Postgres. If you
used the defaults above, this works as-is:
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ayeyarwady_grill"
```
> On a fresh `brew install postgresql`, your Mac username is usually the
> default role with no password needed. If the connection fails, try:
> `DATABASE_URL="postgresql://localhost:5432/ayeyarwady_grill"`

Create the database tables from the Prisma schema:
```bash
npx prisma migrate dev --name init
```
Load sample data (demo accounts, tables, menu items):
```bash
npm run seed
```

### 2.2 Frontend
Open a **new** Terminal tab (⌘T), then:
```bash
cd ayeyarwady-grill/frontend
npm install
```

---

## 3. Running the app locally

You need **two terminal tabs open at the same time**.

**Tab 1 — backend:**
```bash
cd ayeyarwady-grill/backend
npm run dev
```
You should see: `Ayeyarwady Grill backend running on http://localhost:4000`

**Tab 2 — frontend:**
```bash
cd ayeyarwady-grill/frontend
npm run dev
```
You should see a `Local: http://localhost:5173/` link.

Open **http://localhost:5173** in your browser.

### Demo logins (seeded automatically)
| Role | Email | Password |
|---|---|---|
| Admin | admin@ayeyarwadygrill.com | password123 |
| Staff | waiter@ayeyarwadygrill.com | password123 |
| Customer | customer@example.com | password123 |

### Trying the QR ordering flow locally
1. Log in as Admin → **Tables & QR** → generate a QR code for a table.
2. Copy the URL encoded in that QR (visible in the browser network tab, or
   just navigate to `http://localhost:5173/order?table=8&token=...` using
   the token shown in Prisma Studio — see below).
3. On a phone on the same Wi-Fi, replace `localhost` with your Mac's local
   IP (find it with `ipconfig getifaddr en0`) to actually scan it from a phone.

### Inspecting the database visually
```bash
cd backend
npx prisma studio
```
Opens a browser GUI at `http://localhost:5555` showing every table.

---

## 4. Project structure

```
ayeyarwady-grill/
├── backend/
│   ├── prisma/schema.prisma   ← all 21 entities from the class diagram
│   ├── prisma/seed.ts         ← demo data
│   └── src/
│       ├── index.ts           ← Express app + Socket.io entrypoint
│       ├── routes/            ← one file per resource
│       ├── controllers/       ← business logic
│       ├── middleware/auth.ts ← JWT + role-based access control
│       ├── socket.ts          ← real-time event emitters
│       └── utils/             ← jwt, password hashing, QR generation
└── frontend/
    └── src/
        ├── pages/              ← one file per screen (landing, dashboards, etc.)
        ├── components/         ← Navbar, ProtectedRoute
        ├── context/AuthContext.tsx
        └── lib/                ← api.ts (axios), socket.ts
```

---

## 5. Scope simplifications (worth noting in your report)

- **Payments** are mocked — `createBooking` records a `Payment` row with
  status `PAID` instantly rather than calling the real KBZPay API. Swap the
  mock block in `bookings.controller.ts` for a real payment gateway call
  when you're ready.
- **Image uploads** for menu items currently take a plain URL string
  (`imageUrl` field) rather than a file upload — add multer + S3/Cloudinary
  if you want real image uploads.
- **Admin↔Staff generalization**: enforced in code via `requireRole`
  (Admin automatically passes Staff-only checks) but not modelled as a
  formal UML generalization edge in the `.mdj` files — see earlier chat
  notes if your marker checks the diagram against this rule.

---

## 6. Deploying to DigitalOcean later

When you're ready to move off `localhost`, the shape of the deployment is:
1. A Droplet running Ubuntu with Node.js + PostgreSQL installed (or use
   DigitalOcean's Managed PostgreSQL add-on instead of self-hosting it).
2. `npm run build` in both `backend` and `frontend`; serve the frontend's
   `dist/` folder via Nginx, and run the backend with `pm2 start dist/index.js`
   so it stays alive.
3. Point `DATABASE_URL`, `CLIENT_URL`, and the frontend's `VITE_API_URL`
   at your droplet's real domain/IP instead of `localhost`.
4. Because Socket.io needs persistent connections, make sure Nginx is
   configured to proxy WebSocket upgrade headers if you put it in front of
   the backend.

Happy to walk through the actual DigitalOcean deployment step-by-step once
local development is working end-to-end.
