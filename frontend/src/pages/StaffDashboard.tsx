import { useEffect, useState } from "react";
import api from "../lib/api";
import { getStaffChannel } from "../lib/socket";
import AdminSidebar from "../components/AdminSidebar";

interface OrderItem {
  id: string;
  quantity: number;
  item: { name: string };
}
interface Order {
  id: string;
  status: string;
  totalAmount: number;
  isWalkin: boolean;
  table?: { tableNumber: number };
  items: OrderItem[];
}

const STATUS_FLOW = ["PLACED", "PREPARING", "READY", "SERVED", "COMPLETED"];

export default function StaffDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    api.get("/orders/live").then((res) => setOrders(res.data));

    // Echo's channel() joins a public channel immediately — no separate
    // "join room" call needed, unlike the old Socket.io setup. The leading
    // dot on each event name tells Echo to match the exact broadcastAs()
    // string from the Laravel event, rather than a namespaced class name.
    const channel = getStaffChannel();

    channel.listen(".order.new", (order: Order) => {
      setOrders((prev) => [...prev, order]);
    });
    channel.listen(".order.status-changed", (updated: Order) => {
      setOrders((prev) =>
        updated.status === "COMPLETED" || updated.status === "CANCELLED"
          ? prev.filter((o) => o.id !== updated.id)
          : prev.map((o) => (o.id === updated.id ? updated : o))
      );
    });

    return () => {
      channel.stopListening(".order.new");
      channel.stopListening(".order.status-changed");
    };
  }, []);

  async function advanceStatus(order: Order) {
    const currentIndex = STATUS_FLOW.indexOf(order.status);
    const next = STATUS_FLOW[currentIndex + 1];
    if (!next) return;
    await api.patch(`/orders/${order.id}/status`, { status: next });
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/staff/orders" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Kitchen floor
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Live Orders</h1>
        <p className="mt-2 text-sm text-grill-brown/50">Updates in real time — no refresh needed</p>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-grill-brown/10 bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium text-grill-brown">
                  {order.table ? `Table ${order.table.tableNumber}` : "Walk-in"}
                </span>
                <span className="rounded-full bg-grill-orange/10 px-2 py-0.5 text-xs text-grill-orange-dark">
                  {order.status}
                </span>
              </div>
              <ul className="mt-3 space-y-1 text-sm text-grill-brown/70">
                {order.items.map((line) => (
                  <li key={line.id}>
                    {line.quantity}× {line.item.name}
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-medium text-grill-brown">{order.totalAmount} MMK</span>
                {STATUS_FLOW.indexOf(order.status) < STATUS_FLOW.length - 1 && (
                  <button
                    onClick={() => advanceStatus(order)}
                    className="rounded-md bg-grill-brown px-3 py-1.5 text-xs font-medium text-white hover:bg-grill-brown-light"
                  >
                    Mark {STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1]}
                  </button>
                )}
              </div>
            </div>
          ))}
          {orders.length === 0 && (
            <p className="text-sm text-grill-brown/40">No live orders right now.</p>
          )}
        </div>
      </main>
    </div>
  );
}
