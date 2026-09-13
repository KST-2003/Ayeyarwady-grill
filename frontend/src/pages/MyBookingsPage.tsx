import { useEffect, useRef, useState } from "react";
import { CalendarX, Upload } from "lucide-react";
import api from "../lib/api";
import CustomerSidebar from "../components/CustomerSidebar";
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
  specialRequest: string | null;
  table?: { tableNumber: number; section: { sectionName: string } };
  payments?: Payment[];
}

// Inline payment-proof control for one booking row — upload (or re-upload,
// after a rejected screenshot) without leaving the bookings table.
function PaymentCell({ booking, onUpdated }: { booking: Booking; onUpdated: (payment: Payment) => void }) {
  const payment = booking.payments?.[0];
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("screenshot", file);
      const { data } = await api.post(`/bookings/${booking.id}/payment-proof`, form);
      onUpdated(data);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!payment) return <span className="text-grill-brown/40">—</span>;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <StatusBadge status={payment.status} />
        {payment.screenshotUrl && (
          <a
            href={payment.screenshotUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-grill-orange-dark underline underline-offset-2"
          >
            view
          </a>
        )}
      </div>
      {payment.status !== "PAID" && (
        <>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1 text-xs text-grill-brown/50 hover:text-grill-orange-dark disabled:opacity-50"
          >
            <Upload className="h-3 w-3" strokeWidth={2} />
            {uploading ? "Uploading…" : payment.screenshotUrl ? "Re-upload proof" : "Upload proof"}
          </button>
          <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} className="hidden" />
        </>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState<Booking[] | null>(null);

  useEffect(() => {
    api.get("/bookings/mine").then((res) => setBookings(res.data));
  }, []);

  function handlePaymentUpdated(bookingId: string, payment: Payment) {
    setBookings((prev) =>
      prev ? prev.map((b) => (b.id === bookingId ? { ...b, payments: [payment] } : b)) : prev
    );
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <CustomerSidebar active="/dashboard/bookings" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Your reservations
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">My Bookings</h1>
        <p className="mt-2 text-sm text-grill-brown/50">All your reservations, past and upcoming</p>

        <div className="mt-8 overflow-hidden rounded-2xl border border-grill-brown/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-grill-brown/40">
                <th className="px-6 py-4 font-medium">Date</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Table</th>
                <th className="px-6 py-4 font-medium">Guests</th>
                <th className="px-6 py-4 font-medium">Deposit</th>
                <th className="px-6 py-4 font-medium">Payment</th>
                <th className="px-6 py-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings?.map((b) => (
                <tr key={b.id} className="border-t border-grill-brown/5 transition-colors hover:bg-grill-brown/[0.02]">
                  <td className="px-6 py-4 font-medium text-grill-brown">
                    {new Date(b.bookingDate).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4 text-grill-brown/70">{b.bookingTime}</td>
                  <td className="px-6 py-4 text-grill-brown/70">
                    {b.table ? `Table ${b.table.tableNumber} · ${b.table.section.sectionName}` : "—"}
                  </td>
                  <td className="px-6 py-4 text-grill-brown/70">{b.guestCount}</td>
                  <td className="px-6 py-4 text-grill-brown/70">
                    {Number(b.depositAmount).toLocaleString()} MMK
                  </td>
                  <td className="px-6 py-4">
                    <PaymentCell booking={b} onUpdated={(payment) => handlePaymentUpdated(b.id, payment)} />
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={b.status} />
                  </td>
                </tr>
              ))}
              {bookings?.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-grill-brown/40">
                      <CalendarX className="h-8 w-8" strokeWidth={1.5} />
                      <p>No bookings yet</p>
                    </div>
                  </td>
                </tr>
              )}
              {bookings === null && (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-grill-brown/40">
                    Loading…
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
