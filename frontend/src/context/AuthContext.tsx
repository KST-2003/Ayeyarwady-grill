import { createContext, useContext, useState, ReactNode } from "react";
import api from "../lib/api";

export type Role = "CUSTOMER" | "STAFF" | "ADMIN";

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  role: Role;
}

interface AuthContextValue {
  user: User | null;
  login: (email: string, password: string, role: Role) => Promise<void>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (fields: { name?: string; phone?: string; address?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      // Stale/corrupted value from a previous session — drop it instead
      // of crashing the whole app on load.
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      return null;
    }
  });

  function persist(nextUser: User) {
    localStorage.setItem("user", JSON.stringify(nextUser));
    setUser(nextUser);
  }

  async function login(email: string, password: string, role: Role) {
    const { data } = await api.post("/auth/login", { email, password, role });
    localStorage.setItem("token", data.token);
    persist(data.user);
  }

  async function register(name: string, email: string, password: string, phone?: string) {
    const { data } = await api.post("/auth/register", { name, email, password, phone });
    localStorage.setItem("token", data.token);
    persist(data.user);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }

  async function updateProfile(fields: { name?: string; phone?: string; address?: string }) {
    const { data } = await api.patch("/auth/me", fields);
    persist({ ...user, ...data });
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
