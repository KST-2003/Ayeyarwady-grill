import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth, Role } from "../context/AuthContext";

// Seeded demo accounts (see DatabaseSeeder) — shown on the login page so
// anyone testing the app doesn't have to dig through the README for them.
const DEMO_CREDENTIALS: Record<Role, { email: string; password: string }> = {
  CUSTOMER: { email: "customer@example.com", password: "password123" },
  STAFF: { email: "waiter@ayeyarwadygrill.com", password: "password123" },
  ADMIN: { email: "admin@ayeyarwadygrill.com", password: "password123" },
};

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function useDemoCredentials(r: Role) {
    setRole(r);
    setEmail(DEMO_CREDENTIALS[r].email);
    setPassword(DEMO_CREDENTIALS[r].password);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await login(email, password, role);
      navigate(role === "CUSTOMER" ? "/dashboard" : "/staff");
    } catch {
      setError("Invalid email or password");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-xl border border-grill-brown/10 bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl text-grill-brown">Welcome back</h1>
        <p className="mt-1 text-sm text-grill-brown/60">Sign in to Ayeyarwady Grill</p>

        <div className="mt-6 flex rounded-md border border-grill-brown/15 p-1 text-sm">
          {(["CUSTOMER", "STAFF", "ADMIN"] as Role[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className={`flex-1 rounded py-1.5 ${
                role === r ? "bg-grill-brown text-white" : "text-grill-brown/60"
              }`}
            >
              {r === "CUSTOMER" ? "Customer" : r === "STAFF" ? "Staff" : "Admin"}
            </button>
          ))}
        </div>

        <div className="mt-4 rounded-md border border-grill-brown/10 bg-grill-brown/[0.03] px-3.5 py-3 text-xs text-grill-brown/60">
          <p className="font-medium uppercase tracking-wide text-grill-brown/40">Demo login</p>
          <p className="mt-1">{DEMO_CREDENTIALS[role].email}</p>
          <p>{DEMO_CREDENTIALS[role].password}</p>
          <button
            type="button"
            onClick={() => useDemoCredentials(role)}
            className="mt-2 font-medium text-grill-orange-dark hover:underline"
          >
            Fill in these credentials
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-grill-brown/70">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-grill-brown/20 px-3 py-2 text-sm focus:border-grill-orange focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-grill-brown/70">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-grill-brown/20 px-3 py-2 text-sm focus:border-grill-orange focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-grill-orange py-2.5 text-sm font-medium text-white hover:bg-grill-orange-dark"
          >
            Sign in
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-grill-brown/60">
          New customer?{" "}
          <Link to="/register" className="text-grill-orange hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
