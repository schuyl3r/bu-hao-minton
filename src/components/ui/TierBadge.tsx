import type { Tier } from "@/lib/types";

const SIZE_CLASSES = {
  sm: "h-7 w-7 text-sm",
  md: "h-10 w-10 text-base",
} as const;

export function TierBadge({
  tier,
  avatar,
  size = "sm",
}: {
  tier?: Tier;
  avatar?: string;
  size?: keyof typeof SIZE_CLASSES;
}) {
  if (avatar) {
    return (
      <span className={`flex shrink-0 overflow-hidden rounded-full ${SIZE_CLASSES[size]}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- locally
            generated data URL, not a remote/static asset next/image can
            usefully optimize */}
        <img src={avatar} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  if (!tier) {
    return (
      <span
        className={`flex shrink-0 items-center justify-center rounded-full border border-dashed border-hairline font-semibold text-line-dim ${SIZE_CLASSES[size]} ${size === "sm" ? "text-[10px]" : "text-xs"}`}
      >
        ?
      </span>
    );
  }
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-line ${SIZE_CLASSES[size]}`}
    >
      {tier}
    </span>
  );
}
