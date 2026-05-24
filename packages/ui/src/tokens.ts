export const uiTokens = {
  color: {
    primary: "var(--floit-color-primary)",
    primaryForeground: "var(--floit-color-primary-foreground)",
    border: "var(--floit-color-surface-border)",
    muted: "var(--floit-color-surface-background-secondary)",
    mutedForeground: "var(--floit-color-neutral-600)",
    success: "var(--floit-color-success)",
    successBg: "var(--floit-color-success-bg)",
    error: "var(--floit-color-error)",
    errorBg: "var(--floit-color-error-bg)",
  },
  radius: {
    sm: "var(--floit-radius-sm)",
    md: "var(--floit-radius-md)",
    lg: "var(--floit-radius-lg)",
  },
  spacing: {
    2: "var(--floit-spacing-2)",
    3: "var(--floit-spacing-3)",
    4: "var(--floit-spacing-4)",
    6: "var(--floit-spacing-6)",
  },
  typography: {
    xs: "var(--floit-font-size-xs)",
    sm: "var(--floit-font-size-sm)",
    base: "var(--floit-font-size-base)",
    lg: "var(--floit-font-size-lg)",
    medium: "var(--floit-font-weight-medium)",
    semibold: "var(--floit-font-weight-semibold)",
  },
} as const;

export type UiTokens = typeof uiTokens;
