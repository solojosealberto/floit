import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { BRAND_ADMIN } from "@/lib/brand";

export type AdminNavId =
  | "dashboard"
  | "catalog"
  | "leads"
  | "taxonomy"
  | "metrics"
  | "claims"
  | "duplicates"
  | "moderation"
  | "settings";

type Props = {
  active: AdminNavId;
  /** Badge amarillo en Catálogo (items que requieren atención). */
  catalogBadge?: number;
  /** Badge en Leads (p. ej. recibidos). */
  leadsBadge?: number;
  /** Email mostrado en el pie (opcional). */
  userEmail?: string;
};

const NAV: {
  id: AdminNavId;
  href: string;
  label: string;
  icon: ReactNode;
}[] = [
  {
    id: "dashboard",
    href: "/admin",
    label: "Dashboard",
    icon: (
      <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
      </svg>
    ),
  },
  {
    id: "catalog",
    href: "/admin/catalogo",
    label: "Catálogo",
    icon: (
      <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4-8-4s-8 1.79-8 4m16 0v10" />
      </svg>
    ),
  },
  {
    id: "leads",
    href: "/admin/leads",
    label: "Leads",
    icon: (
      <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "taxonomy",
    href: "/admin/taxonomias",
    label: "Taxonomías",
    icon: (
      <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    ),
  },
  {
    id: "metrics",
    href: "/admin/analytics",
    label: "Métricas",
    icon: (
      <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
  },
  {
    id: "duplicates",
    href: "/admin/duplicados",
    label: "Duplicados",
    icon: (
      <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "moderation",
    href: "/admin/moderacion-media",
    label: "Moderación",
    icon: (
      <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: "claims",
    href: "/admin/partner-claims",
    label: "Solicitudes",
    icon: (
      <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    ),
  },
  {
    id: "settings",
    href: "/admin/configuracion",
    label: "Configuración",
    icon: (
      <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
];

export function AdminSidebar(props: Props) {
  return (
    <aside className="qg-surface-subtle qg-motion h-fit rounded-2xl border border-quegym-border bg-quegym-subtle p-4 text-quegym-primary">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-quegym-accent text-sm font-semibold text-white">
          Q
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-tight">{BRAND_ADMIN}</p>
          <p className="text-[11px] text-quegym-secondary">Backoffice Operativo</p>
        </div>
      </div>
      <nav className="space-y-1 text-sm">
        {NAV.map((item) => {
          const isActive = props.active === item.id;
          const badge =
            item.id === "catalog"
              ? props.catalogBadge
              : item.id === "leads"
                ? props.leadsBadge
                : undefined;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2.5 transition ${
                isActive
                  ? "bg-quegym-accent font-medium text-white"
                  : "text-quegym-primary hover:bg-quegym-elevated"
              }`}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="opacity-90">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </span>
              {badge != null && badge > 0 ? (
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                    item.id === "catalog"
                      ? "bg-amber-400 text-quegym-primary"
                      : "bg-orange-400 text-white"
                  }`}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <div className="mt-8 space-y-3 rounded-xl border border-quegym-border bg-quegym-elevated p-3 text-xs">
        <ThemeToggle className="w-full justify-center" />
        <p className="truncate text-quegym-secondary">{props.userEmail ?? "Admin"}</p>
        <p className="mt-0.5 text-quegym-secondary/80">Admin interno</p>
        <Link
          href="/admin/logout"
          className="mt-3 inline-flex items-center gap-1 text-quegym-primary underline-offset-2 hover:underline"
        >
          <span aria-hidden>⎋</span> Cerrar sesión
        </Link>
      </div>
    </aside>
  );
}
