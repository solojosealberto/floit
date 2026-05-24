import type { ReactNode } from "react";

export function UIEmptyState(props: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-dashed border-neutral-300 px-4 py-8 text-center dark:border-neutral-700">
      <p className="text-sm font-medium text-neutral-700 dark:text-neutral-200">
        {props.title}
      </p>
      {props.description ? (
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          {props.description}
        </p>
      ) : null}
      {props.action ? <div className="mt-4">{props.action}</div> : null}
    </div>
  );
}

