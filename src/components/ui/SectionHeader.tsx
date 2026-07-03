import type { ReactNode } from "react";

export function SectionHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="court-rule mb-3 flex items-end justify-between pt-4">
      <h2 className="font-display text-2xl tracking-wide text-line">
        {title.toUpperCase()}
      </h2>
      {action}
    </div>
  );
}
