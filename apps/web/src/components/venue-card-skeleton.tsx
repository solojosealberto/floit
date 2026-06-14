/** Skeleton de tarjeta venue (paridad con VenueCardGrid). */
export function VenueCardSkeleton() {
  return (
    <article
      className="qg-surface overflow-hidden rounded-2xl border border-quegym-border bg-quegym-elevated motion-safe:animate-pulse"
      aria-hidden
    >
      <div className="aspect-[3/1] w-full bg-quegym-input md:aspect-[16/9]" />
      <div className="space-y-2 p-3">
        <div className="h-4 w-3/4 rounded bg-quegym-input" />
        <div className="h-3 w-1/2 rounded bg-quegym-input" />
        <div className="flex gap-1">
          <div className="h-5 w-12 rounded-md bg-quegym-input" />
          <div className="h-5 w-14 rounded-md bg-quegym-input" />
        </div>
        <div className="h-8 w-24 rounded bg-quegym-input" />
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="h-9 rounded-xl bg-quegym-input" />
          <div className="h-9 rounded-xl bg-quegym-input" />
        </div>
      </div>
    </article>
  );
}

export function VenueCardSkeletonGrid({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <VenueCardSkeleton key={i} />
      ))}
    </>
  );
}

/** Skeleton fila horizontal (lista / mapa móvil). */
export function VenueListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="flex gap-3 rounded-2xl border border-quegym-border bg-quegym-elevated p-3 motion-safe:animate-pulse"
          aria-hidden
        >
          <div className="h-20 w-24 shrink-0 rounded-xl bg-quegym-input" />
          <div className="flex flex-1 flex-col gap-2 py-0.5">
            <div className="h-4 w-2/3 rounded bg-quegym-input" />
            <div className="h-3 w-1/2 rounded bg-quegym-input" />
            <div className="h-6 w-20 rounded bg-quegym-input" />
          </div>
        </div>
      ))}
    </>
  );
}
