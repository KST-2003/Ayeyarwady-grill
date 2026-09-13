import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Coffee, CreditCard, Table2, Users } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";

interface Overview {
  pendingPayments: number;
  todayBookings: number;
  liveOrders: number;
  occupiedTables: number;
  totalTables: number;
  totalStaff: number;
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

  useEffect(() => {
    api.get("/overview").then((res) => setData(res.data));
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
