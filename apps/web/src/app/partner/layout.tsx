import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-quegym-page text-quegym-primary">
      <div className="mx-auto flex max-w-[1280px] justify-end px-4 pt-3">
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
