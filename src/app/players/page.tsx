"use client";

import { AddPlayerForm } from "@/components/players/AddPlayerForm";
import { PlayerRow } from "@/components/players/PlayerRow";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";

const STATUS_ORDER = { present: 0, resting: 1, "not-arrived": 2 } as const;

export default function PlayersPage() {
  const players = useConfigStore((s) => s.players);
  const playerStats = useSessionStore((s) => s.playerStats);
  const hasActiveSession = useSessionStore((s) => Boolean(s.session && !s.session.endedAt));

  const sorted = hasActiveSession
    ? [...players].sort((a, b) => {
        const sa = playerStats[a.id]?.status ?? "not-arrived";
        const sb = playerStats[b.id]?.status ?? "not-arrived";
        return STATUS_ORDER[sa] - STATUS_ORDER[sb];
      })
    : players;

  const presentCount = players.filter(
    (p) => (playerStats[p.id]?.status ?? "not-arrived") !== "not-arrived",
  ).length;

  return (
    <main className="flex-1 px-4">
      <SectionHeader
        title="Players"
        action={
          hasActiveSession && (
            <span className="pb-1 text-xs font-medium text-line-dim">
              {presentCount}/{players.length} here
            </span>
          )
        }
      />

      <div className="mb-3">
        <AddPlayerForm />
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          title="No players yet"
          hint="Add everyone on your roster — you'll only need to do this once."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {sorted.map((p) => (
            <PlayerRow key={p.id} player={p} />
          ))}
        </ul>
      )}
    </main>
  );
}
