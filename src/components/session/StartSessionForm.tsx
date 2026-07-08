"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ToggleRow } from "@/components/ui/ToggleRow";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";

export function StartSessionForm() {
  const session = useSessionStore((s) => s.session);
  const startNewSession = useSessionStore((s) => s.startNewSession);
  const existingPlayerCount = useConfigStore((s) => s.players.length);
  const existingCourtCount = useConfigStore((s) => s.courts.length);

  const [courtCount, setCourtCount] = useState(String(Math.max(existingCourtCount, 2)));
  const [totalHours, setTotalHours] = useState("2");
  const [catchUpMode, setCatchUpMode] = useState(false);
  const [skillBalanceMode, setSkillBalanceMode] = useState(false);

  // This form is only ever rendered when there's no active session (the
  // Session page hides it otherwise), so starting here never overwrites an
  // in-progress session — no confirmation step needed.
  const start = () => {
    startNewSession({
      totalHours: Number(totalHours) || 0.5,
      courtCount: Number(courtCount) || 1,
      catchUpMode,
      skillBalanceMode,
    });
  };

  return (
    <div className="rounded-xl border border-hairline bg-ink-raised p-4">
      <p className="text-[15px] font-semibold text-line">
        {session ? "Start another session" : "Start your first session"}
      </p>
      <p className="mt-1 text-xs text-line-dim">
        Your player roster carries over
        {existingPlayerCount > 0
          ? ` (${existingPlayerCount} player${existingPlayerCount === 1 ? "" : "s"} saved)`
          : ""}
        . Attendance, games played, and pairing history all start fresh — pick who&rsquo;s here
        from the Players tab once the session starts.
      </p>

      <label className="mt-3 block text-xs font-medium text-line-dim">Courts</label>
      <input
        type="number"
        min={1}
        inputMode="numeric"
        value={courtCount}
        onChange={(e) => setCourtCount(e.target.value)}
        className="mt-1 w-32 rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line focus:outline-none"
      />
      <p className="mt-1 text-[11px] text-line-dim">
        Only adds court slots to reach this count — your existing courts are never duplicated.
      </p>

      <label className="mt-3 block text-xs font-medium text-line-dim">Total hours</label>
      <input
        type="number"
        min={0.5}
        step={0.5}
        inputMode="decimal"
        value={totalHours}
        onChange={(e) => setTotalHours(e.target.value)}
        className="mt-1 w-32 rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line focus:outline-none"
      />
      <p className="mt-1 text-[11px] text-line-dim">
        Just a label for your own reference — not tied to any timer or warning.
      </p>

      <div className="mt-3 divide-y divide-hairline border-t border-hairline">
        <ToggleRow
          label="Catch-up mode"
          hint="Weight players with fewer games higher for the next round"
          checked={catchUpMode}
          onChange={setCatchUpMode}
        />
        <ToggleRow
          label="Skill tier balance"
          hint="Balance team totals, not individual matchups"
          checked={skillBalanceMode}
          onChange={setSkillBalanceMode}
        />
      </div>

      <Button fullWidth className="mt-4" onClick={start}>
        Start New Session
      </Button>
    </div>
  );
}
