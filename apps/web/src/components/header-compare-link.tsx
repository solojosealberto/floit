"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readCompareSlugs } from "@/lib/floit-compare";

export function HeaderCompareLink({ className }: { className?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const refresh = () => setCount(readCompareSlugs().length);
    refresh();
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const href =
    count > 0
      ? `/comparar?c=${encodeURIComponent(readCompareSlugs().join(","))}`
      : "/comparar";

  return (
    <Link
      href={href}
      className={
        className ??
        "rounded-xl border border-quegym-border px-3 py-2 text-xs font-medium text-quegym-primary hover:border-quegym-accent"
      }
    >
      Comparar{count > 0 ? ` (${count})` : ""}
    </Link>
  );
}
