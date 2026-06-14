import type { SelectHTMLAttributes } from "react";
import { cn } from "./cn";

export type UISelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function UISelect({ className, children, ...props }: UISelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-[var(--floit-radius-md)] border border-[var(--qg-border)] bg-[var(--qg-bg-input)] px-3 py-2 text-sm text-[var(--qg-text-primary)] focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[color-mix(in_srgb,var(--qg-accent)_55%,var(--qg-border))] focus-visible:shadow-[0_0_0_1px_color-mix(in_srgb,var(--qg-accent)_38%,transparent)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
