import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function FeatureCheck({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Check className="h-3 w-3 shrink-0 text-quegym-highlight" aria-hidden />
      {children}
    </span>
  );
}
