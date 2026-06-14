"use client";

import { Suspense } from "react";
import { PartnerPanelClient } from "@/app/partner/partner-panel-client";

function AdminPanelFallback() {
  return (
    <div className="flex min-h-[200px] items-center justify-center text-sm text-quegym-secondary">
      Cargando panel…
    </div>
  );
}

export function AdminCatalogVenuePanelSection(props: { venueSlug: string }) {
  return (
    <Suspense fallback={<AdminPanelFallback />}>
      <PartnerPanelClient variant="admin" fixedVenueSlug={props.venueSlug} />
    </Suspense>
  );
}
