import type { InputHTMLAttributes } from "react";
import { cn } from "./cn";

export type UITextInputProps = InputHTMLAttributes<HTMLInputElement>;

export function UITextInput({ className, ...props }: UITextInputProps) {
  return (
    <input
      className={cn(
        "w-full rounded-[var(--floit-radius-md)] border border-[var(--qg-border)] bg-[var(--qg-bg-input)] px-3 py-2 text-sm text-[var(--qg-text-primary)] placeholder:text-[var(--qg-text-secondary)] focus-visible:outline-none focus-visible:ring-0 focus-visible:border-[color-mix(in_srgb,var(--qg-accent)_55%,var(--qg-border))] focus-visible:shadow-[0_0_0_1px_color-mix(in_srgb,var(--qg-accent)_38%,transparent)]",
        className,
      )}
      {...props}
    />
  );
}
