import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Coffee, CreditCard, Table2, Users } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";
import ColumnChart from "../components/charts/ColumnChart";
import HorizontalBars from "../components/charts/HorizontalBars";
import StackedShareBar from "../components/charts/StackedShareBar";
import { ORDER_STATUS_RAMP, titleCaseStatus } from "../lib/orderStatusColors";

interface Overview {
  pendingPayments: number;
  todayBookings: number;
  liveOrders: number;
  occupiedTables: number;
  totalTables: number;
  totalStaff: number;
}

interface Analytics {
  revenueByDay: { date: string; orders: number; revenue: number }[];
  bookingsByDay: { date: string; count: number }[];
  topMenuItems: { name: string; quantity: number }[];
  orderStatusToday: { status: string; count: number }[];
  paymentMethodShare: { method: string; total: number }[];
}

// Fixed order (brand color first), validated for adjacent CVD-safe contrast —
// see the dataviz skill's palette validator. A 5th+ payment method folds
// into "Other" rather than generating a new hue.
const CATEGORICAL_PALETTE = ["#D9642A", "#2a78d6", "#1baf7a", "#4a3aa7"];

function shortDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function fullDate(iso: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
function mmk(v: number): string {
  return `${Math.round(v).toLocaleString()} MMK`;
}

// The categorical palette validates up to 4 distinct hues at this
// (all-pairs, legend + direct label) series count — see the series-count
// ladder in the dataviz skill. A 5th+ payment method folds into "Other"
// rather than generating a new, CVD-indistinguishable hue.
function foldIntoOther(
  rows: { method: string; total: number }[]
): { method: string; total: number }[] {
  if (rows.length <= CATEGORICAL_PALETTE.length) return rows;
  const head = rows.slice(0, CATEGORICAL_PALETTE.length - 1);
  const tail = rows.slice(CATEGORICAL_PALETTE.length - 1);
  return [...head, { method: "Other", total: tail.reduce((sum, r) => sum + r.total, 0) }];
}

const CARDS: {
  key: keyof Overview;
  label: string;
  icon: typeof CalendarCheck;
  to: string;
  suffix?: (data: Overview) => string;
}[] = [
  {
    key: "pendingPayments",
    label: "Payments awaiting review",
    icon: CreditCard,
    to: "/staff/bookings",
  },
  {
    key: "todayBookings",
    label: "Bookings today",
    icon: CalendarCheck,
    to: "/staff/bookings",
  },
  {
    key: "liveOrders",
    label: "Live orders",
    icon: Coffee,
    to: "/staff/orders",
  },
  {
    key: "occupiedTables",
    label: "Tables occupied",
    icon: Table2,
    to: "/admin/tables",
    suffix: (data) => `of ${data.totalTables}`,
  },
];

export default function AdminOverviewPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [data, setData] = useState<Overview | null>(null);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);

  useEffect(() => {
    api.get("/overview").then((res) => setData(res.data));
    api.get("/overview/analytics").then((res) => setAnalytics(res.data));
  }, []);

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/staff" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          {isAdmin ? "Admin overview" : "Staff overview"}
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">
          Welcome back, {user?.name?.split(" ")[0]}
        </h1>
        <p className="mt-2 text-sm text-grill-brown/50">
          A snapshot of what needs attention right now.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CARDS.map((card) => {
            const Icon = card.icon;
            const value = data ? data[card.key] : null;
            return (
              <Link
                key={card.key}
                to={card.to}
                className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm transition-colors hover:border-grill-orange/30"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-grill-orange/10 text-grill-orange-dark">
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <p className="mt-4 font-display text-2xl text-grill-brown">
                  {value === null ? "—" : value}
                  {value !== null && card.suffix && (
                    <span className="ml-1 text-sm font-sans text-grill-brown/40">
                      {card.suffix(data as Overview)}
                    </span>
                  )}
                </p>
                <p className="mt-1 text-xs text-grill-brown/50">{card.label}</p>
              </Link>
            );
          })}
        </div>

        <p className="mt-10 text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Analytics
        </p>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm lg:col-span-2">
            <h2 className="font-display text-base text-grill-brown">Revenue</h2>
            <p className="text-xs text-grill-brown/40">Last 14 days, by order date</p>
            <div className="mt-4">
              {analytics ? (
                <ColumnChart
                  data={analytics.revenueByDay.map((d) => ({
                    label: shortDate(d.date),
                    fullLabel: fullDate(d.date),
                    value: d.revenue,
                  }))}
                  color="#D9642A"
                  valueFormatter={mmk}
                />
              ) : (
                <p className="py-10 text-center text-sm text-grill-brown/40">Loading…</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base text-grill-brown">Orders placed</h2>
            <p className="text-xs text-grill-brown/40">Last 14 days</p>
            <div className="mt-4">
              {analytics ? (
                <ColumnChart
                  data={analytics.revenueByDay.map((d) => ({
                    label: shortDate(d.date),
                    fullLabel: fullDate(d.date),
                    value: d.orders,
                  }))}
                  color="#2a78d6"
                  valueFormatter={(v) => `${v} order${v === 1 ? "" : "s"}`}
                />
              ) : (
                <p className="py-10 text-center text-sm text-grill-brown/40">Loading…</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base text-grill-brown">Today's kitchen pipeline</h2>
            <p className="text-xs text-grill-brown/40">Every order placed today, by status</p>
            <div className="mt-4">
              {analytics ? (
                <HorizontalBars
                  data={analytics.orderStatusToday.map((d) => ({
                    label: titleCaseStatus(d.status),
                    value: d.count,
                    color: ORDER_STATUS_RAMP[d.status] ?? "#898781",
                  }))}
                  emptyLabel="No orders placed today yet"
                />
              ) : (
                <p className="py-10 text-center text-sm text-grill-brown/40">Loading…</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base text-grill-brown">Top sellers</h2>
            <p className="text-xs text-grill-brown/40">By quantity, last 30 days</p>
            <div className="mt-4">
              {analytics ? (
                <HorizontalBars
                  data={analytics.topMenuItems.map((d) => ({
                    label: d.name,
                    value: d.quantity,
                    color: "#D9642A",
                  }))}
                  emptyLabel="No orders in the last 30 days"
                />
              ) : (
                <p className="py-10 text-center text-sm text-grill-brown/40">Loading…</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
            <h2 className="font-display text-base text-grill-brown">Bookings</h2>
            <p className="text-xs text-grill-brown/40">Last 14 days, by booking date</p>
            <div className="mt-4">
              {analytics ? (
                <ColumnChart
                  data={analytics.bookingsByDay.map((d) => ({
                    label: shortDate(d.date),
                    fullLabel: fullDate(d.date),
                    value: d.count,
                  }))}
                  color="#1baf7a"
                  valueFormatter={(v) => `${v} booking${v === 1 ? "" : "s"}`}
                />
              ) : (
                <p className="py-10 text-center text-sm text-grill-brown/40">Loading…</p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
          <h2 className="font-display text-base text-grill-brown">Payment methods</h2>
          <p className="text-xs text-grill-brown/40">Share of paid deposits, last 30 days</p>
          <div className="mt-4">
            {analytics ? (
              <StackedShareBar
                data={foldIntoOther(analytics.paymentMethodShare).map((d, i) => ({
                  label: d.method,
                  value: d.total,
                  color: d.method === "Other" ? "#898781" : CATEGORICAL_PALETTE[i % CATEGORICAL_PALETTE.length],
                }))}
                valueFormatter={mmk}
                emptyLabel="No paid deposits in the last 30 days"
              />
            ) : (
              <p className="py-10 text-center text-sm text-grill-brown/40">Loading…</p>
            )}
          </div>
        </div>

        {isAdmin && (
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm lg:col-span-1">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-grill-orange/10 text-grill-orange-dark">
                  <Users className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-display text-2xl text-grill-brown">
                    {data ? data.totalStaff : "—"}
                  </p>
                  <p className="text-xs text-grill-brown/50">Active staff accounts</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm lg:col-span-2">
              <h2 className="font-display text-base text-grill-brown">Quick links</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <Link to="/admin/menu" className="rounded-lg px-3 py-2 text-grill-brown/70 hover:bg-grill-brown/5">
                  Manage menu →
                </Link>
                <Link to="/admin/tables" className="rounded-lg px-3 py-2 text-grill-brown/70 hover:bg-grill-brown/5">
                  Tables & QR codes →
                </Link>
                <Link to="/admin/staff" className="rounded-lg px-3 py-2 text-grill-brown/70 hover:bg-grill-brown/5">
                  Staff accounts →
                </Link>
                <Link to="/admin/payment-methods" className="rounded-lg px-3 py-2 text-grill-brown/70 hover:bg-grill-brown/5">
                  Payment methods →
                </Link>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
