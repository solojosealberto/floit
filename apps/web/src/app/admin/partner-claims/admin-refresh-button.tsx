"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";

export function AdminRefreshButton(props: {
  className?: string;
  children?: ReactNode;
  label?: string;
}) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className={props.className}
      aria-label={props.label ?? "Actualizar datos"}
    >
      {props.children ?? (
        <>
          <svg className="mr-1.5 inline h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Actualizar
        </>
      )}
    </button>
  );
}
