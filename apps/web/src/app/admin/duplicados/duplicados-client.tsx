"use client";

import { UIBanner, UIButton, UICard } from "@floit/ui";
import Link from "next/link";
import { useMemo, useState } from "react";
const STORAGE_DUPLICATES_DISMISS = "floit-admin-duplicate-dismissed";

export type DuplicatePair = {
  a: string;
  b: string;
  reason: string;
};

export type VenueMeta = { name: string; zone: string };

type Props = {
  pairs: DuplicatePair[];
  venueBySlug: Record<string, VenueMeta>;
};

function loadDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_DUPLICATES_DISMISS);
    if (!raw) return new Set();
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return new Set();
    return new Set(data.filter((x): x is string => typeof x === "string"));
  } catch {
    return new Set();
  }
}

function pairKey(p: DuplicatePair): string {
  return [p.a, p.b].sort().join("|");
}

export function AdminDuplicadosClient(props: Props) {
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed());
  const [q, setQ] = useState("");

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return props.pairs.filter((p) => {
      if (dismissed.has(pairKey(p))) return false;
      if (!needle) return true;
      const metaA = props.venueBySlug[p.a];
      const metaB = props.venueBySlug[p.b];
      const blob = [
        p.a,
        p.b,
        p.reason,
        metaA?.name,
        metaA?.zone,
        metaB?.name,
        metaB?.zone,
      ]
        .join(" ")
        .toLowerCase();
      return blob.includes(needle);
    });
  }, [props.pairs, props.venueBySlug, dismissed, q]);

  function dismiss(p: DuplicatePair) {
    const next = new Set(dismissed);
    next.add(pairKey(p));
    setDismissed(next);
    localStorage.setItem(STORAGE_DUPLICATES_DISMISS, JSON.stringify([...next]));
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 border-b border-neutral-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500">Admin &gt; Duplicados</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-neutral-900 md:text-[26px]">
            Control de duplicados
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Candidatos detectados por similitud de nombre en la misma zona. La fusión manual
            queda en el catálogo editorial.
          </p>
        </div>
        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700">
          {visible.length} pendientes
        </span>
      </header>

      {props.pairs.length === 0 ? (
        <UIBanner variant="success">
          No hay sospechas de duplicados en este momento.
        </UIBanner>
      ) : null}

      <div className="mb-4">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por slug, nombre o zona…"
          className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none ring-neutral-900/10 focus:ring-2"
        />
      </div>

      <div className="space-y-3">
        {visible.length === 0 && props.pairs.length > 0 ? (
          <p className="text-sm text-neutral-500">
            Todos los pares visibles fueron marcados como revisados en esta sesión.
          </p>
        ) : null}
        {visible.map((p) => {
          const metaA = props.venueBySlug[p.a];
          const metaB = props.venueBySlug[p.b];
          return (
            <UICard
              key={pairKey(p)}
              className="border-neutral-200 bg-white p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-amber-800">
                    {p.reason}
                  </p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <VenueChip
                      slug={p.a}
                      name={metaA?.name ?? p.a}
                      zone={metaA?.zone ?? "—"}
                    />
                    <VenueChip
                      slug={p.b}
                      name={metaB?.name ?? p.b}
                      zone={metaB?.zone ?? "—"}
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Link href={`/admin/catalogo/${encodeURIComponent(p.a)}/panel`}>
                    <UIButton variant="secondary" size="sm" className="!rounded-xl">
                      Panel A
                    </UIButton>
                  </Link>
                  <Link href={`/admin/catalogo/${encodeURIComponent(p.b)}/panel`}>
                    <UIButton variant="secondary" size="sm" className="!rounded-xl">
                      Panel B
                    </UIButton>
                  </Link>
                  <Link href={`/gyms/${encodeURIComponent(p.a)}`} target="_blank">
                    <UIButton variant="ghost" size="sm">
                      Ver A
                    </UIButton>
                  </Link>
                  <Link href={`/gyms/${encodeURIComponent(p.b)}`} target="_blank">
                    <UIButton variant="ghost" size="sm">
                      Ver B
                    </UIButton>
                  </Link>
                  <UIButton
                    variant="ghost"
                    size="sm"
                    onClick={() => dismiss(p)}
                    className="!text-neutral-600"
                  >
                    Marcar revisado
                  </UIButton>
                </div>
              </div>
            </UICard>
          );
        })}
      </div>
    </>
  );
}

function VenueChip(props: { slug: string; name: string; zone: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
      <p className="text-sm font-semibold text-neutral-900">{props.name}</p>
      <p className="text-xs text-neutral-500">
        {props.zone} · <span className="font-mono">{props.slug}</span>
      </p>
    </div>
  );
}
