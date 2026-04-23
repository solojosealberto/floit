"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  claimId: string;
  currentStatus: "pending_review" | "approved" | "rejected";
};

export function ClaimStatusActions({ claimId, currentStatus }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<"approved" | "rejected" | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(nextStatus: "approved" | "rejected") {
    if (currentStatus === nextStatus) return;
    setBusy(nextStatus);
    setErr(null);
    try {
      const res = await fetch(`/api/admin/partner/claims/${encodeURIComponent(claimId)}/status`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) {
        setErr(`HTTP ${res.status}`);
        return;
      }
      router.refresh();
    } catch {
      setErr("network_error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={busy != null || currentStatus === "approved"}
          onClick={() => void submit("approved")}
          className="rounded border border-emerald-300 px-2 py-1 text-xs text-emerald-700 disabled:opacity-50 dark:border-emerald-700 dark:text-emerald-400"
        >
          {busy === "approved" ? "..." : "Aprobar"}
        </button>
        <button
          type="button"
          disabled={busy != null || currentStatus === "rejected"}
          onClick={() => void submit("rejected")}
          className="rounded border border-red-300 px-2 py-1 text-xs text-red-700 disabled:opacity-50 dark:border-red-700 dark:text-red-400"
        >
          {busy === "rejected" ? "..." : "Rechazar"}
        </button>
      </div>
      {err ? <span className="text-[11px] text-red-600 dark:text-red-400">{err}</span> : null}
    </div>
  );
}
