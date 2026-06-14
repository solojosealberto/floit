import type { ReactNode } from "react";

export function UIEmptyState(props: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--qg-border)] px-4 py-8 text-center">
      <p className="text-sm font-medium text-[var(--qg-text-primary)]">
        {props.title}
      </p>
      {props.description ? (
        <p className="mt-1 text-sm text-[var(--qg-text-secondary)]">
          {props.description}
        </p>
      ) : null}
      {props.action ? <div className="mt-4">{props.action}</div> : null}
    </div>
  );
}
