import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { BRAND_NAME } from "@/lib/brand";
import { FloitMainHeader } from "./floit-main-header";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: BRAND_NAME, template: `%s · ${BRAND_NAME}` },
  description:
    "Agregador de centros de fitness en Caracas: búsqueda, comparación y contacto.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} bg-neutral-50 antialiased`}
      >
        <FloitMainHeader />
        <div className="min-h-[calc(100vh-56px)] px-0 pt-2 md:pt-3">
          {children}
        </div>
      </body>
    </html>
  );
}
