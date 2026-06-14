import type { HTMLAttributes } from "react";
import { cn } from "./cn";

type UIBannerVariant = "info" | "success" | "warning" | "error";

export type UIBannerProps = HTMLAttributes<HTMLDivElement> & {
  variant?: UIBannerVariant;
};

export function UIBanner({
  className,
  variant = "info",
  ...props
}: UIBannerProps) {
  return (
    <div
      className={cn(
        "rounded-lg border px-3 py-2 text-sm",
        variant === "info" &&
          "border-[var(--qg-border)] bg-[var(--qg-bg-subtle)] text-[var(--qg-text-primary)]",
        variant === "success" &&
          "border-[var(--qg-highlight)]/30 bg-[var(--qg-highlight-soft)] text-[var(--qg-highlight)]",
        variant === "warning" &&
          "border-[var(--qg-warning)]/30 bg-[var(--qg-warning)]/10 text-[var(--qg-warning)]",
        variant === "error" &&
          "border-[var(--qg-error)]/30 bg-[var(--qg-error)]/10 text-[var(--qg-error)]",
        className,
      )}
      {...props}
    />
  );
}
