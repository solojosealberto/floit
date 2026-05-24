"use client";

import { UIButton } from "@floit/ui";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  claimId: string;
  currentStatus: "pending_review" | "approved" | "rejected";
  /** Called after aprove/rechazo exitoso (p. ej. cerrar modal de detalle). */
  onResolved?: () => void;
};

export function ClaimStatusActions({ claimId, currentStatus, onResolved }: Props) {
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
        const data = (await res.json().catch(() => ({}))) as {
          message?: string | string[];
        };
        const msg = Array.isArray(data.message)
          ? data.message.join(", ")
          : typeof data.message === "string"
            ? data.message
            : "";
        setErr(msg || `HTTP ${res.status}`);
        return;
      }
      router.refresh();
      onResolved?.();
    } catch {
      setErr("network_error");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <UIButton
          type="button"
          disabled={busy != null || currentStatus === "approved"}
          onClick={() => void submit("approved")}
          variant="secondary"
          size="sm"
        >
          {busy === "approved" ? "..." : "Aprobar"}
        </UIButton>
        <UIButton
          type="button"
          disabled={busy != null || currentStatus === "rejected"}
          onClick={() => void submit("rejected")}
          variant="secondary"
          size="sm"
        >
          {busy === "rejected" ? "..." : "Rechazar"}
        </UIButton>
      </div>
      {err ? <span className="text-[11px] font-medium text-red-700">{err}</span> : null}
    </div>
  );
}
