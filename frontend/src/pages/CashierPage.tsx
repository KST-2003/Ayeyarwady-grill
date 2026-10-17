import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, Banknote, CheckCircle2, Printer } from "lucide-react";
import api from "../lib/api";
import { getStaffChannel } from "../lib/socket";
import AdminSidebar from "../components/AdminSidebar";
import BillReceipt, { Bill } from "../components/BillReceipt";

interface TableRow {
  id: string;
  tableNumber: number;
  billRequested?: boolean;
  amountDue?: number;
}
interface Method {
  id: string;
  methodName: string;
}

// Cashier: tables that asked for the bill, and the screen to collect on one.
export default function CashierPage() {
  const { tableId } = useParams();

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/staff/cashier" />
      <main className="min-w-0 flex-1 px-10 py-10">
        {tableId ? <Checkout tableId={tableId} /> : <WaitingTables />}
      </main>
    </div>
  );
}

function WaitingTables() {
  const [tables, setTables] = useState<TableRow[] | null>(null);

  const refresh = useCallback(() => {
    api.get("/tables").then((res) => setTables(res.data));
  }, []);

  useEffect(() => {
    refresh();
    // A table asking for the bill (or being paid) reaches here instantly.
    const channel = getStaffChannel();
    channel.listen(".table.status-changed", refresh);
    return () => {
      channel.stopListening(".table.status-changed");
    };
  }, [refresh]);

  const waiting = tables?.filter((t) => t.billRequested) ?? [];

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">Cashier</p>
      <h1 className="mt-1 font-display text-3xl text-grill-brown">Collect payment</h1>
      <p className="mt-2 text-sm text-grill-brown/50">
        Tables that asked for the bill appear here. Open one to see the receipt and confirm the money.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {waiting.map((t) => (
          <Link
            key={t.id}
            to={`/staff/cashier/${t.id}`}
            className="rounded-2xl border border-grill-orange/30 bg-white p-5 shadow-sm transition-colors hover:border-grill-orange"
          >
            <p className="font-display text-lg text-grill-brown">Table {t.tableNumber}</p>
            <p className="mt-1 font-display text-2xl text-grill-brown">{(t.amountDue ?? 0).toLocaleString()} MMK</p>
            <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-grill-orange/10 px-3 py-1 text-xs font-medium text-grill-orange-dark">
              <Banknote className="h-3.5 w-3.5" strokeWidth={1.75} />
              Collect Money
            </span>
          </Link>
        ))}
        {tables && waiting.length === 0 && (
          <p className="col-span-full py-16 text-center text-sm text-grill-brown/40">
            No tables are waiting to pay.
          </p>
        )}
        {tables === null && <p className="col-span-full py-16 text-center text-sm text-grill-brown/40">Loading…</p>}
      </div>
    </>
  );
}

function Checkout({ tableId }: { tableId: string }) {
  const [bill, setBill] = useState<Bill | null | undefined>(undefined);
  const [methods, setMethods] = useState<Method[]>([]);
  const [methodId, setMethodId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [paidTotal, setPaidTotal] = useState<number | null>(null);

  useEffect(() => {
    api.get(`/tables/${tableId}/bill`).then((res) => {
      setBill(res.data.bill);
      setMethods(res.data.methods);
      setMethodId((cur) => cur || res.data.methods[0]?.id || "");
    });
  }, [tableId]);

  async function confirmPayment() {
    if (!methodId || busy) return;
    setBusy(true);
    setError("");
    try {
      const { data } = await api.post(`/tables/${tableId}/bill/pay`, { methodId });
      setPaidTotal(data.total);
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Could not record the payment.");
    } finally {
      setBusy(false);
    }
  }

  const back = (
    <Link to="/staff/cashier" className="mb-4 inline-flex items-center gap-1.5 text-sm text-grill-brown/60 hover:text-grill-brown print:hidden">
      <ArrowLeft className="h-4 w-4" />
      All tables
    </Link>
  );

  if (paidTotal !== null) {
    return (
      <>
        {back}
        <div className="max-w-sm rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" strokeWidth={1.5} />
          <h1 className="mt-3 font-display text-xl text-grill-brown">Payment recorded</h1>
          <p className="mt-1 text-sm text-grill-brown/60">{paidTotal.toLocaleString()} MMK collected.</p>
          <p className="mt-3 text-xs text-grill-brown/40">The table is marked “needs cleaning”.</p>
        </div>
      </>
    );
  }

  if (bill === undefined) {
    return <p className="py-16 text-sm text-grill-brown/40">Loading…</p>;
  }

  if (bill === null) {
    return (
      <>
        {back}
        <p className="py-10 text-sm text-grill-brown/50">This table has no bill waiting to be paid.</p>
      </>
    );
  }

  return (
    <>
      {back}
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark print:hidden">Cashier</p>
      <h1 className="mt-1 font-display text-3xl text-grill-brown print:hidden">Table {bill.tableNumber}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr]">
        <BillReceipt bill={bill} footer="Please pay at the counter." />

        <div className="max-w-sm print:hidden">
          <h2 className="font-display text-base text-grill-brown">Payment method</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {methods.map((m) => (
              <button
                key={m.id}
                onClick={() => setMethodId(m.id)}
                className={`rounded-full border px-4 py-2 text-sm font-medium ${
                  methodId === m.id
                    ? "border-grill-orange bg-grill-orange text-white"
                    : "border-grill-brown/20 text-grill-brown/70 hover:bg-grill-brown/5"
                }`}
              >
                {m.methodName}
              </button>
            ))}
            {methods.length === 0 && (
              <p className="text-sm text-red-600">No active payment methods — an admin needs to add one.</p>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          <button
            onClick={confirmPayment}
            disabled={busy || !methodId}
            className="mt-6 w-full rounded-md bg-grill-orange py-3 text-sm font-medium text-white hover:bg-grill-orange-dark disabled:opacity-50"
          >
            {busy ? "Saving…" : `Confirm payment · ${bill.total.toLocaleString()} MMK`}
          </button>
          <button
            onClick={() => window.print()}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-grill-brown/20 py-3 text-sm font-medium text-grill-brown hover:bg-grill-brown/5"
          >
            <Printer className="h-4 w-4" strokeWidth={1.75} />
            Print receipt
          </button>
        </div>
      </div>
    </>
  );
}
