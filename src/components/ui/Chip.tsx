import type { ReactNode } from "react";

type Tone = "neutral" | "in" | "bench" | "shuttle" | "court";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "bg-ink-overlay text-line-dim",
  in: "bg-in/15 text-in",
  bench: "bg-bench/15 text-bench",
  shuttle: "bg-shuttle/15 text-shuttle",
  court: "bg-court-bright/20 text-court-bright",
};

export function Chip({
  children,
  tone = "neutral",
  className = "",
}: {
  children: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${TONE_CLASSES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
