import { useEffect, useState } from "react";
import { ReceiptText, UtensilsCrossed } from "lucide-react";
import api from "../lib/api";
import CustomerSidebar from "../components/CustomerSidebar";
import StatusBadge from "../components/StatusBadge";

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  item: { name: string };
}
interface Order {
  id: string;
  status: string;
  totalAmount: number;
  isWalkin: boolean;
  createdAt: string;
  table?: { tableNumber: number };
  items: OrderItem[];
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api.get("/orders/mine").then((res) => setOrders(res.data));
  }, []);

  return (
    <div className="flex min-h-screen bg-cream">
      <CustomerSidebar active="/dashboard/orders" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Dining history
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Order History</h1>
        <p className="mt-2 text-sm text-grill-brown/50">Everything you've ordered at Ayeyarwady Grill</p>

        <div className="mt-8 space-y-4">
          {orders?.map((order) => (
            <div
              key={order.id}
              className="rounded-2xl border border-grill-brown/10 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-grill-orange/10 text-grill-orange-dark">
                    <UtensilsCrossed className="h-4.5 w-4.5" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="font-display text-base text-grill-brown">
                      {order.table ? `Table ${order.table.tableNumber}` : "Walk-in"}
                    </p>
                    <p className="text-xs text-grill-brown/40">
                      {new Date(order.createdAt).toLocaleString(undefined, {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
                <StatusBadge status={order.status} />
              </div>
              <ul className="mt-4 space-y-1.5 border-t border-grill-brown/5 pt-4 text-sm">
                {order.items.map((line) => (
                  <li key={line.id} className="flex justify-between text-grill-brown/70">
                    <span>
                      {line.quantity}× {line.item.name}
                    </span>
                    <span>{(Number(line.unitPrice) * line.quantity).toLocaleString()} MMK</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-end border-t border-grill-brown/5 pt-4 text-sm">
                <span className="text-grill-brown/50">Total&nbsp;</span>
                <span className="font-display text-base text-grill-brown">
                  {Number(order.totalAmount).toLocaleString()} MMK
                </span>
              </div>
            </div>
          ))}
          {orders?.length === 0 && (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-grill-brown/10 bg-white px-6 py-16 text-grill-brown/40 shadow-sm">
              <ReceiptText className="h-8 w-8" strokeWidth={1.5} />
              <p>No orders yet</p>
            </div>
          )}
          {orders === null && (
            <div className="rounded-2xl border border-grill-brown/10 bg-white px-6 py-16 text-center text-grill-brown/40 shadow-sm">
              Loading…
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
