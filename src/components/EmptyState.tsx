import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-10 text-center">
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-mist">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </div>
  );
}
