"use client";

import { useEffect, useState } from "react";

/**
 * Ticks once a second off a fixed `since` timestamp. Starts at `null` and
 * only ever calls Date.now() inside the interval callback — never
 * synchronously in the effect body or during render — so this can't cause
 * an SSR/client hydration mismatch or trip the render-purity lint rule.
 */
function useElapsedMs(since: number): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return now === null ? null : now - since;
}

function formatClock(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${m}:${String(s).padStart(2, "0")}`;
}

function formatCompact(ms: number) {
  const mins = Math.floor(ms / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function LiveElapsed({
  since,
  format = "clock",
  className = "",
}: {
  since: number;
  format?: "clock" | "compact";
  className?: string;
}) {
  const elapsed = useElapsedMs(since);

  if (elapsed === null) {
    return <span className={className}>{format === "clock" ? "0:00" : "0m"}</span>;
  }

  return (
    <span className={`tabular-nums ${className}`}>
      {format === "clock" ? formatClock(elapsed) : formatCompact(elapsed)}
    </span>
  );
}
