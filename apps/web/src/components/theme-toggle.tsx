"use client";

import { useEffect, useState } from "react";
import {
  applyTheme,
  readStoredTheme,
  setStoredTheme,
  type ThemeMode,
} from "@/lib/theme";

type Props = {
  className?: string;
  /** Texto más compacto en headers estrechos. */
  compact?: boolean;
};

function SunIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}

export function ThemeToggle({ className = "", compact = false }: Props) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = readStoredTheme();
    const attr = document.documentElement.getAttribute("data-theme");
    const current =
      stored ??
      (attr === "light" || attr === "dark" ? attr : "dark");
    setTheme(current);
  }, []);

  function onToggle() {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setStoredTheme(next);
    applyTheme(next);
    setTheme(next);
  }

  const label = theme === "dark" ? "Modo claro" : "Modo oscuro";
  const Icon = theme === "dark" ? SunIcon : MoonIcon;

  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={theme === "dark"}
      aria-label={label}
      className={`qg-btn-ghost qg-motion inline-flex items-center gap-1.5 rounded-xl border border-[var(--qg-border)] bg-[var(--qg-bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-[var(--qg-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--qg-accent)] ${className}`}
    >
      {mounted ? <Icon /> : <span className="h-4 w-4 shrink-0" aria-hidden />}
      {!compact ? <span>{label}</span> : null}
    </button>
  );
}
