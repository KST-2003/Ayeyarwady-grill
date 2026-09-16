interface ShareDatum {
  label: string;
  value: number;
  color: string;
}

interface StackedShareBarProps {
  data: ShareDatum[];
  valueFormatter?: (v: number) => string;
  emptyLabel?: string;
}

// Part-to-whole is a single segmented bar, not a pie — each category's
// share of one total, read left to right, with a legend carrying identity
// (color is never the only cue) plus the exact value and percentage.
export default function StackedShareBar({
  data,
  valueFormatter = (v) => v.toLocaleString(),
  emptyLabel = "No data yet",
}: StackedShareBarProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const shown = data.filter((d) => d.value > 0);

  if (total <= 0) {
    return <p className="py-6 text-center text-sm text-grill-brown/40">{emptyLabel}</p>;
  }

  return (
    <div>
      <div className="flex h-5 w-full overflow-hidden rounded-full bg-white">
        {shown.map((d, i) => (
          <div
            key={d.label}
            title={`${d.label}: ${valueFormatter(d.value)}`}
            className={i > 0 ? "ml-[2px]" : ""}
            style={{ width: `${(d.value / total) * 100}%`, backgroundColor: d.color }}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {shown.map((d) => (
          <div key={d.label} className="flex items-center gap-1.5 text-xs text-grill-brown/60">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: d.color }} />
            {d.label}
            <span className="font-medium text-grill-brown">
              {valueFormatter(d.value)} · {Math.round((d.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
