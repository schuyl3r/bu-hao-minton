"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSessionStore } from "@/lib/store/sessionStore";

export function StartSessionForm() {
  const session = useSessionStore((s) => s.session);
  const startNewSession = useSessionStore((s) => s.startNewSession);
  const [defaultDuration, setDefaultDuration] = useState(120);
  const [estimatedPerGame, setEstimatedPerGame] = useState(20);
  const [confirming, setConfirming] = useState(false);

  const hasUnfinishedSession = Boolean(session && !session.endedAt);

  const start = () => {
    startNewSession({
      defaultDurationMinutes: defaultDuration,
      estimatedMinutesPerGame: estimatedPerGame,
    });
    setConfirming(false);
  };

  return (
    <div className="rounded-xl border border-hairline bg-ink-raised p-4">
      <p className="text-[15px] font-semibold text-line">
        {session ? "Start another session" : "Start your first session"}
      </p>
      <p className="mt-1 text-xs text-line-dim">
        Your player roster carries over. Attendance, games played, and pairing
        history all start fresh.
      </p>

      <label className="mt-3 block text-xs font-medium text-line-dim">
        Default court duration (minutes)
      </label>
      <input
        type="number"
        min={1}
        value={defaultDuration}
        onChange={(e) => setDefaultDuration(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line focus:outline-none"
      />

      <label className="mt-3 block text-xs font-medium text-line-dim">
        Estimated minutes per game
      </label>
      <input
        type="number"
        min={1}
        value={estimatedPerGame}
        onChange={(e) => setEstimatedPerGame(Number(e.target.value) || 0)}
        className="mt-1 w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line focus:outline-none"
      />
      <p className="mt-1 text-[11px] text-line-dim">
        Used only to warn when a court is running low on time before its block ends.
      </p>

      {!confirming ? (
        <Button
          fullWidth
          className="mt-4"
          onClick={() => (hasUnfinishedSession ? setConfirming(true) : start())}
        >
          Start New Session
        </Button>
      ) : (
        <div className="mt-4 rounded-lg border border-bench/40 bg-bench/10 p-3">
          <p className="text-sm font-medium text-bench">
            This ends the current session and clears its rounds, attendance, and
            pairing history. Export its PDF first if you need it.
          </p>
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setConfirming(false)}>
              Cancel
            </Button>
            <Button variant="danger" fullWidth onClick={start}>
              Start anyway
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
