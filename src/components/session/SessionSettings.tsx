"use client";

import { ToggleRow } from "@/components/ui/ToggleRow";
import { useSessionStore } from "@/lib/store/sessionStore";

export function SessionSettings() {
  const session = useSessionStore((s) => s.session);
  const setCatchUpMode = useSessionStore((s) => s.setCatchUpMode);
  const setSkillBalanceMode = useSessionStore((s) => s.setSkillBalanceMode);
  const setEstimatedMinutesPerGame = useSessionStore((s) => s.setEstimatedMinutesPerGame);

  if (!session) return null;

  return (
    <div className="divide-y divide-hairline rounded-xl border border-hairline bg-ink-raised px-4">
      <ToggleRow
        label="Catch-up mode"
        hint="Weight players with fewer games higher for the next round"
        checked={session.catchUpMode}
        onChange={setCatchUpMode}
      />
      <ToggleRow
        label="Skill tier balance"
        hint="Balance team totals, not individual matchups"
        checked={session.skillBalanceMode}
        onChange={setSkillBalanceMode}
      />
      <div className="py-2.5">
        <label className="text-[15px] font-medium text-line">
          Estimated minutes per game
        </label>
        <p className="text-xs text-line-dim">
          Used to warn when a court won&apos;t have time for one more full game
        </p>
        <input
          type="number"
          min={1}
          value={session.estimatedMinutesPerGame}
          onChange={(e) => setEstimatedMinutesPerGame(Number(e.target.value) || 0)}
          className="mt-2 w-24 rounded-lg bg-ink-overlay px-3 py-2 text-base text-line focus:outline-none"
        />
      </div>
    </div>
  );
}
