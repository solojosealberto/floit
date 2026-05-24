import type { ReactNode } from "react";

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#F5F7FA] text-neutral-900"
      style={{ colorScheme: "light" }}
    >
      {children}
    </div>
  );
}
