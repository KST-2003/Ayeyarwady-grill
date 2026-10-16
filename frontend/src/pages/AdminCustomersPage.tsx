import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronRight, Search } from "lucide-react";
import api from "../lib/api";
import AdminSidebar from "../components/AdminSidebar";

interface CustomerRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  registrationDate: string;
  isActive: boolean;
  visitCount: number;
  bookingCount: number;
  orderCount: number;
  totalSpent: number;
  lastVisit: string | null;
  visitDates: string[];
}

const fmtDate = (d: string | null) =>
  d ? new Date(d).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" }) : "—";

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<CustomerRow[] | null>(null);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    api.get("/customers").then((res) => setCustomers(res.data));
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!customers) return null;
    if (!q) return customers;
    return customers.filter((c) =>
      [c.name, c.email, c.phone ?? ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [customers, query]);

  const totalSpent = customers?.reduce((sum, c) => sum + c.totalSpent, 0) ?? 0;
  const totalVisits = customers?.reduce((sum, c) => sum + c.visitCount, 0) ?? 0;

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar active="/admin/customers" />

      <main className="min-w-0 flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">Guests</p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Customers</h1>
        <p className="mt-2 text-sm text-grill-brown/50">
          A visit is a day with a confirmed booking or a placed order. Spend counts orders (excluding
          cancelled) plus verified booking deposits.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-lg">
          <div className="rounded-2xl border border-grill-brown/10 bg-white p-4 shadow-sm">
            <p className="font-display text-2xl text-grill-brown">{customers?.length ?? "—"}</p>
            <p className="text-xs text-grill-brown/50">Customers</p>
          </div>
          <div className="rounded-2xl border border-grill-brown/10 bg-white p-4 shadow-sm">
            <p className="font-display text-2xl text-grill-brown">{customers ? totalVisits : "—"}</p>
            <p className="text-xs text-grill-brown/50">Total visits</p>
          </div>
          <div className="rounded-2xl border border-grill-brown/10 bg-white p-4 shadow-sm">
            <p className="font-display text-2xl text-grill-brown">
              {customers ? totalSpent.toLocaleString() : "—"}
            </p>
            <p className="text-xs text-grill-brown/50">MMK spent</p>
          </div>
        </div>

        <div className="relative mt-6 sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-grill-brown/30" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email or phone"
            className="w-full rounded-lg border border-grill-brown/20 bg-white py-2.5 pl-10 pr-3.5 text-sm text-grill-brown placeholder:text-grill-brown/30 focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/15"
          />
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-grill-brown/10 bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-grill-brown/10 text-xs uppercase tracking-wider text-grill-brown/40">
              <tr>
                <th className="px-5 py-3 font-medium">Customer</th>
                <th className="px-3 py-3 font-medium">Contact</th>
                <th className="px-3 py-3 text-right font-medium">Visits</th>
                <th className="px-3 py-3 text-right font-medium">Orders</th>
                <th className="px-3 py-3 text-right font-medium">Spent (MMK)</th>
                <th className="px-3 py-3 font-medium">Last visit</th>
                <th className="px-5 py-3 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-grill-brown/5">
              {filtered?.map((c) => {
                const open = openId === c.id;
                return (
                  <Fragment key={c.id}>
                    <tr
                      onClick={() => setOpenId(open ? null : c.id)}
                      className="cursor-pointer hover:bg-grill-orange/5"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {open ? (
                            <ChevronDown className="h-4 w-4 text-grill-brown/40" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-grill-brown/40" />
                          )}
                          <span className="font-medium text-grill-brown">{c.name}</span>
                          {!c.isActive && (
                            <span className="rounded-full bg-grill-brown/5 px-2 py-0.5 text-[11px] text-grill-brown/50">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-grill-brown/70">
                        <p>{c.email}</p>
                        <p className="text-xs text-grill-brown/40">{c.phone ?? "—"}</p>
                      </td>
                      <td className="px-3 py-3.5 text-right text-grill-brown">{c.visitCount}</td>
                      <td className="px-3 py-3.5 text-right text-grill-brown/70">{c.orderCount}</td>
                      <td className="px-3 py-3.5 text-right font-medium text-grill-brown">
                        {c.totalSpent.toLocaleString()}
                      </td>
                      <td className="px-3 py-3.5 text-grill-brown/70">{fmtDate(c.lastVisit)}</td>
                      <td className="px-5 py-3.5 text-grill-brown/70">{fmtDate(c.registrationDate)}</td>
                    </tr>
                    {open && (
                      <tr className="bg-cream/60">
                        <td colSpan={7} className="px-5 py-4 pl-11">
                          <p className="text-xs font-medium text-grill-brown/60">
                            Visit dates ({c.visitCount}) · {c.bookingCount} booking
                            {c.bookingCount === 1 ? "" : "s"}
                          </p>
                          {c.visitDates.length ? (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {c.visitDates.map((d) => (
                                <span
                                  key={d}
                                  className="rounded-full border border-grill-brown/10 bg-white px-2.5 py-1 text-xs text-grill-brown/70"
                                >
                                  {fmtDate(d)}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="mt-2 text-xs text-grill-brown/40">No visits yet</p>
                          )}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered?.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-sm text-grill-brown/40">
                    No customers found
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
