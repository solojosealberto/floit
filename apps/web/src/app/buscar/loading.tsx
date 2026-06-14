import { VenueCardSkeletonGrid } from "@/components/venue-card-skeleton";

/** Skeleton de `/buscar` durante navegación (filtros, sort). */
export default function BuscarLoading() {
  return (
    <div className="mx-auto max-w-[1280px] px-3 py-3">
      <div className="qg-surface overflow-hidden rounded-2xl border border-quegym-border bg-quegym-elevated">
        <div className="border-b border-quegym-border px-4 py-3">
          <div className="h-10 max-w-xl animate-pulse rounded-xl bg-quegym-input motion-safe:animate-pulse" />
        </div>
        <div className="border-b border-quegym-border px-4 py-3">
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 4 }, (_, i) => (
              <div
                key={i}
                className="h-7 w-24 animate-pulse rounded-full bg-quegym-input motion-safe:animate-pulse"
              />
            ))}
          </div>
        </div>
        <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
          <VenueCardSkeletonGrid count={6} />
        </div>
      </div>
    </div>
  );
}
