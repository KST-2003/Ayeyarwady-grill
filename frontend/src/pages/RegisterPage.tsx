import { useState, FormEvent } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await register(name, email, password, phone);
      navigate("/dashboard");
    } catch {
      setError("Could not create account — that email may already be registered.");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm rounded-xl border border-grill-brown/10 bg-white p-8 shadow-sm">
        <h1 className="font-display text-2xl text-grill-brown">Create your account</h1>
        <p className="mt-1 text-sm text-grill-brown/60">Book tables and order faster next time</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="text-sm text-grill-brown/70">Full name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-grill-brown/20 px-3 py-2 text-sm focus:border-grill-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-grill-brown/70">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-grill-brown/20 px-3 py-2 text-sm focus:border-grill-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-grill-brown/70">Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="mt-1 w-full rounded-md border border-grill-brown/20 px-3 py-2 text-sm focus:border-grill-orange focus:outline-none"
            />
          </div>
          <div>
            <label className="text-sm text-grill-brown/70">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-grill-brown/20 px-3 py-2 text-sm focus:border-grill-orange focus:outline-none"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            className="w-full rounded-md bg-grill-orange py-2.5 text-sm font-medium text-white hover:bg-grill-orange-dark"
          >
            Create account
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-grill-brown/60">
          Already have an account?{" "}
          <Link to="/login" className="text-grill-orange hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
