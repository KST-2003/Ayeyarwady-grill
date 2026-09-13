import { Navigate } from "react-router-dom";
import { useAuth, Role } from "../context/AuthContext";
import { ReactNode } from "react";

export default function ProtectedRoute({
  children,
  allow,
}: {
  children: ReactNode;
  allow: Role[];
}) {
  const { user } = useAuth();

  if (!user) return <Navigate to="/login" replace />;

  // Admin inherits Staff-only pages, same rule as the backend middleware
  const effectiveRoles: Role[] = user.role === "ADMIN" ? ["ADMIN", "STAFF"] : [user.role];
  const isAllowed = allow.some((r) => effectiveRoles.includes(r));

  if (!isAllowed) return <Navigate to="/" replace />;

  return <>{children}</>;
}
