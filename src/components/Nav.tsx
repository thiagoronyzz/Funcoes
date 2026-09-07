"use client";

import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav() {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  if (loading) return null;

  if (!user) return null;

  return (
    <nav className="bg-marble border-b border-warm-border sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="font-classical text-xl text-bronze tracking-wide">
            Romanov
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href="/"
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                pathname === "/" ? "bg-parchment-dark text-ink" : "text-ink-light hover:text-ink hover:bg-parchment-dark"
              }`}
            >
              Frases
            </Link>
            <Link
              href="/records"
              className={`px-3 py-1.5 text-sm rounded transition-colors ${
                pathname === "/records" ? "bg-parchment-dark text-ink" : "text-ink-light hover:text-ink hover:bg-parchment-dark"
              }`}
            >
              Recordes
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/profile/${user.username}`}
            className="flex items-center gap-2 text-sm text-ink-light hover:text-ink transition-colors"
          >
            <span className="font-classical">{user.displayName}</span>
          </Link>
          <button
            onClick={logout}
            className="text-xs text-warm-gray hover:text-ink transition-colors"
          >
            Sair
          </button>
        </div>
      </div>
    </nav>
  );
}
