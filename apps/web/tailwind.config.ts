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
