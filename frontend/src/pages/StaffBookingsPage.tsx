import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import api from "../lib/api";
import { getStaffChannel } from "../lib/socket";
import AdminSidebar from "../components/AdminSidebar";
import StatusBadge from "../components/StatusBadge";

interface Payment {
  id: string;
  status: string;
  screenshotUrl: string | null;
}
interface Booking {
  id: string;
  bookingDate: string;
  bookingTime: string;
  guestCount: number;
  status: string;
  depositAmount: number;
  customer: { name: string; phone: string | null };
  table?: { tableNumber: number };
  payments?: Payment[];
}

export default function StaffBookingsPage() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    api.get("/bookings").then((res) => setBookings(res.data));

    const channel = getStaffChannel();
    channel.listen(".booking.new", (booking: Booking) => {
      setBookings((prev) => [booking, ...prev.filter((b) => b.id !== booking.id)]);
    });

    return () => {
      channel.stopListening(".booking.new");
    };
  }, []);

  async function verify(booking: Booking, status: "PAID" | "FAILED") {
    const payment = booking.payments?.[0];
    if (!payment) return;
    setActingOn(payment.id);
    try {
      const { data } = await api.patch(`/payments/${payment.id}/verify`, { status });
      setBookings((prev) =>
        prev.map((b) =>
          b.id === booking.id
            ? { ...b, status: status === "PAID" ? "CONFIRMED" : b.status, payments: [data] }
            : b
        )
      );
    } finally {
      setActingOn(null);
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/staff/bookings" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Reservations
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Bookings & Deposits</h1>
        <p className="mt-2 text-sm text-grill-brown/50">
          Verify a customer's uploaded payment screenshot against the restaurant's own KBZPay
          dashboard, then confirm or reject the deposit.
        </p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-grill-brown/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-grill-brown/40">
                <th className="px-6 py-4 font-medium">Customer</th>
                <th className="px-6 py-4 font-medium">Date / Time</th>
                <th className="px-6 py-4 font-medium">Table</th>
                <th className="px-6 py-4 font-medium">Deposit</th>
                <th className="px-6 py-4 font-medium">Proof</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Booking</th>
                <th className="px-6 py-4 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((b) => {
                const payment = b.payments?.[0];
                const canVerify = payment?.status === "PENDING" && payment.screenshotUrl;
                return (
                  <tr key={b.id} className="border-t border-grill-brown/5">
                    <td className="px-6 py-4">
                      <p className="font-medium text-grill-brown">{b.customer.name}</p>
                      <p className="text-xs text-grill-brown/50">{b.customer.phone ?? "no phone"}</p>
                    </td>
                    <td className="px-6 py-4 text-grill-brown/70">
                      {new Date(b.bookingDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })} ·{" "}
                      {b.bookingTime}
                    </td>
                    <td className="px-6 py-4 text-grill-brown/70">
                      {b.table ? `Table ${b.table.tableNumber}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-grill-brown/70">
                      {Number(b.depositAmount).toLocaleString()} MMK
                    </td>
                    <td className="px-6 py-4">
                      {payment?.screenshotUrl ? (
                        <a
                          href={payment.screenshotUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-grill-orange-dark underline underline-offset-2"
                        >
                          view screenshot
                        </a>
                      ) : (
                        <span className="text-grill-brown/40">not uploaded</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {payment ? <StatusBadge status={payment.status} /> : <span className="text-grill-brown/40">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={b.status} />
                    </td>
                    <td className="px-6 py-4">
                      {canVerify ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => verify(b, "PAID")}
                            disabled={actingOn === payment?.id}
                            className="flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            Confirm
                          </button>
                          <button
                            onClick={() => verify(b, "FAILED")}
                            disabled={actingOn === payment?.id}
                            className="flex items-center gap-1 rounded-md border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                          >
                            <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-grill-brown/30">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center text-grill-brown/40">
                    No bookings yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
