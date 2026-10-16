import api from "./api";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

export function isWebPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

async function syncSubscription(subscription: PushSubscription): Promise<void> {
  const p256dh = subscription.getKey("p256dh");
  const auth = subscription.getKey("auth");
  if (!p256dh || !auth) return;
  await api.post("/push/subscriptions", {
    endpoint: subscription.endpoint,
    p256dh: arrayBufferToBase64(p256dh),
    auth: arrayBufferToBase64(auth),
  });
}

/**
 * Register the service worker, subscribe to push and sync with the backend.
 * Never throws — push is best-effort and must never break login or the page.
 *
 * Browsers only show the permission prompt after a user click, so call this
 * with `prompt: true` from an "Enable notifications" button. With
 * `prompt: false` (the default, used on page load) it only re-syncs when
 * permission was already granted.
 */
export async function registerPushSubscription({ prompt = false } = {}): Promise<void> {
  if (!isWebPushSupported()) return;

  try {
    if (Notification.permission === "denied") return;
    if (Notification.permission === "default") {
      if (!prompt) return;
      if ((await Notification.requestPermission()) !== "granted") return;
    }

    const { data } = await api.get("/push/public-key");
    if (!data?.publicKey) return;

    const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
    await navigator.serviceWorker.ready;

    // Re-sync an existing subscription in case the server's copy was deleted.
    const existing = await registration.pushManager.getSubscription();
    if (existing) {
      await syncSubscription(existing);
      return;
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey) as BufferSource,
    });
    await syncSubscription(subscription);
  } catch (err) {
    console.warn("[WebPush] Registration failed:", err);
  }
}

/**
 * Call at the START of logout. Takes the auth token explicitly because the
 * caller clears it from storage right after. Always unsubscribes in the
 * browser, even if the backend call fails.
 */
export async function unregisterPushSubscription(token: string | null): Promise<void> {
  if (!isWebPushSupported()) return;

  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    for (const registration of registrations) {
      const subscription = await registration.pushManager.getSubscription();
      if (!subscription) continue;
      if (token) {
        api
          .delete("/push/subscriptions", {
            data: { endpoint: subscription.endpoint },
            headers: { Authorization: `Bearer ${token}` },
          })
          .catch(() => {});
      }
      await subscription.unsubscribe();
    }
  } catch (err) {
    console.warn("[WebPush] Unregister failed:", err);
  }
}
