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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

let echo: Echo<"reverb"> | null = null;
let echoToken: string | null = null;

// Closes the socket — call on logout so the next login starts a fresh,
// correctly-authorized connection.
export function disconnectEcho() {
  echo?.disconnect();
  echo = null;
  echoToken = null;
}

function getEcho(): Echo<"reverb"> {
  // The staff channel is private, so the connection carries the bearer token
  // for POST /api/broadcasting/auth. Rebuild it if the logged-in user changed.
  const token = localStorage.getItem("token");
  if (echo && token !== echoToken) disconnectEcho();

  if (!echo) {
    echoToken = token;
    echo = new Echo({
      authEndpoint: `${API_URL}/broadcasting/auth`,
      auth: { headers: { Authorization: `Bearer ${token}`, Accept: "application/json" } },
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

// The private channel every staff/admin dashboard listens on — matches the
// Laravel backend's `new PrivateChannel('staff-room')` used by all four
// broadcast events (OrderCreated, OrderStatusChanged, TableStatusChanged,
// BookingCreated). Only staff/admin tokens are authorized (routes/channels.php).
export function getStaffChannel() {
  return getEcho().private("staff-room");
}
