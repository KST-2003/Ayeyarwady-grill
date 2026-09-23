import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const accountPath = user ? dashboardPath(user.role) : "/login";
  const sectionLinks = [
    { href: "#menu", label: "MENU" },
    { href: "#book", label: "BOOK" },
    { href: "#gallery", label: "GALLERY" },
    { href: "#contact", label: "CONTACT" },
  ];

  return (
    <header className="absolute top-0 left-0 right-0 z-10 text-white">
      <div className="flex items-center justify-between gap-3 px-4 py-4 sm:px-8 sm:py-5">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <img src="/images/logo-icon.png" alt="Ayeyarwady Grill" className="h-9 w-9 shrink-0 rounded-full object-cover" />
          <span className="truncate font-display text-base tracking-wide sm:text-lg">Ayeyarwady Grill</span>
        </Link>

        <nav className="hidden items-center gap-8 text-sm tracking-wide md:flex">
          {sectionLinks.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-grill-orange-light">{l.label}</a>
          ))}
          <Link to={accountPath} className="hover:text-grill-orange-light">MY ACCOUNT</Link>
        </nav>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          {user ? (
            <>
              <span className="hidden text-sm text-white/80 sm:inline">Hi, {user.name.split(" ")[0]}</span>
              <button
                onClick={logout}
                className="rounded-md bg-grill-orange px-3 py-2 text-sm font-medium hover:bg-grill-orange-dark sm:px-4"
              >
                Log out
              </button>
            </>
          ) : (
            <Link
              to="/book"
              className="rounded-md bg-grill-orange px-3 py-2 text-sm font-medium hover:bg-grill-orange-dark sm:px-4"
            >
              Book a Table
            </Link>
          )}

          {/* Mobile menu toggle — the inline nav above is md+ only */}
          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="rounded-md p-2 hover:bg-white/10 md:hidden"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="mx-4 flex flex-col rounded-xl bg-grill-brown-dark/95 py-2 text-sm tracking-wide shadow-lg backdrop-blur md:hidden">
          {sectionLinks.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="px-5 py-3 hover:bg-white/10 hover:text-grill-orange-light"
            >
              {l.label}
            </a>
          ))}
          <Link
            to={accountPath}
            onClick={() => setMenuOpen(false)}
            className="px-5 py-3 hover:bg-white/10 hover:text-grill-orange-light"
          >
            MY ACCOUNT
          </Link>
        </nav>
      )}
    </header>
  );
}

function dashboardPath(role: string) {
  if (role === "ADMIN" || role === "STAFF") return "/staff";
  return "/dashboard";
}
