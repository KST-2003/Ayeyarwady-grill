import { useEffect, useState } from "react";
import { Bell, BellOff, CalendarCheck, UtensilsCrossed } from "lucide-react";
import api from "../lib/api";
import { notificationTitle } from "../lib/notifications";
import CustomerSidebar from "../components/CustomerSidebar";

interface Notification {
  id: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function typeIcon(type: string) {
  if (type === "BOOKING_REMINDER") return CalendarCheck;
  if (type === "ORDER_UPDATE") return UtensilsCrossed;
  return Bell;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[] | null>(null);

  useEffect(() => {
    api.get("/notifications/mine").then((res) => setNotifications(res.data));
  }, []);

  async function markRead(id: string) {
    await api.patch(`/notifications/${id}/read`);
    setNotifications((prev) =>
      prev ? prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)) : prev
    );
  }

  const unreadCount = notifications?.filter((n) => !n.isRead).length ?? 0;

  return (
    <div className="flex min-h-screen bg-cream">
      <CustomerSidebar active="/dashboard/notifications" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Stay in the loop
        </p>
        <div className="mt-1 flex items-center gap-3">
          <h1 className="font-display text-3xl text-grill-brown">Notifications</h1>
          {unreadCount > 0 && (
            <span className="rounded-full bg-grill-orange px-2.5 py-0.5 text-xs font-medium text-white">
              {unreadCount} new
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-grill-brown/50">Booking confirmations and order updates</p>

        <div className="mt-8 space-y-3">
          {notifications?.map((n) => {
            const Icon = typeIcon(n.type);
            return (
              <div
                key={n.id}
                className={`flex items-center gap-4 rounded-2xl border px-6 py-4 shadow-sm transition-colors ${
                  n.isRead
                    ? "border-grill-brown/10 bg-white"
                    : "border-grill-orange/20 bg-grill-orange/5"
                }`}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    n.isRead ? "bg-grill-brown/5 text-grill-brown/40" : "bg-grill-orange/15 text-grill-orange-dark"
                  }`}
                >
                  <Icon className="h-4.5 w-4.5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className={n.isRead ? "text-sm text-grill-brown/70" : "text-sm font-medium text-grill-brown"}>
                    {notificationTitle(n.type)}
                  </p>
                  <p className="mt-0.5 text-sm text-grill-brown/50">{n.message}</p>
                  <p className="mt-1 text-xs text-grill-brown/40">
                    {new Date(n.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                {!n.isRead && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="shrink-0 rounded-md border border-grill-brown/15 px-3 py-1.5 text-xs font-medium text-grill-brown/70 transition-colors hover:border-grill-orange/40 hover:text-grill-orange-dark"
                  >
                    Mark as read
                  </button>
                )}
              </div>
            );
          })}
          {notifications?.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-grill-brown/10 bg-white px-6 py-16 text-grill-brown/40 shadow-sm">
              <BellOff className="h-8 w-8" strokeWidth={1.5} />
              <p>No notifications yet</p>
            </div>
          )}
          {notifications === null && (
            <div className="rounded-2xl border border-grill-brown/10 bg-white px-6 py-16 text-center text-grill-brown/40 shadow-sm">
              Loading…
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
