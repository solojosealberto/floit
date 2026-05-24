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
      className="rounded-xl border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
    >
      Favoritos ({count})
    </Link>
  );
}
