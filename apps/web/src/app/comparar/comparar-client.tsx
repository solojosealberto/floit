"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { UIEmptyState } from "@floit/ui";
import { CompareGrid, type CompareGridVenue } from "@/components/compare-grid";
import {
  addCompareSlug,
  clearCompareSlugs,
  readCompareSlugs,
  removeCompareSlug,
  writeCompareSlugs,
} from "@/lib/floit-compare";
import { CompareViewTracker } from "./compare-view-tracker";

type SearchItem = {
  slug: string;
  name: string;
  zone?: string;
  venueType?: string;
};

export function CompararClient({ initialSlugs }: { initialSlugs: string[] }) {
  const [compareSlugs, setCompareSlugs] = useState<string[]>(initialSlugs);
  const [rows, setRows] = useState<CompareGridVenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [openAddModal, setOpenAddModal] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [limitError, setLimitError] = useState(false);

  useEffect(() => {
    const merged = mergeSlugs(initialSlugs, readCompareSlugs());
    setCompareSlugs(merged);
    writeCompareSlugs(merged);
  }, [initialSlugs]);

  useEffect(() => {
    if (compareSlugs.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const res = await fetch("/api/venues/batch", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slugs: compareSlugs }),
        });
        const data = (await res.json()) as { items?: CompareGridVenue[] };
        if (cancelled) return;
        const bySlug = new Map((data.items ?? []).map((item) => [item.slug, item]));
        const ordered = compareSlugs
          .map((slug) => bySlug.get(slug))
          .filter((item): item is CompareGridVenue => Boolean(item));
        setRows(ordered);
      } catch {
        if (!cancelled) setRows([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [compareSlugs]);

  useEffect(() => {
    if (!openAddModal) return;
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpenAddModal(false);
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [openAddModal]);

  useEffect(() => {
    const qs = compareSlugs.length
      ? `/comparar?c=${encodeURIComponent(compareSlugs.join(","))}`
      : "/comparar";
    window.history.replaceState(null, "", qs);
  }, [compareSlugs]);

  useEffect(() => {
    if (!openAddModal || query.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const params = new URLSearchParams({
            q: query.trim(),
            exclude: compareSlugs.join(","),
          });
          const res = await fetch(`/api/compare/search?${params.toString()}`, {
            cache: "no-store",
          });
          const data = (await res.json()) as { items?: SearchItem[] };
          if (!cancelled) setResults(data.items ?? []);
        } catch {
          if (!cancelled) setResults([]);
        } finally {
          if (!cancelled) setSearching(false);
        }
      })();
    }, 220);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, compareSlugs, openAddModal]);

  const slugs = rows.map((row) => row.slug);
  const canAddMore = compareSlugs.length < 3;
  const buscarHref = useMemo(() => {
    const params = new URLSearchParams();
    if (compareSlugs.length > 0) params.set("fromCompare", "1");
    return `/buscar?${params.toString()}`;
  }, [compareSlugs]);

  function handleRemove(slug: string) {
    const next = removeCompareSlug(slug);
    setCompareSlugs(next);
    setLimitError(false);
  }

  function handleAdd(slug: string) {
    const res = addCompareSlug(slug);
    if (!res.ok) {
      setLimitError(true);
      return;
    }
    setLimitError(false);
    setCompareSlugs(res.slugs);
  }

  function handleClear() {
    clearCompareSlugs();
    setCompareSlugs([]);
    setLimitError(false);
  }

  return (
    <main className="mx-auto flex max-w-[1280px] flex-col gap-3 px-0 py-2 md:gap-4 md:px-4 md:py-4">
      <CompareViewTracker slugs={slugs} />
      {loading ? (
        <p className="px-3 text-sm text-quegym-secondary md:px-0">
          Cargando comparador…
        </p>
      ) : rows.length === 0 ? (
        <div className="px-3 md:px-0">
          <UIEmptyState
            title="No hay centros para comparar."
            description="Agrega centros desde Buscar o con el botón “Añadir centro”."
            action={
              <Link className="underline" href="/buscar">
                Ir a buscar
              </Link>
            }
          />
        </div>
      ) : (
        <section className="qg-surface rounded-2xl border border-quegym-border bg-quegym-elevated md:mx-0">
          <header className="border-b border-quegym-border px-2 py-2.5 md:px-5 md:py-3">
            <div className="flex items-center justify-between gap-2 md:hidden">
              <Link
                href={buscarHref}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-quegym-border text-quegym-secondary hover:bg-quegym-subtle"
                aria-label="Volver a resultados"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </Link>
              <h1 className="text-sm font-semibold tracking-tight text-quegym-primary">
                Comparador
              </h1>
              <span className="shrink-0 text-[11px] font-medium text-quegym-secondary">
                {rows.length} centro{rows.length === 1 ? "" : "s"}
              </span>
            </div>
            <div className="hidden items-center justify-between gap-3 md:flex">
              <Link
                href={buscarHref}
                className="font-medium text-quegym-secondary transition hover:text-quegym-primary"
              >
                ← Volver a resultados
              </Link>
              <h1 className="text-sm font-semibold tracking-tight text-quegym-primary">
                Comparando {rows.length} centros
              </h1>
              <button
                type="button"
                onClick={() => setOpenAddModal(true)}
                className="qg-btn-ghost rounded-full border border-quegym-border bg-quegym-elevated px-3 py-1 text-quegym-secondary"
              >
                + Añadir centro
              </button>
            </div>
          </header>

          {limitError ? (
            <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-700">
              Máximo 3 centros por comparación. Quita uno para agregar otro.
            </div>
          ) : null}

          <CompareGrid rows={rows} onRemove={handleRemove} />

          {canAddMore ? (
            <div className="border-t border-quegym-border px-3 py-3 md:px-4">
              <button
                type="button"
                onClick={() => setOpenAddModal(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-quegym-border bg-quegym-subtle px-3 py-2.5 text-xs font-medium text-quegym-primary hover:border-quegym-highlight hover:bg-quegym-highlight-soft md:hidden"
              >
                + Agregar otro gimnasio para comparar
              </button>
            </div>
          ) : null}

          <footer className="flex flex-col gap-2 border-t border-quegym-border bg-quegym-subtle px-3 py-2 text-[10px] text-quegym-secondary md:flex-row md:items-center md:justify-between md:px-4">
            <span>
              Los datos marcados como «—» corresponden a centros que aún no
              completaron su perfil. Contáctalos para confirmar.
            </span>
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 self-end rounded border border-quegym-border bg-quegym-elevated px-2 py-1 text-[10px] font-medium text-quegym-secondary hover:bg-quegym-elevated md:self-auto"
            >
              Limpiar comparación
            </button>
          </footer>
        </section>
      )}

      {openAddModal ? (
        <div className="fixed inset-0 z-[1200] flex items-end justify-center bg-quegym-ink/45 p-3 backdrop-blur-[2px] md:items-center md:p-4">
          <div className="w-full max-w-xl rounded-2xl border border-quegym-border bg-quegym-elevated shadow-[var(--qg-shadow-lg)]">
            <div className="flex items-center justify-between border-b border-quegym-border px-4 py-3">
              <h2 className="text-sm font-semibold tracking-tight text-quegym-primary">
                Añadir centro al comparador
              </h2>
              <button
                type="button"
                onClick={() => setOpenAddModal(false)}
                className="rounded-full border border-quegym-border bg-quegym-elevated px-2 py-1 text-[11px] text-quegym-secondary"
              >
                Cerrar
              </button>
            </div>
            <div className="space-y-3 p-4">
              <p className="text-[11px] text-quegym-secondary">
                Seleccionados: {compareSlugs.length}/3
              </p>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar por nombre o zona…"
                className="qg-input w-full rounded-xl border border-quegym-border bg-quegym-input px-3 py-2 text-sm text-quegym-primary outline-none"
              />
              {!canAddMore ? (
                <p className="text-xs font-medium text-amber-700">
                  Ya tienes 3 centros en comparación. Quita uno para añadir otro.
                </p>
              ) : null}
              <div className="max-h-72 space-y-2 overflow-y-auto rounded-xl border border-quegym-border bg-quegym-subtle p-2">
                {searching ? (
                  <p className="px-1 py-2 text-sm text-quegym-secondary">
                    Buscando centros…
                  </p>
                ) : results.length === 0 ? (
                  <p className="px-1 py-2 text-sm text-quegym-secondary">
                    Escribe al menos 2 caracteres para buscar centros.
                  </p>
                ) : (
                  results.map((item) => (
                    <div
                      key={item.slug}
                      className="flex items-center justify-between rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-quegym-primary">
                          {item.name}
                        </p>
                        <p className="text-[11px] text-quegym-secondary">
                          {item.zone ?? "Zona no informada"} ·{" "}
                          {item.venueType ?? "Tipo no informado"}
                        </p>
                      </div>
                      <button
                        type="button"
                        disabled={!canAddMore}
                        onClick={() => handleAdd(item.slug)}
                        className="qg-btn-primary shrink-0 rounded-lg bg-quegym-accent px-3 py-1.5 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Añadir
                      </button>
                    </div>
                  ))
                )}
              </div>
              <div className="flex items-center justify-between border-t border-quegym-border pt-3">
                <Link
                  href={buscarHref}
                  className="text-xs font-medium text-quegym-secondary underline"
                >
                  Buscar en página completa
                </Link>
                <button
                  type="button"
                  onClick={() => setOpenAddModal(false)}
                  className="rounded-lg border border-quegym-border bg-quegym-elevated px-3 py-1.5 text-xs font-medium text-quegym-primary"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function mergeSlugs(initialSlugs: string[], localSlugs: string[]): string[] {
  return [...new Set([...initialSlugs, ...localSlugs])].slice(0, 3);
}
