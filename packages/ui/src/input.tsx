import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

export type UITextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function UITextInput({ className, ...props }: UITextInputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-[var(--floit-radius-md)] border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400",
        className,
      )}
      {...props}
    />
  );
}

