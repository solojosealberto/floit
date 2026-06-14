"use client";

import {
  Check,
  Heart,
  Mail,
  MessageCircle,
  Phone,
  Share2,
  type LucideIcon,
} from "lucide-react";
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
        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium ${
          fav
            ? "border border-quegym-highlight/40 bg-quegym-highlight-soft text-quegym-highlight"
            : "border border-quegym-border text-quegym-primary hover:bg-quegym-subtle"
        }`}
      >
        <Heart className="h-3.5 w-3.5" aria-hidden fill={fav ? "currentColor" : "none"} />
        {fav ? "Guardado" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={onShare}
        className="inline-flex items-center gap-1.5 rounded-full border border-quegym-border px-3 py-1.5 text-xs text-quegym-secondary hover:bg-quegym-subtle"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-quegym-highlight" aria-hidden />
        ) : (
          <Share2 className="h-3.5 w-3.5" aria-hidden />
        )}
        {copied ? "Copiado" : "Compartir"}
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
    <div className="grid grid-cols-5 gap-2 text-center text-[10px] text-quegym-secondary">
      <ActionLink
        label="WhatsApp"
        href={whatsappHref}
        Icon={MessageCircle}
        onPress={() => trackEvent("direct_contact_click", { channel: "whatsapp", slug })}
      />
      <ActionLink
        label="Llamar"
        href={phoneHref}
        Icon={Phone}
        onPress={() => trackEvent("direct_contact_click", { channel: "phone", slug })}
      />
      <ActionLink
        label="Email"
        href={emailHref}
        Icon={Mail}
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
          className={`inline-flex h-10 w-10 items-center justify-center rounded-xl border ${
            fav
              ? "border-quegym-highlight/40 bg-quegym-highlight-soft text-quegym-highlight"
              : "border-quegym-border bg-quegym-subtle text-quegym-primary"
          }`}
        >
          <Heart className="h-4 w-4" aria-hidden fill={fav ? "currentColor" : "none"} />
        </span>
        {fav ? "Guardado" : "Guardar"}
      </button>
      <button
        type="button"
        onClick={onShare}
        className="flex flex-col items-center gap-1"
      >
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-quegym-border bg-quegym-subtle">
          {copied ? (
            <Check className="h-4 w-4 text-quegym-highlight" aria-hidden />
          ) : (
            <Share2 className="h-4 w-4 text-quegym-primary" aria-hidden />
          )}
        </span>
        {copied ? "Copiado" : "Compartir"}
      </button>
    </div>
  );
}

function ActionLink({
  label,
  href,
  Icon,
  onPress,
}: {
  label: string;
  href?: string | null;
  Icon: LucideIcon;
  onPress?: () => void;
}) {
  if (!href) {
    return (
      <span className="flex flex-col items-center gap-1 opacity-50">
        <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-quegym-border bg-quegym-subtle">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        {label}
      </span>
    );
  }
  const external = href.startsWith("http");
  const content = (
    <>
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-quegym-border bg-quegym-subtle">
        <Icon className="h-4 w-4 text-quegym-primary" aria-hidden />
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
