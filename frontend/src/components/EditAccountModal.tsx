import { FormEvent, useState } from "react";
import { Check, X } from "lucide-react";
import api from "../lib/api";

interface Props {
  // API path of the account, e.g. "/staff/3" or "/customers/7"
  endpoint: string;
  title: string;
  account: { name: string; email: string; phone: string | null };
  onClose: () => void;
  onSaved: () => void;
}

const field =
  "w-full rounded-lg border border-grill-brown/20 bg-white px-3.5 py-2.5 text-sm text-grill-brown placeholder:text-grill-brown/30 focus:border-grill-orange focus:outline-none focus:ring-2 focus:ring-grill-orange/15";

// Lets an admin fix contact details and reset the login email / password
// of a staff or customer account. Leaving the password blank keeps it.
export default function EditAccountModal({ endpoint, title, account, onClose, onSaved }: Props) {
  const [name, setName] = useState(account.name);
  const [email, setEmail] = useState(account.email);
  const [phone, setPhone] = useState(account.phone ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loginChanged = email.trim() !== account.email || password !== "";

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required");
      return;
    }
    if (password && password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, string> = { name: name.trim(), email: email.trim(), phone };
      if (password) body.password = password;
      await api.patch(endpoint, body);
      onSaved();
    } catch (err: any) {
      setError(err?.response?.data?.error ?? "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-grill-brown/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <form
        onSubmit={save}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-display text-xl text-grill-brown">{title}</h2>
            <p className="mt-0.5 text-xs text-grill-brown/50">Update details or reset login credentials.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Close"
            className="rounded-md p-1.5 text-grill-brown/40 hover:bg-grill-brown/5"
          >
            <X className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-grill-brown/70">Name</span>
            <input value={name} onChange={(e) => setName(e.target.value)} autoFocus className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-grill-brown/70">Login email</span>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-grill-brown/70">Phone</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Optional" className={field} />
          </label>
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-grill-brown/70">New password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank to keep the current password"
              autoComplete="new-password"
              className={field}
            />
          </label>
        </div>

        {loginChanged && (
          <p className="mt-3 rounded-lg bg-grill-orange/10 px-3 py-2 text-xs text-grill-orange-dark">
            Changing the email or password signs this person out of all devices.
          </p>
        )}
        {error && <p className="mt-3 text-xs text-red-600">{error}</p>}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-grill-brown/20 bg-white px-4 py-2.5 text-sm font-medium text-grill-brown/70 hover:bg-grill-brown/5"
          >
            Cancel
          </button>
          <button
            disabled={saving}
            className="flex items-center gap-1.5 rounded-lg bg-grill-orange px-5 py-2.5 text-sm font-medium text-white hover:bg-grill-orange-dark disabled:opacity-60"
          >
            <Check className="h-4 w-4" strokeWidth={2} />
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
