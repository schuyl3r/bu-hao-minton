"use client";

import { useEffect, useState } from "react";

function formatRemaining(ms: number) {
  const overtime = ms < 0;
  const totalSeconds = Math.floor(Math.abs(ms) / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const body = h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}` : `${m}:${String(s).padStart(2, "0")}`;
  return overtime ? `+${body}` : body;
}

export function CourtTimer({
  startTime,
  durationMinutes,
}: {
  startTime: number;
  durationMinutes: number;
}) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (now === null) {
    return <span className="font-display text-3xl tracking-wide text-line-dim">&ndash;&ndash;:&ndash;&ndash;</span>;
  }

  const remainingMs = startTime + durationMinutes * 60000 - now;
  const overtime = remainingMs < 0;

  return (
    <span
      className={`font-display text-3xl tracking-wide tabular-nums ${overtime ? "text-bench" : "text-line"}`}
    >
      {formatRemaining(remainingMs)}
    </span>
  );
}
