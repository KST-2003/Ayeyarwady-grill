const STATUS_STYLES: Record<string, { text: string; dot: string }> = {
  CONFIRMED: { text: "text-emerald-700 bg-emerald-50", dot: "bg-emerald-500" },
  COMPLETED: { text: "text-emerald-700 bg-emerald-50", dot: "bg-emerald-500" },
  PAID: { text: "text-emerald-700 bg-emerald-50", dot: "bg-emerald-500" },
  FAILED: { text: "text-red-700 bg-red-50", dot: "bg-red-500" },
  SERVED: { text: "text-blue-700 bg-blue-50", dot: "bg-blue-500" },
  READY: { text: "text-blue-700 bg-blue-50", dot: "bg-blue-500" },
  PENDING: { text: "text-amber-700 bg-amber-50", dot: "bg-amber-500" },
  PLACED: { text: "text-amber-700 bg-amber-50", dot: "bg-amber-500" },
  PREPARING: { text: "text-amber-700 bg-amber-50", dot: "bg-amber-500" },
  CANCELLED: { text: "text-red-700 bg-red-50", dot: "bg-red-500" },
  NO_SHOW: { text: "text-red-700 bg-red-50", dot: "bg-red-500" },
};

const FALLBACK = { text: "text-grill-brown/70 bg-grill-brown/5", dot: "bg-grill-brown/40" };

export default function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? FALLBACK;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${style.text}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
