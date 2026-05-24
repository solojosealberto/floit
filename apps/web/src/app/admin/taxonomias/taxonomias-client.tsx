"use client";

import { useMemo, useState } from "react";
import { UIButton, UITextInput, UICard } from "@floit/ui";

export type TaxonomyRow = {
  slug: string;
  label: string;
  kind: "modality" | "amenity";
  icon: string | null;
  active: boolean;
  sortOrder: number;
  gymCount: number;
  updatedAt: string;
};

type TabId = "modality" | "amenity";

function kindLabel(k: TaxonomyRow["kind"]): string {
  return k === "modality" ? "modalidad" : "amenidad";
}

function validateSlug(raw: string): string | null {
  const s = raw.trim().toLowerCase();
  if (s.length < 2) return "El slug debe tener al menos 2 caracteres.";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) {
    return "Solo minúsculas, números y guiones. Sin tildes ni espacios.";
  }
  return null;
}

export function AdminTaxonomiasClient(props: { initialItems: TaxonomyRow[] }) {
  const [items, setItems] = useState<TaxonomyRow[]>(props.initialItems);
  const [tab, setTab] = useState<TabId>("modality");
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [slug, setSlug] = useState("");
  const [formKind, setFormKind] = useState<TabId>("modality");
  const [icon, setIcon] = useState("");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);

  const filtered = useMemo(
    () => items.filter((r) => r.kind === tab),
    [items, tab],
  );

  const counts = useMemo(() => {
    let m = 0;
    let a = 0;
    for (const r of items) {
      if (r.kind === "modality") m += 1;
      else a += 1;
    }
    return { modalities: m, amenities: a };
  }, [items]);

  async function refresh() {
    setListError(null);
    try {
      const res = await fetch("/api/admin/taxonomy-attributes", { cache: "no-store" });
      const data = (await res.json().catch(() => ({}))) as { items?: TaxonomyRow[] };
      if (res.ok) {
        setItems(data.items ?? []);
      } else {
        setListError("No se pudo actualizar la lista. Reintenta en unos segundos.");
      }
    } catch {
      setListError("No se pudo contactar al servidor.");
    }
  }

  function startCreate() {
    setEditingSlug(null);
    setLabel("");
    setSlug("");
    setFormKind(tab);
    setIcon("");
    setFormError(null);
  }

  function startEdit(row: TaxonomyRow) {
    setEditingSlug(row.slug);
    setLabel(row.label);
    setSlug(row.slug);
    setFormKind(row.kind);
    setIcon(row.icon ?? "");
    setFormError(null);
    if (typeof document !== "undefined") {
      document.getElementById("nuevo-atributo")?.scrollIntoView({ behavior: "smooth" });
    }
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const slugErr = validateSlug(editingSlug ? editingSlug : slug);
    if (!editingSlug && slugErr) {
      setFormError(slugErr);
      return;
    }
    if (!label.trim()) {
      setFormError("Indica un nombre visible.");
      return;
    }
    setLoading(true);
    try {
      if (editingSlug) {
        const res = await fetch(
          `/api/admin/taxonomy-attributes/${encodeURIComponent(editingSlug)}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: label.trim(),
              icon: icon.trim() || null,
            }),
          },
        );
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setFormError(
            typeof (data as { message?: string }).message === "string"
              ? String((data as { message: string }).message)
              : "No se pudo guardar.",
          );
          return;
        }
        const row = data as TaxonomyRow;
        setItems((prev) => prev.map((x) => (x.slug === row.slug ? row : x)));
        setEditingSlug(null);
        setLabel("");
        setSlug("");
        setIcon("");
        await refresh();
      } else {
        const res = await fetch("/api/admin/taxonomy-attributes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            slug: slug.trim().toLowerCase(),
            label: label.trim(),
            kind: formKind,
            icon: icon.trim() || undefined,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const code = (data as { message?: string | string[] })?.message;
          setFormError(
            res.status === 409
              ? "Ese slug ya existe. Elige otro."
              : Array.isArray(code)
                ? code.join(", ")
                : typeof code === "string"
                  ? code
                  : "No se pudo crear el atributo.",
          );
          return;
        }
        const row = data as TaxonomyRow;
        setItems((prev) => {
          if (prev.some((x) => x.slug === row.slug)) {
            return prev.map((x) => (x.slug === row.slug ? row : x));
          }
          return [...prev, row].sort((a, b) =>
            a.label.localeCompare(b.label, "es"),
          );
        });
        startCreate();
        await refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  async function setActive(row: TaxonomyRow, active: boolean) {
    setListError(null);
    try {
      const res = await fetch(
        `/api/admin/taxonomy-attributes/${encodeURIComponent(row.slug)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return;
      const updated = data as TaxonomyRow;
      setItems((prev) => prev.map((x) => (x.slug === updated.slug ? updated : x)));
    } catch {
      setListError("No se pudo cambiar el estado.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium text-neutral-500">Admin &gt; Taxonomías</p>
          <h1 className="mt-1 text-2xl font-semibold text-neutral-900">
            Gestión de taxonomías
          </h1>
          <p className="mt-1 text-sm text-neutral-600">
            Modalidades y amenidades usadas en búsqueda, comparación y fichas.
          </p>
        </div>
        <a href="#nuevo-atributo" className="shrink-0">
          <UIButton type="button" className="w-full sm:w-auto">
            + Nuevo atributo
          </UIButton>
        </a>
      </div>

      <div className="space-y-3">
        <div
          className="rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-950"
          role="status"
        >
          <p>
            <span className="font-medium">Inactivar</span> un atributo no borra datos
            históricos: los centros que ya lo tenían asignado siguen mostrándolo; deja de
            usarse en filtros y en altas nuevas mientras esté inactivo.
          </p>
        </div>
        <div
          className="rounded-xl border border-sky-200 bg-sky-50/90 px-4 py-3 text-sm text-sky-950"
          role="status"
        >
          <p>
            Esta taxonomía alimenta{" "}
            <span className="font-medium">
              filtros de búsqueda, chips en ficha, comparador
            </span>{" "}
            y formularios del panel partner.
          </p>
        </div>
      </div>

      {listError ? (
        <p className="text-sm text-red-600" role="alert">
          {listError}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[1fr_min(100%,360px)] lg:items-start">
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTab("modality")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                tab === "modality"
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              Modalidades ({counts.modalities})
            </button>
            <button
              type="button"
              onClick={() => setTab("amenity")}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium transition ${
                tab === "amenity"
                  ? "bg-neutral-900 text-white"
                  : "border border-neutral-200 bg-white text-neutral-800 hover:bg-neutral-50"
              }`}
            >
              Amenidades ({counts.amenities})
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white">
            <div className="grid grid-cols-[1fr_auto_auto_auto] gap-2 border-b border-neutral-100 bg-neutral-50/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-neutral-500 md:px-4">
              <span>Nombre / slug</span>
              <span className="hidden sm:block">Tipo</span>
              <span className="text-center">Gyms</span>
              <span className="text-right">Activo</span>
            </div>
            <ul className="divide-y divide-neutral-100">
              {filtered.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-neutral-500">
                  No hay atributos en esta pestaña. Crea uno o sincroniza desde datos de
                  centros (seed del catálogo).
                </li>
              ) : (
                filtered.map((row) => (
                  <li
                    key={row.slug}
                    className={`grid grid-cols-[1fr_auto] gap-x-2 gap-y-2 px-3 py-3 md:grid-cols-[1fr_auto_auto_auto] md:items-center md:px-4 ${
                      row.active ? "" : "bg-neutral-50/80"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`font-medium ${row.active ? "text-neutral-900" : "text-neutral-500"}`}
                        >
                          {row.icon ? (
                            <span className="mr-1.5 inline-block">{row.icon}</span>
                          ) : null}
                          {row.label}
                        </span>
                        {!row.active ? (
                          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700">
                            Inactivo
                          </span>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-neutral-500">{row.slug}</p>
                    </div>
                    <span className="hidden sm:block">
                      <span className="inline-flex rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-900">
                        {kindLabel(row.kind)}
                      </span>
                    </span>
                    <span className="text-sm tabular-nums text-neutral-700 md:text-center">
                      {row.gymCount}
                    </span>
                    <div className="col-span-2 flex items-center justify-end gap-2 md:col-span-1 md:col-start-4">
                      <input
                        type="checkbox"
                        aria-label={`Activo: ${row.label}`}
                        checked={row.active}
                        onChange={(e) => setActive(row, e.target.checked)}
                        className="h-5 w-5 cursor-pointer rounded border-neutral-300 accent-emerald-600"
                      />
                      <button
                        type="button"
                        className="rounded-lg p-2 text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                        title="Editar"
                        onClick={() => startEdit(row)}
                      >
                        <svg
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          aria-hidden
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <UICard id="nuevo-atributo" className="scroll-mt-24 p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-neutral-900">
              {editingSlug ? "Editar atributo" : "Nuevo atributo"}
            </h2>
            <form className="mt-4 space-y-4" onSubmit={submitForm}>
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  Nombre visible *
                </label>
                <UITextInput
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  placeholder="Ej: Natación"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  Slug (URL) *
                </label>
                <UITextInput
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm disabled:bg-neutral-100"
                  placeholder="natacion"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                  disabled={!!editingSlug}
                  autoComplete="off"
                />
                <p className="mt-1 text-xs text-neutral-500">
                  Solo minúsculas, sin tildes, sin espacios.
                </p>
              </div>
              <div>
                <span className="block text-xs font-medium text-neutral-600">Tipo</span>
                <div className="mt-2 flex rounded-xl border border-neutral-200 p-1">
                  <button
                    type="button"
                    disabled={!!editingSlug}
                    onClick={() => setFormKind("modality")}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                      formKind === "modality"
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    Modalidad
                  </button>
                  <button
                    type="button"
                    disabled={!!editingSlug}
                    onClick={() => setFormKind("amenity")}
                    className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                      formKind === "amenity"
                        ? "bg-neutral-900 text-white"
                        : "text-neutral-700 hover:bg-neutral-50"
                    }`}
                  >
                    Amenidad
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-neutral-600">
                  Ícono (opcional)
                </label>
                <UITextInput
                  className="mt-1 w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm"
                  placeholder="Ej: emoji o texto corto"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  autoComplete="off"
                />
              </div>
              {formError ? (
                <p className="text-sm text-red-600" role="alert">
                  {formError}
                </p>
              ) : null}
              <UIButton type="submit" disabled={loading} className="w-full">
                {loading
                  ? "Guardando…"
                  : editingSlug
                    ? "Guardar cambios"
                    : "Crear atributo"}
              </UIButton>
              {editingSlug ? (
                <UIButton
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={startCreate}
                >
                  Cancelar edición
                </UIButton>
              ) : null}
            </form>
          </UICard>

          <UICard className="p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-neutral-900">
              ¿Dónde se usa este atributo?
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-neutral-700">
              <li className="flex gap-2">
                <span className="text-emerald-600">✓</span> Filtros de búsqueda
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600">✓</span> Chips en ficha de gimnasio
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600">✓</span> Comparador de centros
              </li>
              <li className="flex gap-2">
                <span className="text-emerald-600">✓</span> Formulario del partner panel
              </li>
            </ul>
          </UICard>
        </aside>
      </div>
    </div>
  );
}
