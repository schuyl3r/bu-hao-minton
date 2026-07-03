import type { Tier } from "@/lib/types";

export function TierBadge({ tier }: { tier?: Tier }) {
  if (!tier) {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-dashed border-hairline text-[10px] font-semibold text-line-dim">
        ?
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-court text-sm font-bold text-line">
      {tier}
    </span>
  );
}
