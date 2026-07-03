"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TierBadge } from "@/components/ui/TierBadge";
import { requestSatisfied, repeatScoreOf, type Team } from "@/lib/randomizer";
import type { MatchRequest, PlayerProfile, PlayerSessionStats } from "@/lib/types";

export function ProposedRoundSheet({
  courtLabel,
  initialTeams,
  eligiblePool,
  playersById,
  playerStats,
  pendingRequests,
  timingWarning,
  skillBalanceMode,
  onConfirm,
  onClose,
}: {
  courtLabel: string;
  initialTeams: [Team, Team];
  eligiblePool: string[];
  playersById: Record<string, PlayerProfile>;
  playerStats: Record<string, PlayerSessionStats>;
  pendingRequests: MatchRequest[];
  timingWarning: string | null;
  skillBalanceMode: boolean;
  onConfirm: (players: [string, string, string, string], teams: [Team, Team]) => void;
  onClose: () => void;
}) {
  const [teams, setTeams] = useState<[Team, Team]>(initialTeams);
  const [swapping, setSwapping] = useState<{ teamIndex: 0 | 1; slotIndex: 0 | 1 } | null>(null);

  const players = [...teams[0], ...teams[1]] as [string, string, string, string];
  const bench = eligiblePool.filter((id) => !players.includes(id));
  const nameOf = (id: string) => playersById[id]?.name ?? "?";
  const repeatScore = repeatScoreOf(playerStats, teams);
  const honored = pendingRequests.filter((r) => requestSatisfied(r, players, teams));
  const hasUnratedPlayer = players.some((id) => !playersById[id]?.tier);

  const swapTo = (replacementId: string) => {
    if (!swapping) return;
    setTeams((prev) => {
      const next: [Team, Team] = [[...prev[0]] as Team, [...prev[1]] as Team];
      next[swapping.teamIndex][swapping.slotIndex] = replacementId;
      return next;
    });
    setSwapping(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full overflow-y-auto rounded-t-2xl border-t border-hairline bg-ink-raised p-4"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-hairline" />
        <h3 className="font-display text-xl tracking-wide text-line">
          NEXT ROUND &middot; {courtLabel.toUpperCase()}
        </h3>

        {timingWarning && (
          <div className="mt-2 rounded-lg border border-shuttle/40 bg-shuttle/10 px-3 py-2 text-xs font-medium text-shuttle">
            {timingWarning}
          </div>
        )}

        <div className="mt-3 flex gap-2">
          {teams.map((team, teamIndex) => (
            <div key={teamIndex} className="flex-1 rounded-xl bg-ink-overlay p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-line-dim">
                Team {teamIndex === 0 ? "A" : "B"}
              </p>
              <div className="flex flex-col gap-2">
                {team.map((id, slotIndex) => (
                  <button
                    key={slotIndex}
                    onClick={() =>
                      setSwapping({ teamIndex: teamIndex as 0 | 1, slotIndex: slotIndex as 0 | 1 })
                    }
                    className={`flex items-center gap-2 rounded-lg px-2 py-2 text-left ${
                      swapping?.teamIndex === teamIndex && swapping?.slotIndex === slotIndex
                        ? "bg-court-bright/30"
                        : "bg-ink-raised"
                    }`}
                  >
                    <TierBadge tier={playersById[id]?.tier} />
                    <span className="min-w-0 flex-1 truncate text-sm text-line">{nameOf(id)}</span>
                    <span className="text-xs text-line-dim">⇄</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {swapping && (
          <div className="mt-3 rounded-xl border border-hairline p-3">
            <p className="mb-2 text-xs font-medium text-line-dim">
              Swap in for {nameOf(teams[swapping.teamIndex][swapping.slotIndex])}:
            </p>
            {bench.length === 0 ? (
              <p className="text-xs text-line-dim">No one else is eligible right now.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {bench.map((id) => (
                  <button
                    key={id}
                    onClick={() => swapTo(id)}
                    className="rounded-full bg-ink-overlay px-3 py-1.5 text-xs font-medium text-line"
                  >
                    {nameOf(id)}
                  </button>
                ))}
              </div>
            )}
            <Button variant="ghost" className="mt-2 px-2 py-1 text-xs" onClick={() => setSwapping(null)}>
              Cancel swap
            </Button>
          </div>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          <Chip tone={repeatScore === 0 ? "in" : "neutral"}>
            {repeatScore === 0 ? "All fresh pairings" : `Repeat score ${repeatScore}`}
          </Chip>
          {honored.map((r) => (
            <Chip key={r.id} tone="shuttle">
              Honors {nameOf(r.fromPlayerId)} {r.kind} {nameOf(r.targetPlayerId)}
            </Chip>
          ))}
          {skillBalanceMode && hasUnratedPlayer && (
            <Chip tone="neutral">Partial skill balance &middot; unrated player seated normally</Chip>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Cancel
          </Button>
          <Button fullWidth onClick={() => onConfirm(players, teams)}>
            Confirm &amp; Start
          </Button>
        </div>
      </div>
    </div>
  );
}
