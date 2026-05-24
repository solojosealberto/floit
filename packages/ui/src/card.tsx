import type { HTMLAttributes } from "react";
import { cn } from "./cn";

export type UICardProps = HTMLAttributes<HTMLDivElement>;

export function UICard({ className, ...props }: UICardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-neutral-200 bg-white p-4 shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

