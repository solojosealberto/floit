import type { HTMLAttributes, TableHTMLAttributes, TdHTMLAttributes } from "react";
import { cn } from "./cn";

export function UITableContainer({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "overflow-x-auto rounded-xl border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950",
        className,
      )}
      {...props}
    />
  );
}

export function UITable({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cn("w-full min-w-[640px] border-collapse text-left text-sm", className)}
      {...props}
    />
  );
}

export function UITableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("px-4 py-3", className)} {...props} />;
}

