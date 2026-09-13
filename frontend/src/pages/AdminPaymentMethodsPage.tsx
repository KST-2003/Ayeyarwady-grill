import { useEffect, useRef, useState, FormEvent } from "react";
import { QrCode, Upload } from "lucide-react";
import api from "../lib/api";
import AdminSidebar from "../components/AdminSidebar";

interface PaymentMethod {
  id: string;
  methodName: string;
  isActive: boolean;
  qrImageUrl: string | null;
}

function MethodCard({ method, onUpdated }: { method: PaymentMethod; onUpdated: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  async function toggleActive() {
    await api.patch(`/payment-methods/${method.id}`, { isActive: !method.isActive });
    onUpdated();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("qrImage", file);
      await api.post(`/payment-methods/${method.id}/qr-image`, form);
      onUpdated();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-medium text-grill-brown">{method.methodName}</span>
        <button
          onClick={toggleActive}
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            method.isActive ? "bg-emerald-50 text-emerald-700" : "bg-grill-brown/5 text-grill-brown/50"
          }`}
        >
          {method.isActive ? "Active" : "Inactive"}
        </button>
      </div>

      <div className="mt-4 flex h-32 w-32 items-center justify-center overflow-hidden rounded-lg border border-dashed border-grill-brown/20 bg-grill-brown/[0.02]">
        {method.qrImageUrl ? (
          <img src={method.qrImageUrl} alt={`${method.methodName} QR`} className="h-full w-full object-contain" />
        ) : (
          <QrCode className="h-10 w-10 text-grill-brown/15" strokeWidth={1} />
        )}
      </div>

      <button
        onClick={() => fileInput.current?.click()}
        disabled={uploading}
        className="mt-3 flex items-center gap-1.5 text-xs font-medium text-grill-orange-dark hover:underline disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" strokeWidth={2} />
        {uploading ? "Uploading…" : method.qrImageUrl ? "Replace QR image" : "Upload scan-to-pay QR"}
      </button>
      <input ref={fileInput} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <p className="mt-1 text-xs text-grill-brown/35">Max 2MB</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function AdminPaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  function refresh() {
    api.get("/payment-methods").then((res) => setMethods(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addMethod(e: FormEvent) {
    e.preventDefault();
    if (!name) return;
    setError("");
    try {
      await api.post("/payment-methods", { methodName: name });
      setName("");
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Could not add payment method");
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/admin/payment-methods" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Deposits & checkout
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Payment Methods</h1>
        <p className="mt-2 text-sm text-grill-brown/50">
          Upload the scan-to-pay QR customers see when confirming a booking. The first active
          method with a QR image uploaded is what shows on the customer's booking page.
        </p>

        <form onSubmit={addMethod} className="mt-6 flex gap-2 rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. WavePay"
            className="flex-1 rounded-md border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
          />
          <button className="rounded-md bg-grill-orange px-5 py-2.5 text-sm font-medium text-white hover:bg-grill-orange-dark">
            Add method
          </button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((m) => (
            <MethodCard key={m.id} method={m} onUpdated={refresh} />
          ))}
          {methods.length === 0 && (
            <p className="col-span-full py-16 text-center text-sm text-grill-brown/40">
              No payment methods yet
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
