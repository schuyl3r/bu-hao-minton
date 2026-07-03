export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-hairline px-4 py-8 text-center">
      <p className="text-sm font-medium text-line-dim">{title}</p>
      {hint && <p className="mt-1 text-xs text-line-dim/70">{hint}</p>}
    </div>
  );
}
