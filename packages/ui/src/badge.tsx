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
          "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
        variant === "success" &&
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-200",
        variant === "warning" &&
          "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-200",
        variant === "error" &&
          "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-200",
        className,
      )}
      {...props}
    />
  );
}

