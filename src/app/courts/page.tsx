"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { TierBadge } from "@/components/ui/TierBadge";
import { CourtCard } from "@/components/courts/CourtCard";
import { getEligiblePlayerIds } from "@/lib/eligibility";
import { averageGamesPlayed, gamesPlayedColorClass } from "@/lib/stats";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";

export default function CourtsPage() {
  const courts = useConfigStore((s) => s.courts);
  const players = useConfigStore((s) => s.players);
  const session = useSessionStore((s) => s.session);
  const courtStates = useSessionStore((s) => s.courtStates);
  const playerStats = useSessionStore((s) => s.playerStats);
  const rounds = useSessionStore((s) => s.rounds);
  const requests = useSessionStore((s) => s.requests);

  const hasActiveSession = Boolean(session && !session.endedAt);

  if (!hasActiveSession) {
    return (
      <main className="flex-1 px-4">
        <SectionHeader title="Courts" />
        <EmptyState
          title="No session running"
          hint="Start a session from the Session tab to begin queuing rounds."
        />
        <Link href="/" className="mt-3 block">
          <Button fullWidth>Go to Session</Button>
        </Link>
      </main>
    );
  }

  const playersById = Object.fromEntries(players.map((p) => [p.id, p]));
  const playerTiers = Object.fromEntries(players.map((p) => [p.id, p.tier]));
  const eligiblePlayerIds = getEligiblePlayerIds(playerStats, rounds);
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const waiting = eligiblePlayerIds
    .map((id) => playersById[id])
    .filter(Boolean)
    .sort((a, b) => (playerStats[a.id]?.gamesPlayed ?? 0) - (playerStats[b.id]?.gamesPlayed ?? 0));

  const avgGames = averageGamesPlayed(playerStats);

  return (
    <main className="flex-1 px-4">
      <SectionHeader title="Courts" />

      {courts.length === 0 ? (
        <EmptyState title="No courts yet" hint="Add courts from the Session tab." />
      ) : (
        <div className="flex animate-reveal flex-col gap-3">
          {courts.map((c) => {
            const state = courtStates[c.id];
            const round = state?.currentRoundId
              ? rounds.find((r) => r.id === state.currentRoundId)
              : undefined;
            return (
              <CourtCard
                key={c.id}
                court={c}
                round={round}
                playersById={playersById}
                playerStats={playerStats}
                playerTiers={playerTiers}
                eligiblePlayerIds={eligiblePlayerIds}
                pendingRequests={pendingRequests}
                catchUpMode={session?.catchUpMode ?? false}
                skillBalanceMode={session?.skillBalanceMode ?? false}
              />
            );
          })}
        </div>
      )}

      <h2 className="mb-2 mt-5 font-display text-xl tracking-wide text-line">
        WAITING ({waiting.length})
      </h2>
      {waiting.length === 0 ? (
        <EmptyState title="Nobody waiting" />
      ) : (
        <ul className="flex animate-reveal flex-col gap-2">
          {waiting.map((p) => {
            const gamesPlayed = playerStats[p.id]?.gamesPlayed ?? 0;
            return (
              <li
                key={p.id}
                className="flex items-center gap-3 rounded-xl border border-hairline bg-ink-raised px-3 py-2 transition-colors"
              >
                <TierBadge tier={p.tier} avatar={p.avatar} />
                <span className="flex-1 truncate text-[15px] text-line">{p.name}</span>
                <span className="flex items-baseline gap-1">
                  <span
                    className={`font-display text-lg font-bold leading-none tabular-nums ${gamesPlayedColorClass(gamesPlayed, avgGames)}`}
                  >
                    {gamesPlayed}
                  </span>
                  <span className="text-xs text-line-dim">
                    game{gamesPlayed === 1 ? "" : "s"}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
