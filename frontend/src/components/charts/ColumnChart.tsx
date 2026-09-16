import { useState } from "react";

interface ColumnDatum {
  /** Short axis label, e.g. "Sep 9" — only every few are actually drawn. */
  label: string;
  value: number;
  /** Shown in the hover tooltip instead of `label` when given. */
  fullLabel?: string;
}

interface ColumnChartProps {
  data: ColumnDatum[];
  /** Single hex color — a trend-over-time chart is one series, one hue. */
  color: string;
  valueFormatter?: (v: number) => string;
  height?: number;
}

// A trend-over-time chart for ONE measure: single hue, one axis. Deliberately
// has no library dependency — this is the whole chart, in plain SVG, per the
// mark specs (rounded data-ends, hairline gridlines, a hover tooltip).
export default function ColumnChart({
  data,
  color,
  valueFormatter = (v) => v.toLocaleString(),
  height = 160,
}: ColumnChartProps) {
  const [hover, setHover] = useState<number | null>(null);

  const max = Math.max(0, ...data.map((d) => d.value));
  const axisMax = niceCeil(max);

  const padding = { top: 10, right: 4, bottom: 20, left: 4 };
  const chartW = Math.max(240, data.length * 32);
  const plotW = chartW - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;
  const bandW = plotW / Math.max(data.length, 1);
  const barW = Math.min(24, bandW * 0.6);
  const labelEvery = Math.max(1, Math.ceil(data.length / 7));

  return (
    <div className="relative w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartW} ${height}`}
        className="w-full"
        style={{ minWidth: Math.min(chartW, 480) }}
        preserveAspectRatio="none"
        role="img"
        aria-label="Trend chart"
      >
        {[0, 0.5, 1].map((g) => {
          const y = padding.top + plotH * (1 - g);
          return (
            <line
              key={g}
              x1={padding.left}
              x2={chartW - padding.right}
              y1={y}
              y2={y}
              stroke="#e1e0d9"
              strokeWidth={1}
            />
          );
        })}

        {data.map((d, i) => {
          const x = padding.left + i * bandW + (bandW - barW) / 2;
          const h = axisMax === 0 ? 0 : (d.value / axisMax) * plotH;
          const y = padding.top + plotH - h;
          const dimmed = hover !== null && hover !== i;

          return (
            <g
              key={i}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover((cur) => (cur === i ? null : cur))}
            >
              {/* Full-height invisible hit target — the visible bar can be much
                  thinner than the band, but hover shouldn't require pixel-precision. */}
              <rect x={padding.left + i * bandW} y={padding.top} width={bandW} height={plotH} fill="transparent" />
              {d.value > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={Math.max(h, 2)}
                  rx={4}
                  fill={color}
                  opacity={dimmed ? 0.4 : 1}
                />
              )}
              {i % labelEvery === 0 && (
                <text x={x + barW / 2} y={height - 5} textAnchor="middle" fontSize={9} fill="#898781">
                  {d.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {hover !== null && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-md bg-grill-brown px-2.5 py-1.5 text-[11px] text-white shadow-lg"
          style={{ left: `${((hover + 0.5) / data.length) * 100}%`, top: 4 }}
        >
          <div className="text-white/55">{data[hover].fullLabel ?? data[hover].label}</div>
          <div className="font-medium">{valueFormatter(data[hover].value)}</div>
        </div>
      )}
    </div>
  );
}

// Rounds an axis max up to a clean step (1/2/5 × a power of ten) so
// gridlines land on human numbers instead of the tallest bar's exact value.
function niceCeil(n: number): number {
  if (n <= 0) return 1;
  const magnitude = Math.pow(10, Math.floor(Math.log10(n)));
  const residual = n / magnitude;
  const step = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return step * magnitude;
}
