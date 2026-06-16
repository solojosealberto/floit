"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { QueGymLogo } from "@/components/quegym-logo";
import { readCompareSlugs } from "@/lib/floit-compare";
import { readFavoriteSlugs } from "@/lib/floit-favorites";

type Props = {
  onNavigate?: () => void;
};

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
    </svg>
  );
}

export function MobileNavDrawer({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [favCount, setFavCount] = useState(0);
  const [compareCount, setCompareCount] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const pathname = usePathname();

  const refreshCounts = useCallback(() => {
    setFavCount(readFavoriteSlugs().length);
    setCompareCount(readCompareSlugs().length);
  }, []);

  useEffect(() => {
    refreshCounts();
    window.addEventListener("focus", refreshCounts);
    window.addEventListener("storage", refreshCounts);
    return () => {
      window.removeEventListener("focus", refreshCounts);
      window.removeEventListener("storage", refreshCounts);
    };
  }, [refreshCounts]);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const compareHref =
    compareCount > 0
      ? `/comparar?c=${encodeURIComponent(readCompareSlugs().join(","))}`
      : "/comparar";

  const links = [
    { href: "/buscar", label: "Explorar gimnasios" },
    { href: compareHref, label: compareCount > 0 ? `Comparar (${compareCount})` : "Comparar" },
    { href: "/favoritos", label: favCount > 0 ? `Favoritos (${favCount})` : "Favoritos" },
    { href: "/partner/login", label: "¿Eres partner?" },
    { href: "/privacidad", label: "Privacidad" },
  ];

  const drawerPanel =
    open && typeof document !== "undefined"
      ? createPortal(
          <div className="fixed inset-0 z-[1300] md:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/50"
              aria-label="Cerrar menú"
              onClick={() => setOpen(false)}
            />
            <div
              ref={panelRef}
              id={titleId}
              role="dialog"
              aria-modal="true"
              aria-labelledby={`${titleId}-title`}
              className="absolute right-0 top-0 flex h-full w-[min(88vw,320px)] flex-col border-l border-quegym-border bg-quegym-page shadow-[var(--qg-shadow-lg)]"
            >
              <div className="flex items-center justify-between border-b border-quegym-border bg-quegym-page px-4 py-3">
                <div id={`${titleId}-title`}>
                  <QueGymLogo variant="horizontal" theme="auto" size="sm" href />
                </div>
                <button
                  type="button"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-quegym-border bg-quegym-elevated text-quegym-primary hover:bg-quegym-subtle"
                  aria-label="Cerrar menú"
                  onClick={() => setOpen(false)}
                >
                  <CloseIcon />
                </button>
              </div>
              <nav className="flex flex-1 flex-col gap-1 overflow-y-auto bg-quegym-page p-3">
                {links.map((item) => (
                  <Link
                    key={item.href + item.label}
                    href={item.href}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    className={`rounded-xl px-3 py-3 text-sm ${
                      pathname === item.href.split("?")[0]
                        ? "bg-quegym-highlight-soft font-semibold text-quegym-highlight"
                        : "bg-quegym-elevated text-quegym-primary hover:bg-quegym-subtle"
                    }`}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        type="button"
        className="qg-motion inline-flex h-9 w-9 items-center justify-center rounded-xl border border-quegym-border text-quegym-primary hover:bg-quegym-subtle md:hidden"
        aria-expanded={open}
        aria-controls={titleId}
        aria-label="Abrir menú de navegación"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </button>

      {drawerPanel}
    </>
  );
}
