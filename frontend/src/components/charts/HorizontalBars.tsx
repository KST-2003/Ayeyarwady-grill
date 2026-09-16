interface BarDatum {
  label: string;
  value: number;
  color: string;
}

interface HorizontalBarsProps {
  data: BarDatum[];
  valueFormatter?: (v: number) => string;
  emptyLabel?: string;
}

// Ranked or ordinal magnitude across a handful of labeled rows — order
// status, top-selling items. The caller decides both order (sorted vs a
// fixed pipeline order) and each row's color, so this stays purely a
// rendering primitive.
export default function HorizontalBars({
  data,
  valueFormatter = (v) => v.toLocaleString(),
  emptyLabel = "No data yet",
}: HorizontalBarsProps) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (data.length === 0) {
    return <p className="py-6 text-center text-sm text-grill-brown/40">{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2.5">
      {data.map((d) => (
        <div key={d.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-xs text-grill-brown/60" title={d.label}>
            {d.label}
          </span>
          <div className="h-3.5 flex-1 rounded-r bg-grill-brown/5">
            <div
              className="h-3.5 rounded-r transition-[width]"
              style={{
                width: d.value > 0 ? `${Math.max((d.value / max) * 100, 3)}%` : 0,
                backgroundColor: d.color,
              }}
            />
          </div>
          {/* Value at the tip, outside the bar — never clipped. */}
          <span className="w-14 shrink-0 text-right text-xs font-medium text-grill-brown">
            {valueFormatter(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
