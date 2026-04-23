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
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
      <p className="mb-3 text-sm font-medium">
        ¿Qué tan claro fue pedir información?
      </p>
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={sent}
            onClick={() => vote(n)}
            className="rounded-lg border border-neutral-300 px-3 py-1 text-sm hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-600 dark:hover:bg-neutral-800"
          >
            {n}
          </button>
        ))}
      </div>
      {sent ? (
        <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
          Gracias por tu respuesta.
        </p>
      ) : (
        <p className="mt-2 text-xs text-neutral-500">1 = poco · 5 = muy claro</p>
      )}
    </div>
  );
}
