import { Link } from "react-router-dom";
import {
  Bell,
  BookText,
  CalendarCheck,
  ClipboardList,
  Coffee,
  History,
  LayoutDashboard,
  LogOut,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const STAFF_NAV = [
  { label: "Overview", to: "/staff", icon: LayoutDashboard },
  { label: "Live Orders", to: "/staff/orders", icon: Coffee },
  { label: "Bookings & Deposits", to: "/staff/bookings", icon: CalendarCheck },
  { label: "Attendance", to: "/staff/attendance", icon: ClipboardList },
  { label: "Notifications", to: "/staff/notifications", icon: Bell },
];

const ADMIN_NAV = [
  { label: "Menu", to: "/admin/menu", icon: UtensilsCrossed },
  { label: "Tables & QR", to: "/admin/tables", icon: BookText },
  { label: "Staff Accounts", to: "/admin/staff", icon: Users },
  { label: "Payment Methods", to: "/admin/payment-methods", icon: Wallet },
  { label: "Audit Log", to: "/admin/audit-log", icon: History },
];

export default function AdminSidebar({ active }: { active: string }) {
  const { user, logout } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const initials = (user?.name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-grill-brown-dark px-4 py-6 text-white">
      <Link to="/" className="mb-8 flex items-center gap-2 px-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-display">
          AG
        </span>
        <span className="font-display text-base tracking-wide">Ayeyarwady Grill</span>
      </Link>

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-grill-orange/20 font-display text-sm text-grill-orange-light">
          {initials}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{user?.name}</p>
          <p className="truncate text-xs text-white/40">{isAdmin ? "Admin" : "Staff"}</p>
        </div>
      </div>

      <nav className="space-y-1 text-sm">
        <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-white/30">
          Operations
        </p>
        {STAFF_NAV.map((item) => {
          const Icon = item.icon;
          const isActive = item.to === active;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 transition-colors ${
                isActive
                  ? "border-grill-orange bg-grill-orange/10 font-medium text-grill-orange-light"
                  : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={1.75} />
              {item.label}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wider text-white/30">
              Administration
            </p>
            {ADMIN_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = item.to === active;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-lg border-l-2 px-3 py-2.5 transition-colors ${
                    isActive
                      ? "border-grill-orange bg-grill-orange/10 font-medium text-grill-orange-light"
                      : "border-transparent text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                  {item.label}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      <button
        onClick={logout}
        className="mt-auto flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} />
        Logout
      </button>
    </aside>
  );
}
