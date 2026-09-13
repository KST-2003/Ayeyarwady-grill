const TITLES: Record<string, string> = {
  BOOKING_REMINDER: "Booking Reminder",
  DEPOSIT_RECEIPT: "Deposit Receipt",
  PAYMENT_REJECTED: "Payment Rejected",
  ORDER_UPDATE: "Order Update",
};

// The schema's `notifications.type` is a free-text string (see
// database-schema.md: "BOOKING_REMINDER / ORDER_UPDATE / DEPOSIT_RECEIPT /
// etc."), not a fixed enum — this covers the known values and falls back to
// title-casing anything else so a new type never renders as raw SNAKE_CASE.
export function notificationTitle(type: string): string {
  if (TITLES[type]) return TITLES[type];
  return type
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}
