import { useEffect, useMemo, useState, FormEvent } from "react";
import { Plus, QrCode, Users } from "lucide-react";
import api from "../lib/api";
import AdminSidebar from "../components/AdminSidebar";

interface Table {
  id: string;
  tableNumber: number;
  capacity: number;
  status: string;
  section: { id: string; sectionName: string };
  qrCode?: { token: string };
}

const STATUS_STYLES: Record<string, string> = {
  AVAILABLE: "bg-emerald-50 text-emerald-700",
  OCCUPIED: "bg-amber-50 text-amber-700",
  NEEDS_CLEANING: "bg-red-50 text-red-700",
  RESERVED: "bg-blue-50 text-blue-700",
};

export default function AdminTablesPage() {
  const [tables, setTables] = useState<Table[] | null>(null);
  const [qrPreview, setQrPreview] = useState<{ tableNumber: number; imageDataUrl: string } | null>(null);

  const [sectionId, setSectionId] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [capacity, setCapacity] = useState("");
  const [error, setError] = useState("");

  function refresh() {
    api.get("/tables").then((res) => setTables(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  const sections = useMemo(() => {
    const map = new Map<string, string>();
    tables?.forEach((t) => map.set(t.section.id, t.section.sectionName));
    return Array.from(map, ([id, sectionName]) => ({ id, sectionName }));
  }, [tables]);

  async function generateQr(table: Table) {
    const { data } = await api.post(`/tables/${table.id}/qr`);
    setQrPreview({ tableNumber: table.tableNumber, imageDataUrl: data.imageDataUrl });
    refresh();
  }

  async function setStatus(table: Table, status: string) {
    await api.patch(`/tables/${table.id}/status`, { status });
    refresh();
  }

  async function addTable(e: FormEvent) {
    e.preventDefault();
    if (!sectionId || !tableNumber || !capacity) return;
    setError("");
    try {
      await api.post("/tables", {
        sectionId,
        tableNumber: Number(tableNumber),
        capacity: Number(capacity),
      });
      setTableNumber("");
      setCapacity("");
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Could not add table");
    }
  }

  const counts = tables?.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/admin/tables" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Floor plan
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Tables & QR Codes</h1>
        <p className="mt-2 text-sm text-grill-brown/50">
          Table status updates in real time on the staff dashboard; QR codes link to the
          contactless ordering page for that table.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4 sm:max-w-2xl">
          {(["AVAILABLE", "OCCUPIED", "NEEDS_CLEANING", "RESERVED"] as const).map((s) => (
            <div key={s} className="rounded-2xl border border-grill-brown/10 bg-white p-4 shadow-sm">
              <p className="font-display text-2xl text-grill-brown">{tables ? counts?.[s] ?? 0 : "—"}</p>
              <p className="text-xs text-grill-brown/50">{s.replace(/_/g, " ").toLowerCase()}</p>
            </div>
          ))}
        </div>

        <form
          onSubmit={addTable}
          className="mt-6 flex flex-wrap items-end gap-3 rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm"
        >
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-grill-brown/40">Section</label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="mt-1 rounded-md border border-grill-brown/20 px-3 py-2 text-sm focus:border-grill-orange focus:outline-none"
            >
              <option value="">Select…</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{s.sectionName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-grill-brown/40">Table #</label>
            <input
              type="number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              className="mt-1 w-24 rounded-md border border-grill-brown/20 px-3 py-2 text-sm focus:border-grill-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wide text-grill-brown/40">Capacity</label>
            <input
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              className="mt-1 w-24 rounded-md border border-grill-brown/20 px-3 py-2 text-sm focus:border-grill-orange focus:outline-none"
            />
          </div>
          <button className="flex items-center gap-1 rounded-md bg-grill-orange px-4 py-2 text-sm font-medium text-white hover:bg-grill-orange-dark">
            <Plus className="h-4 w-4" strokeWidth={2} />
            Add table
          </button>
          {error && <p className="w-full text-xs text-red-600">{error}</p>}
          {sections.length === 0 && (
            <p className="w-full text-xs text-grill-brown/40">
              No sections exist yet — seed at least one table_section before adding tables.
            </p>
          )}
        </form>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tables?.map((t) => (
            <div key={t.id} className="rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-grill-brown">Table {t.tableNumber}</span>
                <span className="text-xs text-grill-brown/50">{t.section.sectionName}</span>
              </div>
              <p className="mt-1 flex items-center gap-1 text-xs text-grill-brown/50">
                <Users className="h-3 w-3" strokeWidth={1.75} />
                Seats {t.capacity}
              </p>

              <select
                value={t.status}
                onChange={(e) => setStatus(t, e.target.value)}
                className={`mt-3 w-full rounded-md border-0 px-2.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-grill-orange/20 ${
                  STATUS_STYLES[t.status] ?? "bg-grill-brown/5 text-grill-brown/70"
                }`}
              >
                <option value="AVAILABLE">Available</option>
                <option value="OCCUPIED">Occupied</option>
                <option value="NEEDS_CLEANING">Needs cleaning</option>
                <option value="RESERVED">Reserved</option>
              </select>

              <button
                onClick={() => generateQr(t)}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md bg-grill-brown py-2 text-xs font-medium text-white hover:bg-grill-brown-light"
              >
                <QrCode className="h-3.5 w-3.5" strokeWidth={1.75} />
                {t.qrCode ? "Regenerate QR code" : "Generate QR code"}
              </button>
            </div>
          ))}
          {tables?.length === 0 && (
            <p className="col-span-full py-16 text-center text-sm text-grill-brown/40">No tables yet</p>
          )}
        </div>

        {qrPreview && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 p-4">
            <div className="rounded-xl bg-white p-6 text-center">
              <p className="mb-3 font-medium text-grill-brown">Table {qrPreview.tableNumber} QR code</p>
              <img src={qrPreview.imageDataUrl} alt="QR code" className="mx-auto h-48 w-48" />
              <button
                onClick={() => setQrPreview(null)}
                className="mt-4 rounded-md bg-grill-brown px-4 py-2 text-sm text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
