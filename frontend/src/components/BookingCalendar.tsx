import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS_AHEAD = 3; // current month + 2 more

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function buildMonthGrid(monthStart: Date): (Date | null)[] {
  const year = monthStart.getFullYear();
  const month = monthStart.getMonth();
  const firstWeekday = monthStart.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export default function BookingCalendar({
  selectedDate,
  onSelect,
}: {
  selectedDate: Date | null;
  onSelect: (date: Date) => void;
}) {
  const todayKey = toDateKey(new Date());

  const minMonth = startOfMonth(new Date());
  const maxMonth = addMonths(minMonth, MONTHS_AHEAD - 1);

  const [viewMonth, setViewMonth] = useState(minMonth);

  const cells = buildMonthGrid(viewMonth);
  const canGoPrev = viewMonth.getTime() > minMonth.getTime();
  const canGoNext = viewMonth.getTime() < maxMonth.getTime();

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => canGoPrev && setViewMonth(addMonths(viewMonth, -1))}
          disabled={!canGoPrev}
          className="flex h-8 w-8 items-center justify-center rounded-full text-grill-brown/60 transition-colors hover:bg-grill-brown/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" strokeWidth={2} />
        </button>
        <p className="font-display text-base text-grill-brown">
          {viewMonth.toLocaleDateString(undefined, { month: "long", year: "numeric" })}
        </p>
        <button
          type="button"
          onClick={() => canGoNext && setViewMonth(addMonths(viewMonth, 1))}
          disabled={!canGoNext}
          className="flex h-8 w-8 items-center justify-center rounded-full text-grill-brown/60 transition-colors hover:bg-grill-brown/5 disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1.5">
        {WEEKDAY_LABELS.map((label) => (
          <p key={label} className="text-center text-[10px] font-medium uppercase tracking-wide text-grill-brown/35">
            {label}
          </p>
        ))}

        {cells.map((date, i) => {
          if (!date) return <div key={`blank-${i}`} />;

          const key = toDateKey(date);
          const isPast = key < todayKey;
          const isToday = key === todayKey;
          const isSelected = selectedDate && toDateKey(selectedDate) === key;

          return (
            <button
              key={key}
              type="button"
              disabled={isPast}
              onClick={() => onSelect(date)}
              className={`relative rounded-lg py-2 text-center text-sm transition-colors ${
                isPast
                  ? "cursor-not-allowed text-grill-brown/20"
                  : isSelected
                  ? "bg-grill-orange text-white font-medium"
                  : isToday
                  ? "text-grill-brown ring-1 ring-inset ring-grill-orange/50 font-medium"
                  : "text-grill-brown/80 hover:bg-grill-orange/10"
              }`}
            >
              {date.getDate()}
              {isToday && !isSelected && (
                <span className="absolute bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-grill-orange" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
