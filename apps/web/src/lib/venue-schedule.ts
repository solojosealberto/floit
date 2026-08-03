export type WeekdayKey = "lun" | "mar" | "mie" | "jue" | "vie" | "sab" | "dom";

export type DaySchedule = {
  key: WeekdayKey;
  label: string;
  closed: boolean;
  open: string;
  close: string;
};

export const WEEKDAY_DEFS: Array<{ key: WeekdayKey; label: string; short: string }> = [
  { key: "lun", label: "Lunes", short: "Lun" },
  { key: "mar", label: "Martes", short: "Mar" },
  { key: "mie", label: "Miércoles", short: "Mié" },
  { key: "jue", label: "Jueves", short: "Jue" },
  { key: "vie", label: "Viernes", short: "Vie" },
  { key: "sab", label: "Sábado", short: "Sáb" },
  { key: "dom", label: "Domingo", short: "Dom" },
];

/** 30-minute slots 05:00–23:30 (24h for <input type="time"> / select value). */
export const TIME_SLOT_OPTIONS: string[] = (() => {
  const out: string[] = [];
  for (let h = 5; h <= 23; h++) {
    for (const m of [0, 30]) {
      if (h === 23 && m === 30) continue;
      out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }
  }
  out.push("23:30");
  return out;
})();

export function emptyWeekSchedule(): DaySchedule[] {
  return WEEKDAY_DEFS.map((d) => ({
    key: d.key,
    label: d.label,
    closed: false,
    open: "06:00",
    close: "22:00",
  }));
}

function toAmPm(hhmm: string): string {
  const [hs, ms] = hhmm.split(":");
  let h = Number(hs);
  const m = Number(ms);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return hhmm;
  const suffix = h >= 12 ? "pm" : "am";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${h12}:00${suffix}` : `${h12}:${String(m).padStart(2, "0")}${suffix}`;
}

function parseAmPmOr24(raw: string): string | null {
  const t = raw.trim().toLowerCase().replace(/\s+/g, "");
  const m24 = t.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const h = Number(m24[1]);
    const m = Number(m24[2]);
    if (h >= 0 && h <= 23 && m >= 0 && m <= 59) {
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
  }
  const m12 = t.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)$/);
  if (!m12) return null;
  let h = Number(m12[1]);
  const m = Number(m12[2] ?? "0");
  const ap = m12[3];
  if (h < 1 || h > 12 || m < 0 || m > 59) return null;
  if (ap === "am") {
    if (h === 12) h = 0;
  } else if (h !== 12) {
    h += 12;
  }
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

const DAY_ALIASES: Record<string, WeekdayKey> = {
  lunes: "lun",
  lun: "lun",
  l: "lun",
  martes: "mar",
  mar: "mar",
  miercoles: "mie",
  miércoles: "mie",
  mie: "mie",
  mié: "mie",
  jueves: "jue",
  jue: "jue",
  viernes: "vie",
  vie: "vie",
  sabado: "sab",
  sábado: "sab",
  sab: "sab",
  sáb: "sab",
  domingo: "dom",
  dom: "dom",
};

function expandDayRange(from: WeekdayKey, to: WeekdayKey): WeekdayKey[] {
  const keys = WEEKDAY_DEFS.map((d) => d.key);
  const a = keys.indexOf(from);
  const b = keys.indexOf(to);
  if (a < 0 || b < 0 || a > b) return [from];
  return keys.slice(a, b + 1);
}

function resolveDayToken(token: string): WeekdayKey[] {
  const t = token
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
  if (t.includes("-") || t.includes("–") || t.includes("a")) {
    const parts = t.split(/\s*[-–]\s*|\s+a\s+/);
    if (parts.length === 2) {
      const from = DAY_ALIASES[parts[0]!.trim()];
      const to = DAY_ALIASES[parts[1]!.trim()];
      if (from && to) return expandDayRange(from, to);
    }
  }
  const one = DAY_ALIASES[t];
  return one ? [one] : [];
}

/**
 * Best-effort parse of free-text schedules into per-day rows.
 * Unknown formats fall back to empty defaults (caller may keep raw text).
 */
export function parseScheduleSummary(raw: string | null | undefined): {
  days: DaySchedule[];
  parsed: boolean;
} {
  const base = emptyWeekSchedule();
  const text = raw?.trim();
  if (!text) return { days: base, parsed: false };

  const byKey = new Map(base.map((d) => [d.key, { ...d }]));
  let hits = 0;

  const chunks = text
    .split(/\n|·|\|/)
    .map((c) => c.trim())
    .filter(Boolean);

  for (const chunk of chunks) {
    const closedMatch = chunk.match(
      /^(.+?)\s*[:：]?\s*(cerrado|closed)\s*$/i,
    );
    if (closedMatch) {
      for (const key of resolveDayToken(closedMatch[1]!)) {
        const row = byKey.get(key);
        if (!row) continue;
        row.closed = true;
        hits += 1;
      }
      continue;
    }

    const rangeMatch = chunk.match(
      /^(.+?)\s*[:：]\s*(.+?)\s*[-–—]\s*(.+)$/i,
    );
    if (!rangeMatch) continue;
    const days = resolveDayToken(rangeMatch[1]!);
    const open = parseAmPmOr24(rangeMatch[2]!);
    const close = parseAmPmOr24(rangeMatch[3]!);
    if (!days.length || !open || !close) continue;
    for (const key of days) {
      const row = byKey.get(key);
      if (!row) continue;
      row.closed = false;
      row.open = open;
      row.close = close;
      hits += 1;
    }
  }

  return {
    days: WEEKDAY_DEFS.map((d) => byKey.get(d.key)!),
    parsed: hits > 0,
  };
}

/** Serialize day rows into a compact public schedule string. */
export function serializeScheduleSummary(days: DaySchedule[]): string {
  type Block = { from: number; to: number; closed: boolean; open: string; close: string };
  const blocks: Block[] = [];
  days.forEach((day, idx) => {
    const prev = blocks[blocks.length - 1];
    const same =
      prev &&
      prev.to === idx - 1 &&
      prev.closed === day.closed &&
      (day.closed || (prev.open === day.open && prev.close === day.close));
    if (same && prev) {
      prev.to = idx;
      return;
    }
    blocks.push({
      from: idx,
      to: idx,
      closed: day.closed,
      open: day.open,
      close: day.close,
    });
  });

  return blocks
    .map((b) => {
      const from = WEEKDAY_DEFS[b.from]!;
      const to = WEEKDAY_DEFS[b.to]!;
      const label =
        b.from === b.to ? from.label : `${from.label} - ${to.label}`;
      if (b.closed) return `${label}: cerrado`;
      return `${label}: ${toAmPm(b.open)} - ${toAmPm(b.close)}`;
    })
    .join("\n");
}

export function formatTimeSlotLabel(hhmm: string): string {
  return toAmPm(hhmm);
}
