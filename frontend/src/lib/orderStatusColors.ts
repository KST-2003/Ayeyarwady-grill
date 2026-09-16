// The kitchen pipeline is ordinal (PLACED -> ... -> COMPLETED), so charts
// give it a single-hue ramp that gets darker as an order progresses — not a
// generic categorical palette, which would imply the stages are unrelated.
// CANCELLED falls outside that progression, so it takes the app's reserved
// "critical" status color instead of the next ramp step. This is
// deliberately a different mapping than StatusBadge's, which groups stages
// by family (early/mid/late) for quick scanning rather than showing each
// one distinctly — charts need the finer distinction, badges don't.
export const ORDER_STATUS_RAMP: Record<string, string> = {
  PLACED: "#86b6ef",
  PREPARING: "#5598e7",
  READY: "#2a78d6",
  SERVED: "#1c5cab",
  COMPLETED: "#104281",
  CANCELLED: "#d03b3b",
};

export function titleCaseStatus(status: string): string {
  return status.charAt(0) + status.slice(1).toLowerCase();
}
