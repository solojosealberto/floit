"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BRAND_NAME } from "@/lib/brand";
import { isFavoriteSlug, toggleFavoriteSlug } from "@/lib/floit-favorites";
import { trackEvent } from "@/lib/track";

type BaseProps = {
  slug: string;
  venueName: string;
  whatsappHref?: string | null;
  phoneHref?: string | null;
  emailHref?: string | null;
};

export function GymHeaderActionControls({ slug, venueName }: BaseProps) {
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const fav = useMemo(() => isFavoriteSlug(slug), [slug, tick]);

  async function onShare() {
    const shareData = {
      title: venueName,
      text: `Revisa ${venueName} en ${BRAND_NAME}`,
      url: `${window.location.origin}/gyms/${encodeURIComponent(slug)}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }
      trackEvent("cta_click", { channel: "share", venueSlug: slug });
    } catch {
      // ignore cancel/errors in share UX
    }
  }

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <button
        type="button"
        onClick={() => {
          toggleFavoriteSlug(slug);
          setTick((v) => v + 1);
          trackEvent("favorite_toggle", { slug });
        }}
        className={`rounded-xl px-3 py-1.5 text-xs font-medium ${
          fav
            ? "border border-rose-300 bg-rose-50 text-rose-700"
            : "border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
        }`}
      >
        {fav ? "Guardado" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={onShare}
        className="rounded-full border border-neutral-300 px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50"
      >
        {copied ? "✓ Copiado" : "⤴ Compartir"}
      </button>
    </div>
  );
}

export function GymMobileActionRow({
  slug,
  venueName,
  whatsappHref,
  phoneHref,
  emailHref,
}: BaseProps) {
  const [tick, setTick] = useState(0);
  const [copied, setCopied] = useState(false);
  const fav = useMemo(() => isFavoriteSlug(slug), [slug, tick]);

  async function onShare() {
    const shareData = {
      title: venueName,
      text: `Revisa ${venueName} en ${BRAND_NAME}`,
      url: `${window.location.origin}/gyms/${encodeURIComponent(slug)}`,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(shareData.url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }
      trackEvent("cta_click", { channel: "share", venueSlug: slug });
    } catch {
      // ignore cancel/errors in share UX
    }
  }

  return (
    <div className="grid grid-cols-5 gap-2 text-center text-[10px] text-neutral-600">
      <ActionLink
        label="WhatsApp"
        href={whatsappHref}
        icon="◔"
        onPress={() => trackEvent("direct_contact_click", { channel: "whatsapp", slug })}
      />
      <ActionLink
        label="Llamar"
        href={phoneHref}
        icon="◡"
        onPress={() => trackEvent("direct_contact_click", { channel: "phone", slug })}
      />
      <ActionLink
        label="Email"
        href={emailHref}
        icon="✉"
        onPress={() => trackEvent("direct_contact_click", { channel: "email", slug })}
      />
      <button
        type="button"
        onClick={() => {
          toggleFavoriteSlug(slug);
          setTick((v) => v + 1);
          trackEvent("favorite_toggle", { slug });
        }}
        className="flex flex-col items-center gap-1"
      >
        <span
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border text-sm ${
            fav
              ? "border-rose-300 bg-rose-50 text-rose-700"
              : "border-neutral-300 bg-neutral-50 text-neutral-700"
          }`}
        >
          {fav ? "★" : "☆"}
        </span>
        {fav ? "Guardado" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={onShare}
        className="flex flex-col items-center gap-1"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 bg-neutral-50 text-sm">
          ⤴
        </span>
        {copied ? "Copiado" : "Compartir"}
      </button>
    </div>
  );
}

function ActionLink({
  label,
  href,
  icon,
  onPress,
}: {
  label: string;
  href?: string | null;
  icon: string;
  onPress?: () => void;
}) {
  if (!href) {
    return (
      <span className="flex flex-col items-center gap-1 opacity-50">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-neutral-100 text-sm">
          {icon}
        </span>
        {label}
      </span>
    );
  }
  const external = href.startsWith("http");
  const content = (
    <>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-300 bg-neutral-50 text-sm">
        {icon}
      </span>
      {label}
    </>
  );
  if (external) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onPress}
        className="flex flex-col items-center gap-1"
      >
        {content}
      </a>
    );
  }
  return (
    <Link href={href} onClick={onPress} className="flex flex-col items-center gap-1">
      {content}
    </Link>
  );
}
