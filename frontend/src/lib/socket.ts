import Echo from "laravel-echo";
import Pusher from "pusher-js";

// Reverb speaks the Pusher protocol, so Echo's built-in "reverb"
// broadcaster just needs the same connection details as the Laravel
// backend's REVERB_* .env values.
declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}
window.Pusher = Pusher;

let echo: Echo<"reverb"> | null = null;

function getEcho(): Echo<"reverb"> {
  if (!echo) {
    echo = new Echo({
      broadcaster: "reverb",
      key: import.meta.env.VITE_REVERB_APP_KEY || "local-reverb-key",
      wsHost: import.meta.env.VITE_REVERB_HOST || "localhost",
      wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
      wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 8080,
      forceTLS: (import.meta.env.VITE_REVERB_SCHEME || "http") === "https",
      enabledTransports: ["ws", "wss"],
    });
  }
  return echo;
}

// The shared channel every staff/admin dashboard listens on — matches the
// Laravel backend's `new Channel('staff-room')` used by all four broadcast
// events (OrderCreated, OrderStatusChanged, TableStatusChanged, BookingCreated).
export function getStaffChannel() {
  return getEcho().channel("staff-room");
}
