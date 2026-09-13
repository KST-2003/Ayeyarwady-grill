import { FormEvent, useEffect, useState } from "react";
import { Check, Mail, MapPin, Phone, User as UserIcon } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import CustomerSidebar from "../components/CustomerSidebar";

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [address, setAddress] = useState(user?.address ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setAddress(user?.address ?? "");
  }, [user]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);
    try {
      await updateProfile({ name, phone, address });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const initials = (user?.name ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex min-h-screen bg-cream">
      <CustomerSidebar active="/dashboard/profile" />

      <main className="flex-1 px-10 py-10">
        <p className="text-xs font-semibold uppercase tracking-[0.15em] text-grill-orange-dark">
          Account settings
        </p>
        <h1 className="mt-1 font-display text-3xl text-grill-brown">Profile</h1>
        <p className="mt-2 text-sm text-grill-brown/50">Update your contact details</p>

        <div className="mt-8 max-w-2xl overflow-hidden rounded-2xl border border-grill-brown/10 bg-white shadow-sm">
          <div className="flex items-center gap-4 border-b border-grill-brown/8 bg-grill-brown-dark px-7 py-6">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-grill-orange/20 font-display text-lg text-grill-orange-light">
              {initials}
            </span>
            <div>
              <p className="font-display text-lg text-white">{user?.name}</p>
              <p className="text-xs text-white/50">{user?.role === "CUSTOMER" ? "Customer" : user?.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5 px-7 py-7">
            <div>
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-grill-brown/50">
                <Mail className="h-3.5 w-3.5" strokeWidth={1.75} />
                Email
              </label>
              <input
                value={user?.email ?? ""}
                disabled
                className="mt-2 w-full rounded-lg border border-grill-brown/10 bg-grill-brown/5 px-3.5 py-2.5 text-sm text-grill-brown/50"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-grill-brown/50">
                <UserIcon className="h-3.5 w-3.5" strokeWidth={1.75} />
                Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="mt-2 w-full rounded-lg border border-grill-brown/20 px-3.5 py-2.5 text-sm transition-colors focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-grill-brown/50">
                <Phone className="h-3.5 w-3.5" strokeWidth={1.75} />
                Phone
              </label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="09-xxx-xxx-xxx"
                className="mt-2 w-full rounded-lg border border-grill-brown/20 px-3.5 py-2.5 text-sm transition-colors focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
              />
            </div>
            {user?.role === "CUSTOMER" && (
              <div>
                <label className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-grill-brown/50">
                  <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />
                  Address
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="mt-2 w-full rounded-lg border border-grill-brown/20 px-3.5 py-2.5 text-sm transition-colors focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/10"
                />
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-grill-orange px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-grill-orange/30 transition-colors hover:bg-grill-orange-dark disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm text-emerald-600">
                  <Check className="h-4 w-4" strokeWidth={2} />
                  Profile updated
                </span>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
