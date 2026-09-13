import { useEffect, useState } from "react";
import { LogIn, LogOut } from "lucide-react";
import api from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AdminSidebar from "../components/AdminSidebar";

interface AttendanceRecord {
  id: string;
  timestamp: string;
  notes: string | null;
  type: { typeName: string };
  staff?: { name: string };
}

export default function AdminAttendancePage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const [records, setRecords] = useState<AttendanceRecord[] | null>(null);
  const [clocking, setClocking] = useState(false);

  function refresh() {
    const endpoint = isAdmin ? "/staff/attendance" : "/staff/attendance/mine";
    api.get(endpoint).then((res) => setRecords(res.data));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lastType = records?.[0]?.type.typeName;
  const nextAction = lastType === "Clock In" ? "Clock Out" : "Clock In";

  async function clock() {
    setClocking(true);
    try {
      await api.post("/staff/clock", { type: nextAction });
      refresh();
    } finally {
      setClocking(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/staff/attendance" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Time tracking
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Attendance</h1>
        <p className="mt-2 text-sm text-grill-brown/50">
          {isAdmin ? "Clock-in/out history for every staff member" : "Your clock-in/out history"}
        </p>

        <div className="mt-6 flex items-center gap-4 rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm">
          <span
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
              nextAction === "Clock In" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
            }`}
          >
            {nextAction === "Clock In" ? (
              <LogIn className="h-5 w-5" strokeWidth={1.75} />
            ) : (
              <LogOut className="h-5 w-5" strokeWidth={1.75} />
            )}
          </span>
          <div className="flex-1">
            <p className="font-medium text-grill-brown">
              {lastType ? `Currently ${lastType === "Clock In" ? "clocked in" : "clocked out"}` : "No clock records yet"}
            </p>
            <p className="text-xs text-grill-brown/50">Signed in as {user?.name}</p>
          </div>
          <button
            onClick={clock}
            disabled={clocking}
            className="rounded-md bg-grill-orange px-4 py-2 text-sm font-medium text-white hover:bg-grill-orange-dark disabled:opacity-50"
          >
            {clocking ? "Saving…" : nextAction}
          </button>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-grill-brown/10 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-grill-brown/40">
                {isAdmin && <th className="px-6 py-4 font-medium">Staff</th>}
                <th className="px-6 py-4 font-medium">Action</th>
                <th className="px-6 py-4 font-medium">Time</th>
                <th className="px-6 py-4 font-medium">Notes</th>
              </tr>
            </thead>
            <tbody>
              {records?.map((r) => (
                <tr key={r.id} className="border-t border-grill-brown/5">
                  {isAdmin && (
                    <td className="px-6 py-4 font-medium text-grill-brown">{r.staff?.name ?? "—"}</td>
                  )}
                  <td className="px-6 py-4">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        r.type.typeName === "Clock In"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {r.type.typeName}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-grill-brown/70">
                    {new Date(r.timestamp).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                  <td className="px-6 py-4 text-grill-brown/50">{r.notes ?? "—"}</td>
                </tr>
              ))}
              {records?.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-6 py-16 text-center text-grill-brown/40">
                    No attendance records yet
                  </td>
                </tr>
              )}
              {records === null && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-6 py-16 text-center text-grill-brown/40">
                    Loading…
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
