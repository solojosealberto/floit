import type { ReactNode } from "react";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-56px)] bg-quegym-page text-quegym-primary">
      {children}
    </div>
  );
}
