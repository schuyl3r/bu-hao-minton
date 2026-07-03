"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TierBadge } from "@/components/ui/TierBadge";
import { CourtTimer } from "@/components/courts/CourtTimer";
import { FinishRoundSheet } from "@/components/courts/FinishRoundSheet";
import { ProposedRoundSheet } from "@/components/courts/ProposedRoundSheet";
import { generateRound, requestSatisfied, type Team } from "@/lib/randomizer";
import { useSessionStore } from "@/lib/store/sessionStore";
import type {
  CourtProfile,
  CourtSessionState,
  MatchRequest,
  PlayerProfile,
  PlayerSessionStats,
  Round,
  Tier,
} from "@/lib/types";

export function CourtCard({
  court,
  courtState,
  round,
  playersById,
  playerStats,
  playerTiers,
  eligiblePlayerIds,
  pendingRequests,
  catchUpMode,
  skillBalanceMode,
  estimatedMinutesPerGame,
}: {
  court: CourtProfile;
  courtState: CourtSessionState | undefined;
  round: Round | undefined;
  playersById: Record<string, PlayerProfile>;
  playerStats: Record<string, PlayerSessionStats>;
  playerTiers: Record<string, Tier | undefined>;
  eligiblePlayerIds: string[];
  pendingRequests: MatchRequest[];
  catchUpMode: boolean;
  skillBalanceMode: boolean;
  estimatedMinutesPerGame: number;
}) {
  const startRound = useSessionStore((s) => s.startRound);
  const finishRound = useSessionStore((s) => s.finishRound);
  const cancelRound = useSessionStore((s) => s.cancelRound);

  const [proposal, setProposal] = useState<{
    players: [string, string, string, string];
    teams: [Team, Team];
  } | null>(null);
  const [notEnough, setNotEnough] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [timingWarning, setTimingWarning] = useState<string | null>(null);

  const nameOf = (id: string) => playersById[id]?.name ?? "?";

  const openProposal = () => {
    // Date.now() is read here, inside an event handler, rather than during
    // render — computing "time remaining" during render would be an impure
    // read of the clock and could produce a stale/inconsistent value.
    if (courtState?.startTime) {
      const remainingMinutes =
        (courtState.startTime + court.durationMinutes * 60000 - Date.now()) / 60000;
      setTimingWarning(
        remainingMinutes < estimatedMinutesPerGame
          ? `Only ~${Math.max(0, Math.round(remainingMinutes))} min left in this court's block — may not be enough for a full game.`
          : null,
      );
    } else {
      setTimingWarning(null);
    }

    const result = generateRound({
      eligiblePlayerIds,
      playerStats,
      playerTiers,
      pendingRequests,
      catchUpMode,
      skillBalanceMode,
    });
    if (!result.ok) {
      setNotEnough(true);
      return;
    }
    setNotEnough(false);
    setProposal({ players: result.players, teams: result.teams });
  };

  return (
    <div className="rounded-xl border border-hairline bg-ink-raised p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-2xl tracking-wide text-line">{court.label.toUpperCase()}</p>
        <span className="text-xs text-line-dim">{court.durationMinutes} min block</span>
      </div>

      {/* The court's block clock runs continuously from its first-ever round
          to block end, independent of whether a round is in progress right
          now — so it's shown here regardless of `round`, not nested inside
          the in-progress branch below. */}
      {courtState?.startTime && (
        <div className="mt-1">
          <CourtTimer startTime={courtState.startTime} durationMinutes={court.durationMinutes} />
        </div>
      )}

      {round ? (
        <>
          <div className="mt-2 flex flex-wrap gap-2">
            {round.teams.map((team, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded-lg bg-ink-overlay px-2 py-1.5">
                {team.map((pid) => (
                  <span key={pid} className="flex items-center gap-1 text-xs text-line">
                    <TierBadge tier={playersById[pid]?.tier} />
                    {nameOf(pid)}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {!confirmingCancel ? (
            <div className="mt-3 flex gap-2">
              <Button variant="danger" className="flex-1" onClick={() => setConfirmingCancel(true)}>
                Cancel
              </Button>
              <Button className="flex-[2]" onClick={() => setFinishing(true)}>
                Finish Round
              </Button>
            </div>
          ) : (
            <div className="mt-3 rounded-lg border border-bench/40 bg-bench/10 p-3">
              <p className="text-xs font-medium text-bench">
                Cancel this round? All 4 players return to the queue and nothing is recorded.
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" fullWidth onClick={() => setConfirmingCancel(false)}>
                  Back
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    cancelRound(round.id);
                    setConfirmingCancel(false);
                  }}
                >
                  Cancel Round
                </Button>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <p className="mt-2 text-sm text-line-dim">Free</p>
          {notEnough && (
            <p className="mt-1 text-xs text-shuttle">
              Not enough eligible players waiting for a full round.
            </p>
          )}
          <Button variant="secondary" fullWidth className="mt-3" onClick={openProposal}>
            Next Round
          </Button>
        </>
      )}

      {proposal && (
        <ProposedRoundSheet
          courtLabel={court.label}
          initialTeams={proposal.teams}
          eligiblePool={eligiblePlayerIds}
          playersById={playersById}
          playerStats={playerStats}
          pendingRequests={pendingRequests}
          timingWarning={timingWarning}
          skillBalanceMode={skillBalanceMode}
          onClose={() => setProposal(null)}
          onConfirm={(players, teams) => {
            const honoredIds = pendingRequests
              .filter((r) => requestSatisfied(r, players, teams))
              .map((r) => r.id);
            startRound(court.id, players, teams, honoredIds);
            setProposal(null);
          }}
        />
      )}

      {finishing && round && (
        <FinishRoundSheet
          courtLabel={court.label}
          onClose={() => setFinishing(false)}
          onFinish={(shuttlecocksUsed) => {
            finishRound(round.id, shuttlecocksUsed);
            setFinishing(false);
          }}
        />
      )}
    </div>
  );
}
