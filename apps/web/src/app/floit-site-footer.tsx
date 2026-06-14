"use client";

import { usePathname } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";

function shouldShowSiteFooter(pathname: string): boolean {
  if (!pathname) return true;
  if (pathname.startsWith("/admin")) return false;
  if (pathname.startsWith("/partner")) return false;
  if (pathname.startsWith("/api")) return false;
  return true;
}

export function FloitSiteFooter() {
  const pathname = usePathname();
  if (!shouldShowSiteFooter(pathname)) return null;
  return <SiteFooter />;
}
