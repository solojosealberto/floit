import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type UICardProps = HTMLAttributes<HTMLDivElement>;

export function UICard({ className, ...props }: UICardProps) {
  return (
    <div
      className={cn(
        "qg-surface-subtle qg-motion rounded-xl border border-[var(--qg-border)] bg-[var(--qg-bg-elevated)] p-4",
        className,
      )}
      {...props}
    />
  );
}
