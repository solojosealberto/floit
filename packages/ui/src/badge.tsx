import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type UIBadgeVariant = "neutral" | "success" | "warning" | "error";

export type UIBadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: UIBadgeVariant;
};

export function UIBadge({
  className,
  variant = "neutral",
  ...props
}: UIBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        variant === "neutral" &&
          "bg-[var(--qg-bg-subtle)] text-[var(--qg-text-primary)]",
        variant === "success" &&
          "border border-[var(--qg-highlight)]/30 bg-[var(--qg-highlight-soft)] text-[var(--qg-highlight)]",
        variant === "warning" &&
          "border border-[var(--qg-warning)]/30 bg-[var(--qg-warning)]/10 text-[var(--qg-warning)]",
        variant === "error" &&
          "border border-[var(--qg-error)]/30 bg-[var(--qg-error)]/10 text-[var(--qg-error)]",
        className,
      )}
      {...props}
    />
  );
}
