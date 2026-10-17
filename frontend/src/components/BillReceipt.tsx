import { ReactNode } from "react";
import { Flame } from "lucide-react";

export interface Bill {
  tableId: string;
  tableNumber: number;
  requestedAt: string;
  orderIds: (string | number)[];
  lines: { name: string; quantity: number; unitPrice: number; lineTotal: number }[];
  total: number;
}

/** The printed check: the same slip the diner prints and the cashier collects against. */
export default function BillReceipt({ bill, footer }: { bill: Bill; footer?: ReactNode }) {
  const when = new Date(bill.requestedAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });

  return (
    <div className="w-full max-w-sm rounded-2xl border border-grill-brown/10 bg-white p-6 shadow-sm print:max-w-none print:rounded-none print:border-0 print:shadow-none">
      <div className="text-center">
        <Flame className="mx-auto h-7 w-7 text-grill-orange" strokeWidth={1.75} />
        <h1 className="mt-2 font-display text-xl text-grill-brown">Ayeyarwady Grill</h1>
        <p className="mt-1 text-xs uppercase tracking-wide text-grill-brown/50">Bill</p>
      </div>

      <div className="mt-5 flex justify-between border-y border-dashed border-grill-brown/15 py-3 text-xs text-grill-brown/60">
        <span>Table {bill.tableNumber}</span>
        <span>{when}</span>
      </div>
      <p className="mt-2 text-center text-[11px] text-grill-brown/40">
        Order{bill.orderIds.length === 1 ? "" : "s"} {bill.orderIds.map((id) => `#${id}`).join(", ")}
      </p>

      <div className="mt-4 space-y-2">
        {bill.lines.map((line) => (
          <div key={`${line.name}-${line.unitPrice}`} className="flex justify-between gap-3 text-sm">
            <span className="text-grill-brown">
              {line.quantity} × {line.name}
            </span>
            <span className="shrink-0 text-grill-brown/70">{line.lineTotal.toLocaleString()} MMK</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-between border-t border-grill-brown/10 pt-3 text-sm font-medium">
        <span className="text-grill-brown">Total</span>
        <span className="font-display text-lg text-grill-brown">{bill.total.toLocaleString()} MMK</span>
      </div>

      {footer && <div className="mt-5 text-center text-sm text-grill-brown/70">{footer}</div>}
    </div>
  );
}
