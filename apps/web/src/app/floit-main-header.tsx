"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { HeaderCompareLink } from "@/components/header-compare-link";
import { MobileNavDrawer } from "@/components/mobile-nav-drawer";
import { BRAND_NAME } from "@/lib/brand";
import { HomeFavoritesLink } from "./home-favorites-link";

function shouldShowMainHeader(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/partner")) return false;
  if (pathname.startsWith("/api")) return false;
  return true;
}

export function FloitMainHeader() {
  const pathname = usePathname();
  if (!shouldShowMainHeader(pathname)) return null;

  return (
    <header className="qg-header-bar sticky top-0 z-40 border-b border-quegym-border bg-quegym-page/95 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="qg-motion flex h-8 w-8 items-center justify-center rounded-full bg-quegym-accent text-sm font-semibold text-white shadow-[var(--qg-shadow-accent)] hover:bg-quegym-accent-hover"
            aria-label={`Ir al inicio de ${BRAND_NAME}`}
          >
            Q
          </Link>
          <Link href="/" className="text-sm font-semibold tracking-tight text-quegym-primary">
            {BRAND_NAME}
          </Link>
        </div>

        <nav className="hidden items-center gap-5 text-xs text-quegym-secondary md:flex">
          <Link
            href="/buscar"
            className={
              pathname === "/buscar"
                ? "qg-nav-link qg-motion font-semibold text-quegym-primary"
                : "qg-nav-link qg-motion hover:text-quegym-primary"
            }
          >
            Explorar gimnasios
          </Link>
          <HeaderCompareLink className="qg-nav-link qg-motion hover:text-quegym-primary border-0 px-0 py-0 font-normal hover:border-0" />
          <Link
            href="/favoritos"
            className={
              pathname === "/favoritos"
                ? "qg-nav-link qg-motion font-semibold text-quegym-primary"
                : "qg-nav-link qg-motion hover:text-quegym-primary"
            }
          >
            Favoritos
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <div className="hidden md:block">
            <HomeFavoritesLink />
          </div>
          <MobileNavDrawer />
          <Link
            href="/partner/login"
            className="qg-btn-ghost qg-motion hidden rounded-xl border border-quegym-border px-3 py-2 text-xs font-medium text-quegym-primary md:inline-flex"
          >
            ¿Eres partner?
          </Link>
          <Link
            href="/admin/login"
            className="qg-btn-ghost qg-motion hidden rounded-xl border border-quegym-border px-3 py-2 text-xs font-medium text-quegym-primary lg:inline-flex"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}
