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
          "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-100",
        variant === "success" &&
          "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-100",
        variant === "warning" &&
          "border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-100",
        variant === "error" &&
          "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-100",
        className,
      )}
      {...props}
    />
  );
}

