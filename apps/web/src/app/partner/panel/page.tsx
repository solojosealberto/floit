"use client";

import { Suspense } from "react";
import { PartnerPanelClient } from "../partner-panel-client";

function PartnerPanelFallback() {
  return (
    <main className="mx-auto flex min-h-[40vh] max-w-4xl items-center justify-center px-4">
      <p className="text-sm text-quegym-secondary">Cargando panel…</p>
    </main>
  );
}

export default function PartnerPanelPage() {
  return (
    <Suspense fallback={<PartnerPanelFallback />}>
      <PartnerPanelClient variant="partner" />
    </Suspense>
  );
}
