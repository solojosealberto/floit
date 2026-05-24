"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-[1280px] items-center justify-between gap-3 px-3 py-3">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-neutral-900 text-sm text-white"
            aria-label={`Ir al inicio de ${BRAND_NAME}`}
          >
            Q
          </Link>
          <Link href="/" className="text-sm font-semibold tracking-tight text-neutral-900">
            {BRAND_NAME}
          </Link>
        </div>

        <nav className="hidden items-center gap-5 text-xs text-neutral-600 md:flex">
          <Link
            href="/buscar"
            className={pathname === "/buscar" ? "font-semibold text-neutral-900" : "hover:text-neutral-900"}
          >
            Buscar
          </Link>
          <Link
            href="/comparar"
            className={pathname === "/comparar" ? "font-semibold text-neutral-900" : "hover:text-neutral-900"}
          >
            Comparar
          </Link>
          <Link
            href="/favoritos"
            className={pathname === "/favoritos" ? "font-semibold text-neutral-900" : "hover:text-neutral-900"}
          >
            Favoritos
          </Link>
          <Link
            href="/privacidad"
            className={pathname === "/privacidad" ? "font-semibold text-neutral-900" : "hover:text-neutral-900"}
          >
            Privacidad
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <HomeFavoritesLink />
          <Link
            href="/partner/login"
            className="hidden rounded-xl border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 md:inline-flex"
          >
            ¿Eres partner?
          </Link>
        </div>
      </div>
    </header>
  );
}

