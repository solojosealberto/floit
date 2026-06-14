"use client";

import { useState } from "react";
import { trackEvent } from "@/lib/track";

export function LeadSurvey() {
  const [sent, setSent] = useState(false);

  function vote(score: number) {
    if (sent) return;
    trackEvent("lead_survey", { score });
    setSent(true);
  }

  return (
    <div className="qg-surface-subtle qg-motion rounded-xl border border-quegym-border bg-quegym-subtle px-4 py-4">
      <p className="mb-3 text-sm font-medium text-quegym-primary">
        ¿Qué tan claro fue pedir información?
      </p>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={sent}
            onClick={() => vote(n)}
            className="qg-btn-ghost qg-motion rounded-lg border border-quegym-border bg-quegym-elevated px-3 py-1 text-sm text-quegym-primary disabled:opacity-50"
          >
            {n}
          </button>
        ))}
      </div>
      {sent ? (
        <p className="mt-2 text-sm text-quegym-secondary">Gracias por tu respuesta.</p>
      ) : (
        <p className="mt-2 text-xs text-quegym-secondary">1 = poco · 5 = muy claro</p>
      )}
    </div>
  );
}
