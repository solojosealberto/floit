/** Logo textual de marca (Fase 1 rebrand). */
export function QueGymLogo({ className }: { className?: string }) {
  return (
    <span
      className={className}
      style={{ fontWeight: 800, letterSpacing: "-0.04em" }}
    >
      QueGym
    </span>
  );
}

/** @deprecated Usar `QueGymLogo`. */
export const FloitLogo = QueGymLogo;
