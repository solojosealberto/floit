import type { Metadata } from "next";
import { Barlow_Semi_Condensed, Inter } from "next/font/google";
import { BRAND_META_DESCRIPTION, BRAND_META_TITLE_DEFAULT, BRAND_NAME } from "@/lib/brand";
import { FloitMainHeader } from "./floit-main-header";
import { FloitSiteFooter } from "./floit-site-footer";
import { ThemeScript } from "./theme-script";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const barlow = Barlow_Semi_Condensed({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  applicationName: BRAND_NAME,
  title: {
    default: BRAND_META_TITLE_DEFAULT,
    template: `%s · ${BRAND_NAME}`,
  },
  description: BRAND_META_DESCRIPTION,
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body
        className={`${inter.variable} ${barlow.variable} bg-quegym-page text-quegym-primary antialiased`}
      >
        <FloitMainHeader />
        <div className="flex min-h-[calc(100vh-56px)] flex-col px-0 pt-2 md:pt-3">
          {children}
          <FloitSiteFooter />
        </div>
      </body>
    </html>
  );
}
