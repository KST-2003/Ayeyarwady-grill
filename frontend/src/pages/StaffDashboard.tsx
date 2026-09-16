import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, UtensilsCrossed } from "lucide-react";
import api from "../lib/api";
import { getStaffChannel } from "../lib/socket";
import AdminSidebar from "../components/AdminSidebar";
import StatusBadge from "../components/StatusBadge";
import HorizontalBars from "../components/charts/HorizontalBars";
import { ORDER_STATUS_RAMP, titleCaseStatus } from "../lib/orderStatusColors";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  itemNote: string | null;
  item: {
    name: string;
    description: string;
    images?: { imageUrl: string; isPrimary: boolean }[];
  };
}
interface Order {
  id: string;
  status: string;
  totalAmount: number;
  isWalkin: boolean;
  table?: { tableNumber: number };
  items: OrderItem[];
}

// Every status the kitchen/floor might need to set directly — not just the
// next step forward. Lets staff correct a mistake (step back) or cancel an
// order, not only advance it one stage at a time.
const ALL_STATUSES = ["PLACED", "PREPARING", "READY", "SERVED", "COMPLETED", "CANCELLED"];
const STATUS_FLOW = ["PLACED", "PREPARING", "READY", "SERVED", "COMPLETED"];

export default function StaffDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  async function setStatus(order: Order, status: string) {
    if (status === order.status) return;
    // Optimistic update so both the quick button and the dropdown feel
    // instant — the socket event above will reconcile (and drop the
    // card) once the server confirms.
    setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status } : o)));
    try {
      await api.patch(`/orders/${order.id}/status`, { status });
    } catch {
      // roll back on failure
      setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: order.status } : o)));
    }
  }

  function toggleExpanded(lineId: string) {
    setExpanded((prev) => ({ ...prev, [lineId]: !prev[lineId] }));
  }

  // /orders/live already excludes COMPLETED/CANCELLED, so this is purely a
  // breakdown of what's currently active — computed from state already on
  // the page (no extra request) and kept live by the same socket handlers
  // that update `orders` above.
  const liveByStatus = useMemo(
    () =>
      STATUS_FLOW.slice(0, -1).map((status) => ({
        label: titleCaseStatus(status),
        value: orders.filter((o) => o.status === status).length,
        color: ORDER_STATUS_RAMP[status],
      })),
    [orders]
  );

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/staff/orders" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Kitchen floor
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Live Orders</h1>
        <p className="mt-2 text-sm text-grill-brown/50">Updates in real time — no refresh needed</p>

        <div className="mt-4 max-w-md rounded-xl border border-grill-brown/10 bg-white p-4">
          <h2 className="text-sm font-medium text-grill-brown">Right now, by status</h2>
          <div className="mt-3">
            <HorizontalBars data={liveByStatus} emptyLabel="No live orders right now" />
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {orders.map((order) => {
            const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(order.status) + 1];
            return (
              <div key={order.id} className="flex flex-col rounded-xl border border-grill-brown/10 bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-grill-brown">
                    {order.table ? `Table ${order.table.tableNumber}` : "Walk-in"}
                  </span>
                  <StatusBadge status={order.status} />
                </div>

                <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto pr-1 text-sm text-grill-brown/70">
                  {order.items.map((line) => {
                    const photo = line.item.images?.find((i) => i.isPrimary)?.imageUrl ?? line.item.images?.[0]?.imageUrl;
                    const isOpen = !!expanded[line.id];
                    return (
                      <li key={line.id} className="rounded-md hover:bg-grill-brown/[0.03]">
                        <button
                          onClick={() => toggleExpanded(line.id)}
                          className="flex w-full items-center gap-2 rounded-md px-1 py-1 text-left"
                        >
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded bg-grill-brown/5">
                            {photo ? (
                              <img src={photo} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <UtensilsCrossed className="h-3.5 w-3.5 text-grill-brown/25" strokeWidth={1.75} />
                            )}
                          </div>
                          <span className="min-w-0 flex-1 truncate">
                            {line.quantity}× {line.item.name}
                          </span>
                          {isOpen ? (
                            <ChevronUp className="h-3.5 w-3.5 shrink-0 text-grill-brown/30" strokeWidth={2} />
                          ) : (
                            <ChevronDown className="h-3.5 w-3.5 shrink-0 text-grill-brown/30" strokeWidth={2} />
                          )}
                        </button>
                        {isOpen && (
                          <div className="ml-10 mr-1 mb-1.5 rounded-md bg-grill-brown/[0.03] px-2.5 py-2 text-xs text-grill-brown/60">
                            {line.item.description && <p>{line.item.description}</p>}
                            <p className="mt-1 text-grill-brown/40">
                              {Number(line.unitPrice).toLocaleString()} MMK each
                            </p>
                            {line.itemNote && (
                              <p className="mt-1 italic text-grill-orange-dark">Note: {line.itemNote}</p>
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>

                <div className="mt-3 flex items-center justify-between border-t border-grill-brown/5 pt-3">
                  <span className="text-sm font-medium text-grill-brown">
                    {Number(order.totalAmount).toLocaleString()} MMK
                  </span>
                  <div className="flex items-center gap-1.5">
                    <select
                      value={order.status}
                      onChange={(e) => setStatus(order, e.target.value)}
                      className="rounded-md border border-grill-brown/15 bg-white px-1.5 py-1.5 text-xs text-grill-brown/70 focus:border-grill-orange focus:outline-none"
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    {nextStatus && (
                      <button
                        onClick={() => setStatus(order, nextStatus)}
                        className="whitespace-nowrap rounded-md bg-grill-brown px-3 py-1.5 text-xs font-medium text-white hover:bg-grill-brown-light"
                      >
                        Mark {nextStatus}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {orders.length === 0 && (
            <p className="text-sm text-grill-brown/40">No live orders right now.</p>
          )}
        </div>
      </main>
    </div>
  );
}
