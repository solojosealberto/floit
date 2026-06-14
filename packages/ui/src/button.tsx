import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

export type UIButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
};

export function UIButton({
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  leadingIcon,
  children,
  ...props
}: UIButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--floit-radius-md)] font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
        variant === "primary" &&
          "qg-btn-primary qg-motion bg-[var(--qg-accent)] text-white hover:bg-[var(--qg-accent-hover)]",
        variant === "secondary" &&
          "qg-btn-ghost qg-motion border border-[var(--qg-border)] bg-[var(--qg-bg-elevated)] text-[var(--qg-text-primary)] hover:border-[var(--qg-accent)]",
        variant === "ghost" &&
          "bg-transparent text-[var(--qg-text-secondary)] hover:bg-[var(--qg-bg-subtle)] hover:text-[var(--qg-text-primary)]",
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {leadingIcon ? <span aria-hidden>{leadingIcon}</span> : null}
      {children}
    </button>
  );
}

