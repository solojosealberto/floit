"use client";

import {
  UIBanner,
  UIButton,
  UICard,
  UITextInput,
} from "@floit/ui";
import Link from "next/link";
import { BRAND_ADMIN, BRAND_NAME, BRAND_PARTNERS } from "@/lib/brand";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatUpstreamError } from "@/lib/format-upstream-error";

type Profile = {
  partnerEmail: string;
  businessName: string | null;
  description: string | null;
  scheduleSummary: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactWhatsapp: string | null;
};

type Plan = {
  id: string;
  venueSlug: string;
  name: string;
  description: string | null;
  period: string | null;
  priceLabel: string | null;
  active: boolean;
};

type VenuePhoto = {
  id: string;
  venueSlug: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  sortOrder: number;
  createdAt: string;
};

type PartnerLead = {
  id: string;
  venueSlug: string;
  intent: string;
  name: string;
  phone: string;
  email: string | null;
  status: string;
  createdAt: string;
};

type ProfileFormState = {
  businessName: string;
  description: string;
  scheduleSummary: string;
  contactPhone: string;
  contactEmail: string;
  contactWhatsapp: string;
};

type PanelSection = "dashboard" | "perfil" | "fotos" | "planes" | "leads" | "config";
type LeadFilter = "all" | "received" | "contacted" | "closed";
type ConfigView = "account" | "gyms" | "notifications" | "billing" | "privacy" | "help";

const EMPTY_PROFILE: Profile = {
  partnerEmail: "",
  businessName: null,
  description: null,
  scheduleSummary: null,
  contactPhone: null,
  contactEmail: null,
  contactWhatsapp: null,
};

const EMPTY_PROFILE_FORM: ProfileFormState = {
  businessName: "",
  description: "",
  scheduleSummary: "",
  contactPhone: "",
  contactEmail: "",
  contactWhatsapp: "",
};

export type PartnerPanelVariant = "partner" | "admin";

export function PartnerPanelClient(props: {
  variant?: PartnerPanelVariant;
  /** Admin route: fixed slug from `/admin/catalogo/[slug]/panel` */
  fixedVenueSlug?: string;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const variant = props.variant ?? "partner";
  const fixedVenueSlug = props.fixedVenueSlug?.trim() ?? "";

  function venueApi(slug: string, subpath: string): string {
    const enc = encodeURIComponent(slug);
    const root =
      variant === "admin"
        ? `/api/admin/catalog/venues/${enc}`
        : `/api/partner/me/venues/${enc}`;
    return `${root}${subpath}`;
  }

  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [profileForm, setProfileForm] = useState<ProfileFormState>(EMPTY_PROFILE_FORM);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [leads, setLeads] = useState<PartnerLead[]>([]);
  const [photosVenueSlug, setPhotosVenueSlug] = useState("");
  const [photos, setPhotos] = useState<VenuePhoto[]>([]);
  const [photosLoading, setPhotosLoading] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [deletingPhotoId, setDeletingPhotoId] = useState<string | null>(null);
  const [movingPhotoId, setMovingPhotoId] = useState<string | null>(null);
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null);
  const [reorderingPhotos, setReorderingPhotos] = useState(false);
  const [settingCoverPhotoId, setSettingCoverPhotoId] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [venueSlugDraft, setVenueSlugDraft] = useState("");
  const [activeSection, setActiveSection] = useState<PanelSection>("dashboard");
  const [leadFilter, setLeadFilter] = useState<LeadFilter>("all");
  const [showPlanForm, setShowPlanForm] = useState(true);
  const [configView, setConfigView] = useState<ConfigView>("account");
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const ogPreviewTitle =
    profile.businessName?.trim() || photosVenueSlug.trim() || `Centro en ${BRAND_NAME}`;
  const ogPreviewDescription =
    profile.description?.trim() ||
    `Descubre este centro en ${BRAND_NAME} y solicita información directamente.`;
  const ogPreviewImage = photos[0]?.url ?? null;
  const ogPreviewPath = photosVenueSlug.trim() ? `/gyms/${encodeURIComponent(photosVenueSlug.trim())}` : "/gyms/[slug]";

  function redirectToLogin() {
    router.replace(variant === "admin" ? "/admin/login" : "/partner/login");
  }

  function isAuthFailureError(errorLike: unknown): boolean {
    const text = String(errorLike ?? "").toLowerCase();
    return (
      text.includes("partner_not_configured") ||
      text.includes("partner_oidc_required") ||
      text.includes("missing_partner_token") ||
      text.includes("invalid_partner_token") ||
      text.includes("admin_not_configured") ||
      text.includes("http 401") ||
      text.includes("401")
    );
  }

  async function onCopyGymLink() {
    if (!photosVenueSlug.trim()) return;
    const href = `${window.location.origin}/gyms/${encodeURIComponent(photosVenueSlug.trim())}`;
    try {
      await navigator.clipboard.writeText(href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 1400);
    } catch {
      setErr("No se pudo copiar el enlace de la ficha.");
    }
  }

  async function reload(venueSlug: string) {
    setLoading(true);
    setErr(null);
    try {
      const [pRes, plansRes, leadsRes] = await Promise.all([
        fetch(venueApi(venueSlug, "/profile"), {
          cache: "no-store",
        }),
        fetch(venueApi(venueSlug, "/plans"), {
          cache: "no-store",
        }),
        fetch(venueApi(venueSlug, "/leads?limit=24"), {
          cache: "no-store",
        }),
      ]);
      if (!pRes.ok) {
        const body = await pRes.json().catch(() => ({}));
        if (pRes.status === 401 || pRes.status === 503 || isAuthFailureError((body as { error?: string }).error)) {
          redirectToLogin();
          return;
        }
        if (pRes.status === 422) {
          throw new Error(
            (body as { message?: string }).message?.includes("venue_delegate")
              ? "Este centro no tiene titular en partner. Configura ADMIN_CATALOG_DELEGATE_EMAIL en el servicio partner o aprueba un claim primero."
              : formatUpstreamError(body, `HTTP ${pRes.status}`),
          );
        }
        throw new Error(formatUpstreamError(body, `HTTP ${pRes.status}`));
      }
      const p = (await pRes.json()) as Profile;
      setProfile(p);
      setProfileForm({
        businessName: p.businessName ?? "",
        description: p.description ?? "",
        scheduleSummary: p.scheduleSummary ?? "",
        contactPhone: p.contactPhone ?? "",
        contactEmail: p.contactEmail ?? "",
        contactWhatsapp: p.contactWhatsapp ?? "",
      });
      if (plansRes.ok) {
        const payload = (await plansRes.json()) as { items?: Plan[] };
        setPlans(payload.items ?? []);
      } else {
        setPlans([]);
      }
      if (leadsRes.ok) {
        const payload = (await leadsRes.json()) as { items?: PartnerLead[] };
        setLeads(payload.items ?? []);
      } else {
        setLeads([]);
      }
    } catch (e) {
      if (isAuthFailureError(e instanceof Error ? e.message : e)) {
        redirectToLogin();
        return;
      }
      setErr(e instanceof Error ? e.message : "No se pudo cargar el panel.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const initialSlug =
      variant === "admin" ? fixedVenueSlug : (search.get("venueSlug")?.trim() ?? "");
    const section = search.get("section")?.trim() ?? "";
    const configViewFromQuery = parseConfigView(search.get("configView"));
    if (section === "perfil") setActiveSection("perfil");
    if (section === "fotos") setActiveSection("fotos");
    if (section === "planes") setActiveSection("planes");
    if (section === "leads") setActiveSection("leads");
    if (section === "config" && variant === "partner") setActiveSection("config");
    if (configViewFromQuery && variant === "partner") setConfigView(configViewFromQuery);
    if (!initialSlug) {
      if (variant === "admin") {
        setLoading(false);
        setErr("Centro no especificado.");
        return;
      }
      router.replace("/partner/venues");
      return;
    }
    setPhotosVenueSlug(initialSlug);
    setVenueSlugDraft(initialSlug);
    void reload(initialSlug);
    void loadPhotos(initialSlug);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount + query slug; reload/loadPhotos estables por venue
  }, [router, search, variant, fixedVenueSlug]);

  function openConfigView(next: ConfigView) {
    if (variant === "admin") return;
    setConfigView(next);
    const params = new URLSearchParams(search.toString());
    params.set("section", "config");
    params.set("configView", next);
    if (photosVenueSlug.trim()) {
      params.set("venueSlug", photosVenueSlug.trim());
    }
    router.replace(`/partner/panel?${params.toString()}`);
  }

  async function applyVenueSlugSelection() {
    if (variant === "admin") return;
    const nextSlug = venueSlugDraft.trim();
    if (!nextSlug) {
      setErr("Ingresa un venue slug válido.");
      return;
    }
    setPhotosVenueSlug(nextSlug);
    setMsg(null);
    setErr(null);
    await Promise.all([reload(nextSlug), loadPhotos(nextSlug)]);
  }

  async function onSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const venueSlug = photosVenueSlug.trim();
    if (!venueSlug) return;
    setSavingProfile(true);
    setErr(null);
    setMsg(null);
    const payload = {
      businessName: profileForm.businessName.trim() || undefined,
      description: profileForm.description.trim() || undefined,
      scheduleSummary: profileForm.scheduleSummary.trim() || undefined,
      contactPhone: profileForm.contactPhone.trim() || undefined,
      contactEmail: profileForm.contactEmail.trim() || undefined,
      contactWhatsapp: profileForm.contactWhatsapp.trim() || undefined,
    };
    try {
      const res = await fetch(venueApi(venueSlug, "/profile"), {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo guardar perfil."));
        return;
      }
      const updated = body as Profile;
      setProfile(updated);
      setProfileForm({
        businessName: updated.businessName ?? "",
        description: updated.description ?? "",
        scheduleSummary: updated.scheduleSummary ?? "",
        contactPhone: updated.contactPhone ?? "",
        contactEmail: updated.contactEmail ?? "",
        contactWhatsapp: updated.contactWhatsapp ?? "",
      });
      setMsg("Perfil guardado.");
    } catch {
      setErr("Error de red al guardar perfil.");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onCreatePlan(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const venueSlug = photosVenueSlug.trim();
    if (!venueSlug) return;
    setSavingPlan(true);
    setErr(null);
    setMsg(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      venueSlug: String(fd.get("venueSlug") ?? "").trim(),
      name: String(fd.get("name") ?? "").trim(),
      description: String(fd.get("description") ?? "").trim() || undefined,
      period: String(fd.get("period") ?? "").trim() || undefined,
      priceLabel: String(fd.get("priceLabel") ?? "").trim() || undefined,
    };
    try {
      const res = await fetch(venueApi(venueSlug, "/plans"), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo crear el plan."));
        return;
      }
      e.currentTarget.reset();
      setMsg("Plan creado.");
      await reload(venueSlug);
    } catch {
      setErr("Error de red al crear plan.");
    } finally {
      setSavingPlan(false);
    }
  }

  async function togglePlan(plan: Plan) {
    setErr(null);
    setMsg(null);
    try {
      const res = await fetch(
        venueApi(plan.venueSlug, `/plans/${encodeURIComponent(plan.id)}`),
        {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ active: !plan.active }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo actualizar plan."));
        return;
      }
      setPlans((prev) =>
        prev.map((p) => (p.id === plan.id ? { ...p, active: !plan.active } : p)),
      );
      setMsg("Plan actualizado.");
    } catch {
      setErr("Error de red al actualizar plan.");
    }
  }

  async function updateLeadStatus(lead: PartnerLead, status: "contacted" | "closed") {
    setErr(null);
    setMsg(null);
    setUpdatingLeadId(lead.id);
    try {
      const res = await fetch(
        venueApi(lead.venueSlug, `/leads/${encodeURIComponent(lead.id)}/status`),
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo actualizar el estado del lead."));
        return;
      }
      setLeads((prev) => prev.map((it) => (it.id === lead.id ? { ...it, status } : it)));
      setMsg(`Lead marcado como ${status === "contacted" ? "atendido" : "cerrado"}.`);
    } catch {
      setErr("Error de red al actualizar estado de lead.");
    } finally {
      setUpdatingLeadId(null);
    }
  }

  async function loadPhotos(venueSlug: string) {
    if (!venueSlug.trim()) {
      setPhotos([]);
      return;
    }
    setPhotosLoading(true);
    setErr(null);
    try {
      const res = await fetch(venueApi(venueSlug.trim(), "/photos"), { cache: "no-store" });
      const body = (await res.json().catch(() => ({}))) as {
        items?: VenuePhoto[];
        message?: string;
      };
      if (!res.ok) {
        if (res.status === 401 || res.status === 503 || isAuthFailureError(body.message)) {
          redirectToLogin();
          return;
        }
        setErr(formatUpstreamError(body, "No se pudieron cargar las fotos del centro."));
        setPhotos([]);
        return;
      }
      setPhotos(body.items ?? []);
    } catch {
      setErr("Error de red al cargar fotos.");
      setPhotos([]);
    } finally {
      setPhotosLoading(false);
    }
  }

  async function onUploadPhoto(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    const venueSlug = photosVenueSlug.trim();
    if (!venueSlug) {
      setErr("Indica el slug del centro para subir fotos.");
      return;
    }
    const fd = new FormData(e.currentTarget);
    const file = fd.get("photo");
    if (!(file instanceof File) || !file.size) {
      setErr("Selecciona una imagen para subir.");
      return;
    }
    const payload = new FormData();
    payload.append("file", file);
    setUploadingPhoto(true);
    try {
      const res = await fetch(venueApi(venueSlug, "/photos"), {
        method: "POST",
        body: payload,
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo subir la foto."));
        return;
      }
      e.currentTarget.reset();
      setMsg("Foto subida y sincronizada con catálogo.");
      await loadPhotos(venueSlug);
    } catch {
      setErr("Error de red al subir foto.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onDeletePhoto(photo: VenuePhoto) {
    setErr(null);
    setMsg(null);
    setDeletingPhotoId(photo.id);
    try {
      const res = await fetch(
        venueApi(photo.venueSlug, `/photos/${encodeURIComponent(photo.id)}`),
        { method: "DELETE" },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo eliminar la foto."));
        return;
      }
      setMsg("Foto eliminada y sincronizada con catálogo.");
      setPhotos((prev) => prev.filter((p) => p.id !== photo.id));
    } catch {
      setErr("Error de red al eliminar foto.");
    } finally {
      setDeletingPhotoId(null);
    }
  }

  async function onMovePhoto(photo: VenuePhoto, direction: "up" | "down") {
    setErr(null);
    setMsg(null);
    setMovingPhotoId(photo.id);
    try {
      const res = await fetch(
        venueApi(photo.venueSlug, `/photos/${encodeURIComponent(photo.id)}/order`),
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ direction }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo reordenar la foto."));
        return;
      }
      await loadPhotos(photo.venueSlug);
    } catch {
      setErr("Error de red al reordenar foto.");
    } finally {
      setMovingPhotoId(null);
    }
  }

  async function persistPhotoOrder(venueSlug: string, orderedPhotoIds: string[]) {
    setReorderingPhotos(true);
    try {
      const res = await fetch(
        venueApi(venueSlug, "/photos/reorder"),
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ photoIds: orderedPhotoIds }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo guardar el nuevo orden de fotos."));
        await loadPhotos(venueSlug);
      }
    } catch {
      setErr("Error de red al guardar el nuevo orden de fotos.");
      await loadPhotos(venueSlug);
    } finally {
      setReorderingPhotos(false);
    }
  }

  async function onDropPhoto(targetPhoto: VenuePhoto) {
    if (!draggingPhotoId || draggingPhotoId === targetPhoto.id) return;
    const current = [...photos];
    const from = current.findIndex((p) => p.id === draggingPhotoId);
    const to = current.findIndex((p) => p.id === targetPhoto.id);
    if (from < 0 || to < 0 || from === to) return;
    const [moved] = current.splice(from, 1);
    if (!moved) return;
    current.splice(to, 0, moved);
    setPhotos(current);
    setDraggingPhotoId(null);
    await persistPhotoOrder(targetPhoto.venueSlug, current.map((p) => p.id));
  }

  async function onSetCoverPhoto(photo: VenuePhoto) {
    setErr(null);
    setMsg(null);
    setSettingCoverPhotoId(photo.id);
    try {
      const res = await fetch(
        venueApi(photo.venueSlug, `/photos/${encodeURIComponent(photo.id)}/cover`),
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ cover: true }),
        },
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setErr(formatUpstreamError(body, "No se pudo asignar la portada."));
        return;
      }
      setMsg("Portada actualizada.");
      await loadPhotos(photo.venueSlug);
    } catch {
      setErr("Error de red al actualizar portada.");
    } finally {
      setSettingCoverPhotoId(null);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-10 text-sm">
        {variant === "admin" ? "Cargando panel de catálogo…" : "Cargando panel partner…"}
      </main>
    );
  }

  const now = Date.now();
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const monthMs = 30 * 24 * 60 * 60 * 1000;
  const leadsWeek = leads.filter((it) => now - new Date(it.createdAt).getTime() <= weekMs).length;
  const leadsMonth = leads.filter((it) => now - new Date(it.createdAt).getTime() <= monthMs).length;
  const activePlans = plans.filter((plan) => plan.active).length;
  const profileChecklist = [
    Boolean(profile.businessName?.trim() && profile.description?.trim()),
    Boolean(profile.scheduleSummary?.trim()),
    photos.length >= 3,
    activePlans > 0,
    Boolean(profile.contactPhone?.trim() || profile.contactWhatsapp?.trim() || profile.contactEmail?.trim()),
    Boolean(photosVenueSlug.trim()),
  ];
  const completedChecklist = profileChecklist.filter(Boolean).length;
  const completionPct = Math.round((completedChecklist / profileChecklist.length) * 100);
  const recentLeads = [...leads]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  const leadsOrdered = [...leads].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const leadsFiltered = leadsOrdered.filter((lead) =>
    leadFilter === "all" ? true : lead.status === leadFilter,
  );
  const leadsReceivedCount = leads.filter((it) => it.status === "received").length;
  const leadsContactedCount = leads.filter((it) => it.status === "contacted").length;
  const lightCardClass = "!border-quegym-border !bg-quegym-elevated !text-quegym-primary";
  const lightInputClass =
    "!border-quegym-border !bg-quegym-elevated !text-quegym-primary placeholder:!text-quegym-secondary";
  const lightSecondaryButtonClass =
    "!border-quegym-border !bg-quegym-elevated !text-quegym-primary hover:!bg-quegym-subtle";
  const lightPrimaryButtonClass = "!bg-quegym-accent !text-white hover:!bg-quegym-accent-hover";
  const menuButtonClass = (section: PanelSection) =>
    [
      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition",
      activeSection === section
        ? "bg-quegym-accent font-medium text-white"
        : "text-quegym-primary hover:bg-quegym-subtle",
    ].join(" ");

  return (
    <main className="mx-auto max-w-[1240px] px-2 py-3 sm:px-3 sm:py-4">
      <div className="qg-surface qg-motion overflow-hidden rounded-[22px] border border-quegym-border bg-quegym-elevated">
        <div className="grid min-h-[calc(100vh-3.5rem)] md:grid-cols-[236px_1fr]">
          <aside className="border-r border-quegym-border bg-quegym-subtle p-3">
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-quegym-accent text-xs font-semibold text-white">
                Q
              </div>
              <div>
                <p className="text-sm font-semibold text-quegym-primary">
                  {variant === "admin" ? BRAND_ADMIN : BRAND_PARTNERS}
                </p>
                <p className="text-[11px] text-quegym-secondary">
                  {variant === "admin"
                    ? "Catálogo · operación"
                    : profile.partnerEmail || "Cuenta partner"}
                </p>
              </div>
            </div>
            <UICard className="mb-4 p-2.5">
              <p className="truncate text-sm font-semibold text-quegym-primary">{profile.businessName || "Centro partner"}</p>
              <p className="text-[11px] text-quegym-secondary">{photosVenueSlug || "Sin venue"}</p>
            </UICard>
            <UIButton
              type="button"
              variant="secondary"
              fullWidth
              className={`${lightSecondaryButtonClass} mb-4 w-full justify-center !rounded-xl !text-sm font-medium`}
              onClick={() =>
                router.push(
                  variant === "admin"
                    ? "/admin/catalogo"
                    : photosVenueSlug.trim()
                      ? `/partner/venues?venueSlug=${encodeURIComponent(photosVenueSlug.trim())}`
                      : "/partner/venues",
                )
              }
            >
              {variant === "admin" ? "← Catálogo admin" : "← Mis centros"}
            </UIButton>
            <nav className="space-y-1.5 text-sm">
              <button type="button" className={menuButtonClass("dashboard")} onClick={() => setActiveSection("dashboard")}>
                <span className="inline-flex items-center gap-2"><span>◫</span>Dashboard</span>
              </button>
              <button type="button" className={menuButtonClass("perfil")} onClick={() => setActiveSection("perfil")}>
                <span className="inline-flex items-center gap-2"><span>◌</span>Editar perfil</span>
              </button>
              <button type="button" className={menuButtonClass("fotos")} onClick={() => setActiveSection("fotos")}>
                <span className="inline-flex items-center gap-2"><span>▣</span>Galería de fotos</span>
              </button>
              <button type="button" className={menuButtonClass("planes")} onClick={() => setActiveSection("planes")}>
                <span className="inline-flex items-center gap-2"><span>◇</span>Planes y precios</span>
              </button>
              <button type="button" className={menuButtonClass("leads")} onClick={() => setActiveSection("leads")}>
                <span className="inline-flex items-center gap-2"><span>◔</span>Leads recibidos</span>
                {leadsReceivedCount > 0 ? (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-semibold text-white">
                    {leadsReceivedCount}
                  </span>
                ) : null}
              </button>
              {variant === "partner" ? (
                <button type="button" className={menuButtonClass("config")} onClick={() => setActiveSection("config")}>
                  <span className="inline-flex items-center gap-2"><span>⚙</span>Configuración</span>
                </button>
              ) : null}
            </nav>
          </aside>

          <section className="bg-quegym-page p-4 sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h1 className="text-[34px] font-semibold tracking-tight text-quegym-primary">
                  Bienvenido, {profile.businessName || (variant === "admin" ? "Operador" : "Partner")}
                </h1>
                <p className="text-sm text-quegym-secondary">
                  {activeSection === "dashboard"
                    ? "Panel de control"
                    : activeSection === "perfil"
                      ? "Editar perfil del centro"
                      : activeSection === "fotos"
                        ? "Galería de fotos"
                        : activeSection === "planes"
                          ? "Planes y precios referenciales"
                          : activeSection === "leads"
                            ? "Leads recibidos"
                            : "Configuración del centro"}{" "}
                  · {photosVenueSlug || "Sin centro activo"}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link href={`/gyms/${encodeURIComponent(photosVenueSlug || "oxide-chacao")}`}>
                  <UIButton variant="secondary" size="sm" className="!rounded-full !border-quegym-border !bg-quegym-elevated !px-4 !text-quegym-primary">Ver mi ficha pública</UIButton>
                </Link>
                <UIButton size="sm" onClick={() => setActiveSection("perfil")} className="!rounded-full !px-5">Editar perfil</UIButton>
              </div>
            </div>

            {msg ? <UIBanner variant="success">{msg}</UIBanner> : null}
            {err ? <UIBanner variant="error">{err}</UIBanner> : null}

            {activeSection === "dashboard" ? (
            <UICard className="mb-4 border-amber-200 bg-amber-50/60">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-amber-900">Tu perfil está al {completionPct}% de completitud</p>
                  <p className="text-xs text-amber-800">Completa para aparecer mejor posicionado: <button type="button" onClick={() => setActiveSection("perfil")} className="underline underline-offset-2">Agregar fotos</button> · <button type="button" onClick={() => setActiveSection("perfil")} className="underline underline-offset-2">Horarios del fin de semana</button></p>
                </div>
                <div className="flex min-w-[180px] items-center gap-2">
                  <div className="h-2 flex-1 rounded-full bg-amber-100">
                    <div className="h-2 rounded-full bg-amber-500" style={{ width: `${completionPct}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-amber-900">{completionPct}%</span>
                </div>
              </div>
            </UICard>
            ) : null}

            {activeSection === "dashboard" ? (
            <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <UICard className="p-4"><p className="text-xs text-quegym-secondary">Leads esta semana</p><p className="mt-1 text-3xl font-semibold text-quegym-primary">{leadsWeek}</p><p className="text-xs text-quegym-highlight">↑ +3 vs sem. ant.</p></UICard>
              <UICard className="p-4"><p className="text-xs text-quegym-secondary">Leads este mes</p><p className="mt-1 text-3xl font-semibold text-quegym-primary">{leadsMonth}</p><p className="text-xs text-quegym-highlight">↑ +8 vs mes ant.</p></UICard>
              <UICard className="p-4"><p className="text-xs text-quegym-secondary">Vistas del perfil</p><p className="mt-1 text-3xl font-semibold text-quegym-primary">{Math.max(142, leads.length * 12)}</p><p className="text-xs text-quegym-secondary">últimos 7 días</p></UICard>
              <UICard className="p-4"><p className="text-xs text-quegym-secondary">Planes activos</p><p className="mt-1 text-3xl font-semibold text-quegym-primary">{activePlans}</p><p className="text-xs text-quegym-secondary">{Math.max(0, plans.length - activePlans)} oculto</p></UICard>
            </div>
            ) : null}

            {activeSection === "dashboard" ? (
            <div className="mb-6 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
              <UICard className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-base font-semibold text-quegym-primary">Leads recientes</h2>
                  <Link
                    href={
                      variant === "admin"
                        ? "/admin/leads"
                        : `/partner/leads?venueSlug=${encodeURIComponent(photosVenueSlug || search.get("venueSlug") || "")}`
                    }
                  >
                    <UIButton variant="ghost" size="sm">Ver todos</UIButton>
                  </Link>
                </div>
                <div className="space-y-2">
                  {recentLeads.length === 0 ? (
                    <p className="text-sm text-quegym-secondary">Aún no tienes leads recientes para este centro.</p>
                  ) : (
                    recentLeads.map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between rounded-2xl border border-quegym-border bg-quegym-elevated px-3 py-2.5">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-quegym-subtle text-xs font-semibold text-quegym-secondary">
                            {lead.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-quegym-primary">{lead.name}</p>
                            <p className="truncate text-xs text-quegym-secondary">{lead.phone} · {lead.intent}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-right">
                          <div>
                            <p className="text-xs font-medium text-quegym-highlight">{lead.status}</p>
                            <p className="text-xs text-quegym-secondary">{formatLeadDate(lead.createdAt)}</p>
                          </div>
                          <UIButton size="sm" variant="secondary" className="!h-8 !rounded-xl !border-quegym-border !bg-quegym-elevated !px-3 !text-xs">
                            Ver →
                          </UIButton>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </UICard>

              <UICard className="p-4">
                <h2 className="mb-3 text-base font-semibold text-quegym-primary">Estado del perfil</h2>
                <ul className="space-y-2 text-sm">
                  <li className={statusLine(profileChecklist[0])}>Info básica</li>
                  <li className={statusLine(profileChecklist[1])}>Horarios completos</li>
                  <li className={statusLine(profileChecklist[2])}>Fotos (mín. 3)</li>
                  <li className={statusLine(profileChecklist[3])}>Planes y precios</li>
                  <li className={statusLine(profileChecklist[4])}>Contactos configurados</li>
                  <li className={statusLine(profileChecklist[5])}>Centro seleccionado</li>
                </ul>
              </UICard>
            </div>
            ) : null}

      {activeSection === "perfil" || activeSection === "fotos" ? (
      <div className="space-y-4">
        <div className={`grid gap-4 ${activeSection === "fotos" ? "xl:grid-cols-[1.7fr_0.9fr]" : activeSection === "perfil" ? "xl:grid-cols-[1.7fr_0.9fr]" : ""}`}>
          <div className="space-y-4">
            <UICard className={`bg-quegym-subtle ${lightCardClass}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base font-semibold">Galería de fotos</h2>
                <span className="text-xs text-quegym-secondary">
                  Centro: {photosVenueSlug || "sin seleccionar"}
                  {photosLoading ? " · cargando…" : ` · ${photos.length} foto(s)`}
                </span>
              </div>
              {photosLoading ? (
                <p className="text-sm text-quegym-secondary">Cargando fotos del centro…</p>
              ) : photos.length === 0 ? (
                <p className="rounded-xl border border-dashed border-quegym-border px-4 py-8 text-center text-sm text-quegym-secondary">
                  Aún no hay fotos. Usa el formulario de abajo para subir la primera.
                </p>
              ) : (
                <ul className="space-y-2">
                  {photos.map((photo, idx) => (
                    <li
                      key={photo.id}
                      draggable
                      onDragStart={() => setDraggingPhotoId(photo.id)}
                      onDragEnd={() => setDraggingPhotoId(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={() => void onDropPhoto(photo)}
                      className={`flex flex-wrap items-center gap-3 rounded-xl border border-quegym-border bg-quegym-elevated p-2 ${
                        draggingPhotoId === photo.id ? "opacity-60" : ""
                      } ${reorderingPhotos ? "pointer-events-none opacity-70" : ""}`}
                    >
                      <div className="h-16 w-24 shrink-0 overflow-hidden rounded-lg border border-quegym-border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={photo.url}
                          alt={`Foto ${idx + 1}`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <div className="min-w-0 flex-1 text-xs text-quegym-secondary">
                        <p className="font-medium text-quegym-primary">
                          {idx === 0 ? "Portada" : `Foto ${idx + 1}`}
                        </p>
                        <p className="truncate">{photo.mimeType} · {Math.round(photo.sizeBytes / 1024)} KB</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1">
                        <UIButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          className={lightSecondaryButtonClass}
                          disabled={idx === 0 || settingCoverPhotoId === photo.id}
                          onClick={() => void onSetCoverPhoto(photo)}
                        >
                          {settingCoverPhotoId === photo.id ? "…" : "Portada"}
                        </UIButton>
                        <UIButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          className={lightSecondaryButtonClass}
                          disabled={idx === 0 || movingPhotoId === photo.id}
                          onClick={() => void onMovePhoto(photo, "up")}
                        >
                          ↑
                        </UIButton>
                        <UIButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          className={lightSecondaryButtonClass}
                          disabled={idx === photos.length - 1 || movingPhotoId === photo.id}
                          onClick={() => void onMovePhoto(photo, "down")}
                        >
                          ↓
                        </UIButton>
                        <UIButton
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="!border-rose-200 !text-rose-700 hover:!bg-rose-50"
                          disabled={deletingPhotoId === photo.id}
                          onClick={() => void onDeletePhoto(photo)}
                        >
                          {deletingPhotoId === photo.id ? "…" : "Eliminar"}
                        </UIButton>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <form
                id="partner-photo-upload"
                className="mt-3 flex flex-wrap items-center gap-2"
                onSubmit={onUploadPhoto}
              >
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2 text-xs text-quegym-primary hover:bg-quegym-subtle">
                  Seleccionar imagen
                  <input
                    type="file"
                    name="photo"
                    accept="image/jpeg,image/png,image/webp"
                    className="sr-only"
                  />
                </label>
                <UIButton type="submit" disabled={uploadingPhoto || !photosVenueSlug.trim()} className={lightPrimaryButtonClass}>
                  {uploadingPhoto ? "Subiendo…" : "Subir foto"}
                </UIButton>
                <span className="text-xs text-quegym-secondary">JPG/PNG/WEBP, hasta 5MB</span>
              </form>
            </UICard>

            {activeSection === "perfil" ? (
            <>
            <UICard className={`bg-quegym-subtle ${lightCardClass}`}>
              <h2 className="mb-3 text-base font-semibold">Información básica</h2>
              {variant === "partner" ? (
                <div className="mb-4 grid gap-3 rounded-xl border border-quegym-border bg-quegym-elevated p-3 md:grid-cols-[1fr_auto]">
                  <UITextInput
                    value={venueSlugDraft}
                    onChange={(e) => setVenueSlugDraft(e.target.value)}
                    placeholder="Venue slug (ej: oxide-chacao)"
                    className={lightInputClass}
                  />
                  <UIButton
                    type="button"
                    variant="secondary"
                    className={lightSecondaryButtonClass}
                    onClick={() => void applyVenueSlugSelection()}
                    disabled={!venueSlugDraft.trim() || loading}
                  >
                    {loading ? "Cargando..." : "Cargar centro"}
                  </UIButton>
                </div>
              ) : null}
              <form id="partner-profile-form" className="grid gap-3 text-sm" onSubmit={onSaveProfile}>
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-quegym-secondary">Nombre comercial *</span>
                    <UITextInput
                      name="businessName"
                      value={profileForm.businessName}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, businessName: e.target.value }))}
                      placeholder="Nombre comercial"
                      className={`h-[46px] rounded-xl ${lightInputClass}`}
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-xs font-medium text-quegym-secondary">Tipo de centro</span>
                    <UITextInput
                      name="scheduleSummary"
                      value={profileForm.scheduleSummary}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, scheduleSummary: e.target.value }))}
                      placeholder="Gym clásico + funcional"
                      className={`h-[46px] rounded-xl ${lightInputClass}`}
                    />
                  </label>
                </div>
                <textarea
                  name="description"
                  value={profileForm.description}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Descripción"
                  rows={3}
                  className={`rounded-xl border border-amber-300 bg-amber-50/40 px-3 py-2 ${lightInputClass}`}
                />
                <p className="text-xs text-amber-700">◷ En revisión</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <UITextInput
                    name="contactPhone"
                    value={profileForm.contactPhone}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, contactPhone: e.target.value }))}
                    placeholder="Teléfono"
                    className={`h-[46px] rounded-xl ${lightInputClass}`}
                  />
                  <UITextInput
                    name="contactEmail"
                    value={profileForm.contactEmail}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="Email de contacto"
                    type="email"
                    className={`h-[46px] rounded-xl ${lightInputClass}`}
                  />
                  <UITextInput
                    name="contactWhatsapp"
                    value={profileForm.contactWhatsapp}
                    onChange={(e) => setProfileForm((prev) => ({ ...prev, contactWhatsapp: e.target.value }))}
                    placeholder="WhatsApp"
                    className={`h-[46px] rounded-xl ${lightInputClass}`}
                  />
                </div>
              </form>
            </UICard>

            <UICard className={`bg-quegym-subtle ${lightCardClass}`}>
              <h2 className="mb-3 text-base font-semibold">Horarios de atención</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  ["Lun - Vie", "5:00am - 11:00pm"],
                  ["Sábado", "6:00am - 8:00pm"],
                  ["Domingo", "7:00am - 2:00pm"],
                  ["Feriados", "Horario reducido"],
                ].map(([label, value], i) => (
                  <div key={label} className={`rounded-xl border px-3 py-2 text-sm ${i < 2 ? "border-amber-200 bg-amber-50/60 text-amber-800" : "border-quegym-border bg-quegym-elevated text-quegym-primary"}`}>
                    <span className="font-medium">{label}</span>{" "}
                    <span className="ml-1">{value}</span>
                    <span className="float-right text-xs">{i < 2 ? "◷" : "✓"}</span>
                  </div>
                ))}
              </div>
            </UICard>

            <UICard className={`bg-quegym-subtle ${lightCardClass}`}>
              <h2 className="mb-3 text-base font-semibold">Modalidades</h2>
              <div className="mb-5 flex flex-wrap gap-2">
                {["Musculación", "Cardio", "Funcional", "TRX", "Spinning", "Yoga", "Pilates", "Boxing"].map((m, idx) => (
                  <span key={m} className={`rounded-full border px-3 py-1 text-[13px] ${idx < 4 ? "border-quegym-accent bg-quegym-accent text-white" : "border-quegym-border bg-quegym-elevated text-quegym-secondary"}`}>
                    {idx < 4 ? "✓ " : ""}{m}
                  </span>
                ))}
              </div>
              <h3 className="mb-2 text-sm font-semibold text-quegym-primary">Amenidades</h3>
              <div className="flex flex-wrap gap-2">
                {["Estacionamiento", "Sauna", "Duchas", "Aire acondicionado", "Piscina", "Cafetería", "Wifi"].map((a, idx) => (
                  <span key={a} className={`rounded-full border px-3 py-1 text-[13px] ${idx < 4 ? "border-quegym-accent bg-quegym-accent text-white" : "border-quegym-border bg-quegym-elevated text-quegym-secondary"}`}>
                    {idx < 4 ? "✓ " : ""}{a}
                  </span>
                ))}
              </div>
            </UICard>
            </>
            ) : null}
          </div>

          {activeSection === "fotos" ? (
          <div className="space-y-3 xl:sticky xl:top-4 xl:h-fit">
            <UICard className={lightCardClass}>
              <h3 className="text-sm font-semibold text-quegym-primary">Vista previa en catálogo</h3>
              <p className="mt-1 text-xs text-quegym-secondary">{ogPreviewPath}</p>
              <p className="mt-3 text-sm font-medium text-quegym-primary">{ogPreviewTitle}</p>
              <p className="mt-1 line-clamp-3 text-xs text-quegym-secondary">{ogPreviewDescription}</p>
              {ogPreviewImage ? (
                <div className="mt-3 overflow-hidden rounded-xl border border-quegym-border">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={ogPreviewImage} alt="" className="h-32 w-full object-cover" />
                </div>
              ) : (
                <p className="mt-3 text-xs text-quegym-secondary">Sube al menos una foto para la vista previa.</p>
              )}
            </UICard>
            <UIButton
              type="button"
              variant="secondary"
              className={lightSecondaryButtonClass}
              fullWidth
              disabled={!photosVenueSlug.trim()}
              onClick={() => void onCopyGymLink()}
            >
              {copiedLink ? "Enlace copiado" : "Copiar enlace de la ficha"}
            </UIButton>
          </div>
          ) : null}

          {activeSection === "perfil" ? (
          <div className="space-y-3 xl:sticky xl:top-4 xl:h-fit">
            <UICard className={lightCardClass}>
              <h3 className="text-sm font-semibold text-quegym-primary">Estado de publicación</h3>
              <p className="mt-2 text-sm text-quegym-highlight">● Perfil publicado y activo</p>
              <p className="mt-1 text-xs text-amber-700">◷ {Math.max(0, profileChecklist.length - completedChecklist)} cambios en revisión (desc. + horarios)</p>
              <p className="mt-1 text-xs text-quegym-secondary">Última publicación: hoy 10:45am</p>
            </UICard>
            <UICard className="border-amber-200 bg-amber-50/60">
              <p className="text-sm font-medium text-amber-900">Completitud del perfil</p>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-2 flex-1 rounded-full bg-amber-100">
                  <div className="h-2 rounded-full bg-amber-500" style={{ width: `${completionPct}%` }} />
                </div>
                <span className="text-sm font-semibold text-amber-900">{completionPct}%</span>
              </div>
              <ul className="mt-2 space-y-1 text-xs text-amber-800">
                <li>• Agregar min. 3 fotos</li>
                <li>• Horarios fin de semana</li>
              </ul>
            </UICard>
            <UIButton form="partner-profile-form" type="submit" className={lightPrimaryButtonClass} fullWidth>
              {savingProfile ? "Guardando…" : "Guardar cambios"}
            </UIButton>
            <UIButton
              type="button"
              variant="secondary"
              className={lightSecondaryButtonClass}
              fullWidth
              onClick={() => void reload(photosVenueSlug)}
            >
              Descartar cambios
            </UIButton>
            <p className="text-xs text-quegym-secondary">
              ◷ Los cambios quedan en revisión antes de publicarse públicamente en el catálogo de {BRAND_NAME}.
            </p>
          </div>
          ) : null}
        </div>
      </div>
      ) : null}

      {activeSection === "planes" ? (
      <div className="grid gap-4 xl:grid-cols-[1.65fr_0.85fr]">
        <UICard className={`bg-quegym-subtle ${lightCardClass}`}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[30px] font-semibold leading-tight text-quegym-primary">Planes y precios referenciales</h2>
              <p className="mt-1 text-sm text-quegym-secondary">
                Los precios se muestran como orientativos. El usuario contactará al centro para confirmar.
              </p>
            </div>
            <UIButton
              size="sm"
              onClick={() => setShowPlanForm((v) => !v)}
              className="!rounded-full !px-4"
            >
              + Agregar plan
            </UIButton>
          </div>

          <div className="mb-2 grid grid-cols-[1.6fr_0.8fr_0.7fr_0.5fr_0.55fr] gap-2 px-3 text-xs font-medium text-quegym-secondary">
            <span>Nombre y descripción</span>
            <span>Periodicidad</span>
            <span>Precio ref.</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>

          <div className="space-y-2">
            {plans.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-quegym-border px-4 py-8 text-center text-sm text-quegym-secondary">
                No hay planes aún.
              </div>
            ) : (
              plans.map((p, idx) => (
                <article
                  key={p.id}
                  className={`grid grid-cols-[1.6fr_0.8fr_0.7fr_0.5fr_0.55fr] items-center gap-2 rounded-2xl border px-3 py-3 ${
                    idx === 0 ? "border-quegym-accent bg-quegym-elevated" : "border-quegym-border bg-quegym-elevated"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[28px]/none text-sm font-semibold text-quegym-primary">{p.name}</p>
                    <p className="truncate text-xs text-quegym-secondary">
                      {p.description?.trim() || "Sin descripción"}
                    </p>
                  </div>
                  <p className="text-sm text-quegym-primary">{p.period || "Mensual"}</p>
                  <p className="text-lg font-semibold text-quegym-primary">
                    {p.priceLabel?.trim() ? `$${p.priceLabel.replace(/[^0-9.,]/g, "") || p.priceLabel}` : "Consultar"}
                  </p>
                  <p className={`text-sm ${p.active ? "text-quegym-highlight" : "text-quegym-secondary"}`}>
                    {p.active ? "●" : "●"}
                  </p>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title={p.active ? "Ocultar plan" : "Publicar plan"}
                      onClick={() => void togglePlan(p)}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-quegym-border bg-quegym-elevated text-xs text-quegym-secondary hover:bg-quegym-subtle"
                    >
                      {p.active ? "👁" : "⊘"}
                    </button>
                    <button
                      type="button"
                      disabled
                      title="Editar (próximamente)"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-quegym-border bg-quegym-elevated text-xs text-quegym-secondary"
                    >
                      ✎
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowPlanForm(true)}
            className="mt-3 inline-flex w-full items-center justify-center rounded-2xl border border-dashed border-quegym-border px-4 py-3 text-sm font-medium text-quegym-secondary hover:bg-quegym-subtle"
          >
            + Agregar nuevo plan
          </button>
        </UICard>

        {showPlanForm ? (
          <UICard className={`h-fit bg-quegym-subtle ${lightCardClass}`}>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-quegym-primary">Nuevo plan</h3>
              <button
                type="button"
                onClick={() => setShowPlanForm(false)}
                className="rounded-full border border-quegym-border px-2 py-0.5 text-xs text-quegym-secondary hover:bg-quegym-subtle"
              >
                ×
              </button>
            </div>
            <form className="space-y-3" onSubmit={onCreatePlan}>
              <input type="hidden" name="venueSlug" value={photosVenueSlug} />
              <label className="block space-y-1">
                <span className="text-xs font-medium text-quegym-primary">Nombre del plan *</span>
                <UITextInput
                  name="name"
                  required
                  placeholder="Ej: Mensualidad, Plan Básico, 3 meses..."
                  className={`h-[44px] ${lightInputClass}`}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-medium text-quegym-primary">Descripción breve</span>
                <textarea
                  name="description"
                  rows={2}
                  placeholder="¿Qué incluye este plan?"
                  className={`w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-2 text-sm text-quegym-primary placeholder:text-quegym-secondary`}
                />
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className="space-y-1">
                  <span className="text-xs font-medium text-quegym-primary">Periodicidad *</span>
                  <select
                    name="period"
                    defaultValue="Mensual"
                    className={`h-[44px] w-full rounded-xl border border-quegym-border bg-quegym-elevated px-3 text-sm text-quegym-primary`}
                  >
                    <option value="Mensual">Mensual</option>
                    <option value="3 meses">3 meses</option>
                    <option value="Una vez">Una vez</option>
                    <option value="Anual">Anual</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-medium text-quegym-primary">Precio referencial</span>
                  <UITextInput
                    name="priceLabel"
                    placeholder='0.00 (o "Consultar")'
                    className={`h-[44px] ${lightInputClass}`}
                  />
                </label>
              </div>
              <UICard className="!border-sky-200 !bg-sky-50 !p-3 text-xs text-sky-700">
                Si dejas el precio en blanco, se mostrará como Consultar precio en el catálogo.
              </UICard>
              <div className="flex items-center gap-2">
                <UIButton type="submit" disabled={savingPlan} className={lightPrimaryButtonClass}>
                  {savingPlan ? "Agregando..." : "Agregar plan"}
                </UIButton>
                <UIButton type="button" variant="secondary" className={lightSecondaryButtonClass} onClick={() => setShowPlanForm(false)}>
                  Cancelar
                </UIButton>
              </div>
            </form>
          </UICard>
        ) : null}
      </div>
      ) : null}


      {activeSection === "leads" ? (
      <UICard className={`bg-quegym-subtle ${lightCardClass}`}>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[30px] font-semibold leading-tight text-quegym-primary">Leads recibidos</h2>
            <p className="text-sm text-quegym-secondary">
              {leadsReceivedCount} nuevos sin atender · {leadsContactedCount} atendidos
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-1.5 text-sm text-quegym-secondary"
            >
              Filtrar ▾
            </button>
            <button
              type="button"
              className="rounded-xl border border-quegym-border bg-quegym-elevated px-3 py-1.5 text-sm text-quegym-secondary"
            >
              Exportar
            </button>
          </div>
        </div>
        <div className="mb-4 inline-flex rounded-xl border border-quegym-border bg-quegym-elevated p-1 text-sm">
          <button
            type="button"
            onClick={() => setLeadFilter("received")}
            className={`rounded-lg px-3 py-1.5 ${
              leadFilter === "received" ? "bg-quegym-subtle font-medium text-quegym-primary" : "text-quegym-secondary"
            }`}
          >
            Nuevos ({leadsReceivedCount})
          </button>
          <button
            type="button"
            onClick={() => setLeadFilter("contacted")}
            className={`rounded-lg px-3 py-1.5 ${
              leadFilter === "contacted" ? "bg-quegym-subtle font-medium text-quegym-primary" : "text-quegym-secondary"
            }`}
          >
            Atendidos ({leadsContactedCount})
          </button>
          <button
            type="button"
            onClick={() => setLeadFilter("all")}
            className={`rounded-lg px-3 py-1.5 ${
              leadFilter === "all" ? "bg-quegym-subtle font-medium text-quegym-primary" : "text-quegym-secondary"
            }`}
          >
            Todos ({leads.length})
          </button>
        </div>

        <div className="overflow-hidden rounded-2xl border border-quegym-border bg-quegym-elevated">
          <div className="grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr_0.8fr_0.7fr_0.55fr] gap-2 border-b border-quegym-border px-4 py-3 text-xs font-medium text-quegym-secondary">
            <span>Nombre</span>
            <span>Interés</span>
            <span>Contacto</span>
            <span>Canal</span>
            <span>Fecha/hora</span>
            <span>Estado</span>
            <span>Acciones</span>
          </div>
          {leadsFiltered.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-quegym-secondary">
              No hay leads para este filtro.
            </p>
          ) : (
            <div className="divide-y divide-quegym-border">
              {leadsFiltered.map((lead) => (
                <div
                  key={lead.id}
                  className="grid grid-cols-[1.2fr_0.9fr_1fr_0.7fr_0.8fr_0.7fr_0.55fr] items-center gap-2 px-4 py-3 text-sm text-quegym-primary"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-quegym-subtle text-xs text-quegym-secondary">
                      {lead.name.charAt(0).toUpperCase()}
                    </span>
                    <span className="truncate font-medium">{lead.name}</span>
                  </div>
                  <span className="truncate text-quegym-secondary">{lead.intent}</span>
                  <span className="truncate text-quegym-secondary">{lead.phone || lead.email || "—"}</span>
                  <span className={`truncate font-medium ${detectLeadChannel(lead) === "WhatsApp" ? "text-quegym-highlight" : "text-blue-600"}`}>
                    {detectLeadChannel(lead)}
                  </span>
                  <span className="text-quegym-secondary">{formatLeadDate(lead.createdAt)}</span>
                  <span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${
                        lead.status === "received"
                          ? "bg-quegym-accent text-white"
                          : lead.status === "contacted"
                            ? "bg-quegym-highlight-soft text-quegym-highlight"
                            : "bg-quegym-subtle text-quegym-primary"
                      }`}
                    >
                      {lead.status === "received"
                        ? "Nuevo"
                        : lead.status === "contacted"
                          ? "Atendido"
                          : "Cerrado"}
                    </span>
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      className="inline-flex h-8 items-center justify-center rounded-xl border border-quegym-border bg-quegym-elevated px-3 text-xs font-medium text-quegym-secondary hover:bg-quegym-subtle"
                    >
                      Ver
                    </button>
                    {lead.status === "received" ? (
                      <button
                        type="button"
                        disabled={updatingLeadId === lead.id}
                        onClick={() => void updateLeadStatus(lead, "contacted")}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-quegym-highlight/30 bg-quegym-highlight-soft text-sm text-quegym-highlight hover:bg-quegym-highlight-hover"
                        title="Marcar atendido"
                      >
                        ✓
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </UICard>
      ) : null}

      {activeSection === "config" && variant === "partner" ? (
      <div className="grid gap-0 rounded-2xl border border-quegym-border bg-quegym-elevated lg:grid-cols-[240px_1fr]">
        <aside className="border-r border-quegym-border p-4">
          <h2 className="mb-4 text-[30px] font-semibold leading-tight text-quegym-primary">Configuración</h2>
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => openConfigView("account")}
              className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                configView === "account"
                  ? "bg-quegym-subtle font-medium text-quegym-primary"
                  : "text-quegym-secondary hover:bg-quegym-subtle"
              }`}
            >
              <span>Cuenta</span>
            </button>
            {[
              ["gyms", "Mis centros"],
              ["notifications", "Notificaciones"],
              ["billing", "Facturación"],
              ["privacy", "Privacidad"],
              ["help", "Ayuda y soporte"],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => openConfigView(id as ConfigView)}
                className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm ${
                  configView === id ? "bg-quegym-subtle font-medium text-quegym-primary" : "text-quegym-secondary hover:bg-quegym-subtle"
                }`}
              >
                <span>{label}</span>
                {id === "gyms" ? (
                  <span className="text-xs text-quegym-secondary">2</span>
                ) : null}
                {id === "billing" ? (
                  <span className="rounded border border-blue-200 px-1.5 py-0.5 text-[10px] text-blue-600">Pronto</span>
                ) : null}
              </button>
            ))}
          </div>
        </aside>

        <div className="p-4 sm:p-5">
          {configView === "account" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-[34px] font-semibold leading-tight text-quegym-primary">Cuenta y acceso</h3>
                <p className="text-sm text-quegym-secondary">Administra tu email, contraseña y seguridad</p>
              </div>
              <UICard className={lightCardClass}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[28px]/none text-base font-medium text-quegym-primary">Correo electrónico</p>
                    <p className="text-sm text-quegym-secondary">Tu correo para acceder al panel de partners</p>
                  </div>
                  <Link href={`/partner/configuracion/cambiar-correo?venueSlug=${encodeURIComponent(photosVenueSlug || "")}&configView=account`}>
                    <UIButton variant="secondary" size="sm" className={lightSecondaryButtonClass}>Cambiar</UIButton>
                  </Link>
                </div>
                <div className="mt-3 rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2 text-quegym-primary">
                  {profile.partnerEmail || "admin@evolvefitness.com"}
                </div>
              </UICard>
              <UICard className={lightCardClass}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-medium text-quegym-primary">Contraseña</p>
                    <p className="text-sm text-quegym-secondary">Acceso por enlace mágico / configuración local</p>
                  </div>
                  <UIButton variant="secondary" size="sm" className={lightSecondaryButtonClass}>Configurar</UIButton>
                </div>
                <div className="mt-3 rounded-xl border border-quegym-border bg-quegym-subtle px-3 py-2 text-quegym-secondary">
                  No configurada - Acceso por enlace mágico
                </div>
              </UICard>
              <UICard className={lightCardClass}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-base font-medium text-quegym-primary">Autenticación de dos factores</p>
                    <p className="text-sm text-quegym-secondary">Agrega una capa extra de seguridad con código SMS o app.</p>
                  </div>
                  <span className="rounded border border-blue-200 px-2 py-1 text-xs font-medium text-blue-600">Próximamente</span>
                </div>
              </UICard>
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <form action="/partner/logout" method="POST">
                  <UIButton
                    type="submit"
                    variant="secondary"
                    size="sm"
                    className={lightSecondaryButtonClass}
                  >
                    Cerrar sesión
                  </UIButton>
                </form>
                <Link href={`/partner/configuracion/eliminar-cuenta?venueSlug=${encodeURIComponent(photosVenueSlug || "")}&configView=account`}>
                  <UIButton variant="secondary" size="sm" className="!border-rose-300 !bg-rose-50 !text-rose-700 hover:!bg-rose-100">
                    Eliminar cuenta
                  </UIButton>
                </Link>
              </div>
            </div>
          ) : configView === "gyms" ? (
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-quegym-primary">Mis centros</h3>
              <p className="text-sm text-quegym-secondary">Cambia de centro o agrega uno nuevo.</p>
              <Link href={`/partner/configuracion/mis-centros?venueSlug=${encodeURIComponent(photosVenueSlug || "")}&configView=gyms`}>
                <UIButton>Abrir vista de centros</UIButton>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold text-quegym-primary">Configuración</h3>
              <p className="text-sm text-quegym-secondary">
                Esta sección se irá habilitando por etapas del panel partner.
              </p>
              <div className="flex flex-wrap gap-2">
                <Link href="/partner/venues"><UIButton variant="secondary" size="sm" className={lightSecondaryButtonClass}>Mis centros</UIButton></Link>
                <Link href={`/partner/leads?venueSlug=${encodeURIComponent(photosVenueSlug || "")}`}><UIButton variant="secondary" size="sm" className={lightSecondaryButtonClass}>Abrir leads</UIButton></Link>
              </div>
            </div>
          )}
        </div>
      </div>
      ) : null}
            {activeSection === "dashboard" ? (
              <div className="mt-6 flex justify-end">
                <UIButton
                  onClick={() => setActiveSection("perfil")}
                  className="!h-11 !rounded-2xl !px-6"
                >
                  Completar perfil
                </UIButton>
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}

function statusLine(ok: boolean): string {
  return ok ? "text-quegym-highlight" : "text-quegym-secondary";
}

function formatLeadDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-VE", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function detectLeadChannel(lead: { email: string | null; phone: string; intent: string }): "WhatsApp" | "Formulario" {
  const intent = lead.intent.toLowerCase();
  if (intent.includes("whatsapp")) return "WhatsApp";
  if (!lead.email && lead.phone) return "WhatsApp";
  return "Formulario";
}

function parseConfigView(input: string | null): ConfigView | null {
  if (
    input === "account" ||
    input === "gyms" ||
    input === "notifications" ||
    input === "billing" ||
    input === "privacy" ||
    input === "help"
  ) {
    return input;
  }
  return null;
}
