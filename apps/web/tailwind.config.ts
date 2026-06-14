import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        quegym: {
          page: "var(--qg-bg-page)",
          elevated: "var(--qg-bg-elevated)",
          subtle: "var(--qg-bg-subtle)",
          input: "var(--qg-bg-input)",
          hero: "var(--qg-bg-hero)",
          banner: "var(--qg-bg-banner)",
          primary: "var(--qg-text-primary)",
          secondary: "var(--qg-text-secondary)",
          border: "var(--qg-border)",
          accent: "var(--qg-accent)",
          "accent-hover": "var(--qg-accent-hover)",
          highlight: "var(--qg-highlight)",
          "highlight-hover": "var(--qg-highlight-hover)",
          "highlight-soft": "var(--qg-highlight-soft)",
          ink: "var(--qg-ink)",
          green: "var(--qg-green)",
          mint: "var(--qg-mint)",
          mist: "var(--qg-mist)",
          slate: "var(--qg-slate)",
        },
        floit: {
          primary: "var(--floit-color-primary)",
          "primary-foreground": "var(--floit-color-primary-foreground)",
          border: "var(--floit-color-surface-border)",
          muted: "var(--floit-color-surface-background-secondary)",
          "muted-foreground": "var(--floit-color-neutral-600)",
          success: "var(--floit-color-success)",
          "success-bg": "var(--floit-color-success-bg)",
          error: "var(--floit-color-error)",
          "error-bg": "var(--floit-color-error-bg)",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
