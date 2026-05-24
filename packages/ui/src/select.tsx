import type { SelectHTMLAttributes } from "react";
import { cn } from "./cn";

export type UISelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export function UISelect({ className, children, ...props }: UISelectProps) {
  return (
    <select
      className={cn(
        "w-full rounded-[var(--floit-radius-md)] border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

