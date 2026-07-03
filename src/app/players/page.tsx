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
  const courts = useConfigStore((s) => s.courts);
  const playerStats = useSessionStore((s) => s.playerStats);
  const rounds = useSessionStore((s) => s.rounds);
  const hasActiveSession = useSessionStore((s) => Boolean(s.session && !s.session.endedAt));

  // Players seated in an in-progress round get pulled into their own
  // section further down, with their court + how-long-they've-been-on
  // attached, and disappear from the regular roster list while playing.
  const playingInfo: Record<string, { courtLabel: string; since: number }> = {};
  for (const round of rounds) {
    if (round.status !== "in-progress") continue;
    const courtLabel = courts.find((c) => c.id === round.courtId)?.label ?? "Court";
    for (const playerId of round.players) {
      playingInfo[playerId] = { courtLabel, since: round.startedAt };
    }
  }

  const roster = players.filter((p) => !playingInfo[p.id]);
  const playing = players.filter((p) => playingInfo[p.id]);

  const sorted = hasActiveSession
    ? [...roster].sort((a, b) => {
        const sa = playerStats[a.id]?.status ?? "not-arrived";
        const sb = playerStats[b.id]?.status ?? "not-arrived";
        return STATUS_ORDER[sa] - STATUS_ORDER[sb];
      })
    : roster;

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

      {playing.length > 0 && (
        <div className="mb-3">
          <h2 className="mb-2 font-display text-xl tracking-wide text-in">
            PLAYING NOW ({playing.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {playing.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                playingOnCourtLabel={playingInfo[p.id].courtLabel}
                playingSince={playingInfo[p.id].since}
              />
            ))}
          </ul>
        </div>
      )}

      {sorted.length === 0 ? (
        playing.length === 0 && (
          <EmptyState
            title="No players yet"
            hint="Add everyone on your roster — you'll only need to do this once."
          />
        )
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
