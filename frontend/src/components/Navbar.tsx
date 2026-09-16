import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <header className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-8 py-5 text-white">
      <Link to="/" className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-sm font-display">
          AG
        </span>
        <span className="font-display text-lg tracking-wide">Ayeyarwady Grill</span>
      </Link>

      <nav className="hidden items-center gap-8 text-sm tracking-wide md:flex">
        <a href="#menu" className="hover:text-grill-orange-light">MENU</a>
        <a href="#book" className="hover:text-grill-orange-light">BOOK</a>
        <a href="#gallery" className="hover:text-grill-orange-light">GALLERY</a>
        <a href="#contact" className="hover:text-grill-orange-light">CONTACT</a>
        {user ? (
          <Link to={dashboardPath(user.role)} className="hover:text-grill-orange-light">
            MY ACCOUNT
          </Link>
        ) : (
          <Link to="/login" className="hover:text-grill-orange-light">MY ACCOUNT</Link>
        )}
      </nav>

      {user ? (
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/80 sm:inline">Hi, {user.name.split(" ")[0]}</span>
          <button
            onClick={logout}
            className="rounded-md bg-grill-orange px-4 py-2 text-sm font-medium hover:bg-grill-orange-dark"
          >
            Log out
          </button>
        </div>
      ) : (
        <Link
          to="/book"
          className="rounded-md bg-grill-orange px-4 py-2 text-sm font-medium hover:bg-grill-orange-dark"
        >
          Book a Table
        </Link>
      )}
    </header>
  );
}

function dashboardPath(role: string) {
  if (role === "ADMIN" || role === "STAFF") return "/staff";
  return "/dashboard";
}
