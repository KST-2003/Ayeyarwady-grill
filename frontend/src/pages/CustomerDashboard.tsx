import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bell, CalendarCheck, CalendarPlus, Sparkles, Wallet } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { notificationTitle } from "../lib/notifications";
import CustomerSidebar from "../components/CustomerSidebar";
import StatusBadge from "../components/StatusBadge";

interface Booking {
  id: string;
  bookingDate: string;
  bookingTime: string;
  guestCount: number;
  status: string;
  depositAmount: number;
  table?: { tableNumber: number; section: { sectionName: string } };
}

interface Stats {
  totalVisits: number;
  totalSpent: number;
  memberSince: string;
}

interface Notification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  useEffect(() => {
    api.get("/bookings/mine").then((res) => setBookings(res.data));
    api.get("/customers/me/stats").then((res) => setStats(res.data));
    api.get("/notifications/mine").then((res) => setNotifications(res.data));
  }, []);

  const upcoming = bookings.find((b) => b.status === "CONFIRMED");

  return (
    <div className="flex min-h-screen bg-cream">
      <CustomerSidebar active="/dashboard" />

      <main className="flex-1 px-10 py-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
              {greeting()}
            </p>
            <h1 className="mt-1 font-display text-3xl text-grill-brown">
              Welcome back, {user?.name?.split(" ")[0]}
            </h1>
          </div>
          <Link
            to="/book"
            className="flex items-center gap-2 rounded-md bg-grill-orange px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-grill-orange/30 transition-colors hover:bg-grill-orange-dark"
          >
            <CalendarPlus className="h-4 w-4" strokeWidth={1.75} />
            Book a Table
          </Link>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-2">
            {/* Upcoming reservation card */}
            <div className="relative overflow-hidden rounded-2xl bg-grill-brown-dark p-7 text-white">
              <div
                className="pointer-events-none absolute inset-0 opacity-40"
                style={{
                  backgroundImage:
                    "radial-gradient(ellipse at top right, rgba(217,100,42,0.25) 0%, transparent 60%)",
                }}
              />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-white/50">
                    <Sparkles className="h-3.5 w-3.5 text-grill-orange-light" strokeWidth={1.75} />
                    Upcoming reservation
                  </span>
                  {upcoming && <StatusBadge status={upcoming.status} />}
                </div>

                {upcoming ? (
                  <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-4">
                    <div>
                      <p className="text-xs text-white/40">Date</p>
                      <p className="mt-1.5 font-display text-lg">
                        {new Date(upcoming.bookingDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Time</p>
                      <p className="mt-1.5 font-display text-lg">{upcoming.bookingTime}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Guests</p>
                      <p className="mt-1.5 font-display text-lg">{upcoming.guestCount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-white/40">Deposit paid</p>
                      <p className="mt-1.5 font-display text-lg">
                        {Number(upcoming.depositAmount).toLocaleString()} MMK
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-white/60">No upcoming reservation yet.</p>
                    <Link
                      to="/book"
                      className="text-sm font-medium text-grill-orange-light hover:underline"
                    >
                      Reserve a table →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-grill-orange/10 text-grill-orange-dark">
                  <CalendarCheck className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <p className="mt-3 text-xs uppercase tracking-wide text-grill-brown/40">Total visits</p>
                <p className="mt-0.5 font-display text-2xl text-grill-brown">
                  {stats ? stats.totalVisits : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-grill-orange/10 text-grill-orange-dark">
                  <Wallet className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <p className="mt-3 text-xs uppercase tracking-wide text-grill-brown/40">Total spent</p>
                <p className="mt-0.5 font-display text-2xl text-grill-brown">
                  {stats ? `${Number(stats.totalSpent).toLocaleString()} MMK` : "—"}
                </p>
              </div>
              <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-grill-orange/10 text-grill-orange-dark">
                  <CalendarPlus className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <p className="mt-3 text-xs uppercase tracking-wide text-grill-brown/40">Member since</p>
                <p className="mt-0.5 font-display text-2xl text-grill-brown">
                  {stats
                    ? new Date(stats.memberSince).toLocaleDateString(undefined, {
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
            </div>

            {/* Recent bookings table */}
            <div className="rounded-2xl border border-grill-brown/10 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-grill-brown/8 px-6 py-4">
                <h2 className="font-display text-lg text-grill-brown">Recent bookings</h2>
                <Link
                  to="/dashboard/bookings"
                  className="text-xs font-medium text-grill-orange-dark hover:underline"
                >
                  View all
                </Link>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-grill-brown/40">
                    <th className="px-6 py-3 font-medium">Date</th>
                    <th className="px-6 py-3 font-medium">Table</th>
                    <th className="px-6 py-3 font-medium">Guests</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.slice(0, 5).map((b) => (
                    <tr key={b.id} className="border-t border-grill-brown/5 transition-colors hover:bg-grill-brown/[0.02]">
                      <td className="px-6 py-4 text-grill-brown">{new Date(b.bookingDate).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-grill-brown/70">
                        {b.table ? `Table ${b.table.tableNumber} · ${b.table.section.sectionName}` : "—"}
                      </td>
                      <td className="px-6 py-4 text-grill-brown/70">{b.guestCount}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={b.status} />
                      </td>
                    </tr>
                  ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-10 text-center text-grill-brown/40">
                        No bookings yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notifications panel */}
          <div className="rounded-2xl border border-grill-brown/10 bg-white shadow-sm lg:col-span-1">
            <div className="flex items-center justify-between border-b border-grill-brown/8 px-6 py-4">
              <h2 className="font-display text-lg text-grill-brown">Notifications</h2>
              <Link
                to="/dashboard/notifications"
                className="text-xs font-medium text-grill-orange-dark hover:underline"
              >
                View all
              </Link>
            </div>
            <div className="divide-y divide-grill-brown/5">
              {notifications?.slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-start gap-3 px-6 py-4">
                  <span
                    className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                      n.isRead ? "bg-grill-brown/20" : "bg-grill-orange"
                    }`}
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-grill-brown">{notificationTitle(n.type)}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-grill-brown/50">{n.message}</p>
                  </div>
                </div>
              ))}
              {notifications?.length === 0 && (
                <div className="flex flex-col items-center gap-2 px-6 py-16 text-grill-brown/40">
                  <Bell className="h-6 w-6" strokeWidth={1.5} />
                  <p className="text-sm">No notifications yet</p>
                </div>
              )}
              {notifications === null && (
                <p className="px-6 py-16 text-center text-sm text-grill-brown/40">Loading…</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
