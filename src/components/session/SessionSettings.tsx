"use client";

import { ToggleRow } from "@/components/ui/ToggleRow";
import { useSessionStore } from "@/lib/store/sessionStore";

export function SessionSettings() {
  const session = useSessionStore((s) => s.session);
  const setCatchUpMode = useSessionStore((s) => s.setCatchUpMode);
  const setSkillBalanceMode = useSessionStore((s) => s.setSkillBalanceMode);

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
    </div>
  );
}
