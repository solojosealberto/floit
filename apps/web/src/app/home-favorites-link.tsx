"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { readFavoriteSlugs } from "@/lib/floit-favorites";

export function HomeFavoritesLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    setCount(readFavoriteSlugs().length);
    const onFocus = () => setCount(readFavoriteSlugs().length);
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return (
    <Link
      href="/favoritos"
      className="rounded-xl border border-quegym-border px-3 py-2 text-xs font-medium text-quegym-primary hover:border-quegym-accent"
    >
      Favoritos ({count})
    </Link>
  );
}
