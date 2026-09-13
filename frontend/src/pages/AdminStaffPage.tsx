import { useEffect, useState, FormEvent } from "react";
import { Mail, Phone, UserPlus } from "lucide-react";
import api from "../lib/api";
import AdminSidebar from "../components/AdminSidebar";

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  isActive: boolean;
  role: { roleName: string };
}
interface Role {
  id: string;
  roleName: string;
}

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<StaffMember[] | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function refresh() {
    api.get("/staff").then((res) => setStaff(res.data));
    api.get("/staff/roles").then((res) => setRoles(res.data));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addStaff(e: FormEvent) {
    e.preventDefault();
    if (!name || !email || !roleId || !password) return;
    setError("");
    try {
      await api.post("/staff", { name, email, roleId, password });
      setName("");
      setEmail("");
      setRoleId("");
      setPassword("");
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Could not create staff account");
    }
  }

  async function toggleActive(member: StaffMember) {
    await api.patch(`/staff/${member.id}`, { isActive: !member.isActive });
    refresh();
  }

  const activeCount = staff?.filter((s) => s.isActive).length ?? 0;

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/admin/staff" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Team management
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Staff Accounts</h1>
        <p className="mt-2 text-sm text-grill-brown/50">
          Create accounts for waiters and managers. Deactivate an account instead of deleting it
          to preserve its order/booking history.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 sm:max-w-md">
          <div className="rounded-2xl border border-grill-brown/10 bg-white p-4 shadow-sm">
            <p className="font-display text-2xl text-grill-brown">{staff?.length ?? "—"}</p>
            <p className="text-xs text-grill-brown/50">Total accounts</p>
          </div>
          <div className="rounded-2xl border border-grill-brown/10 bg-white p-4 shadow-sm">
            <p className="font-display text-2xl text-grill-brown">{staff ? activeCount : "—"}</p>
            <p className="text-xs text-grill-brown/50">Active</p>
          </div>
        </div>

        <form
          onSubmit={addStaff}
          className="mt-6 grid gap-3 rounded-2xl border border-grill-brown/10 bg-white p-5 shadow-sm md:grid-cols-5"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            className="rounded-md border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10 md:col-span-1"
          />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            type="email"
            className="rounded-md border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10 md:col-span-1"
          />
          <select
            value={roleId}
            onChange={(e) => setRoleId(e.target.value)}
            className="rounded-md border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10 md:col-span-1"
          >
            <option value="">Select role…</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>{r.roleName}</option>
            ))}
          </select>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Temporary password"
            type="password"
            className="rounded-md border border-grill-brown/20 px-3.5 py-2.5 text-sm focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10 md:col-span-1"
          />
          <button className="flex items-center justify-center gap-1.5 rounded-md bg-grill-orange py-2.5 text-sm font-medium text-white hover:bg-grill-orange-dark md:col-span-1">
            <UserPlus className="h-4 w-4" strokeWidth={2} />
            Create account
          </button>
          {error && <p className="text-xs text-red-600 md:col-span-5">{error}</p>}
        </form>

        <div className="mt-6 divide-y divide-grill-brown/5 rounded-2xl border border-grill-brown/10 bg-white shadow-sm">
          {staff?.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-4 px-6 py-4 text-sm">
              <div className="min-w-0 flex-1">
                <p className="font-medium text-grill-brown">{s.name}</p>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-xs text-grill-brown/50">
                  <span className="flex items-center gap-1">
                    <Mail className="h-3 w-3" strokeWidth={1.75} />
                    {s.email}
                  </span>
                  {s.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" strokeWidth={1.75} />
                      {s.phone}
                    </span>
                  )}
                </div>
              </div>
              <span className="shrink-0 rounded-full bg-grill-brown/5 px-2.5 py-1 text-xs text-grill-brown/70">
                {s.role.roleName}
              </span>
              <button
                onClick={() => toggleActive(s)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  s.isActive ? "bg-emerald-50 text-emerald-700" : "bg-grill-brown/5 text-grill-brown/50"
                }`}
              >
                {s.isActive ? "Active" : "Inactive"}
              </button>
            </div>
          ))}
          {staff?.length === 0 && (
            <p className="px-6 py-16 text-center text-sm text-grill-brown/40">No staff accounts yet</p>
          )}
        </div>
      </main>
    </div>
  );
}
