export function formatDateShort(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("es-VE", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTimeLong(iso: string): string {
  try {
    return new Date(iso).toLocaleString("es-VE", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function formatRelativeShort(iso: string): string {
  try {
    const d = new Date(iso).getTime();
    const diffMs = Date.now() - d;
    if (diffMs < 0) return "";
    const mins = Math.floor(diffMs / 60000);
    if (mins < 1) return "hace un momento";
    if (mins < 60) return `hace ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `hace ${hours} h`;
    const days = Math.floor(hours / 24);
    if (days < 14) return `hace ${days} día${days === 1 ? "" : "s"}`;
    return "";
  } catch {
    return "";
  }
}

export function actorInitials(actor: string): string {
  const t = actor.trim();
  if (!t) return "?";
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0]!.slice(0, 1) + parts[1]!.slice(0, 1)).toUpperCase();
  }
  return t.slice(0, 2).toUpperCase();
}
