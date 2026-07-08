"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { LiveElapsed } from "@/components/ui/LiveElapsed";
import { ShuttleIcon } from "@/components/ui/icons";
import { TierBadge } from "@/components/ui/TierBadge";
import { FinishRoundSheet } from "@/components/courts/FinishRoundSheet";
import { ProposedRoundSheet } from "@/components/courts/ProposedRoundSheet";
import { getQueueablePlayerIds } from "@/lib/eligibility";
import { generateRound, requestSatisfied, type Team } from "@/lib/randomizer";
import { useSessionStore } from "@/lib/store/sessionStore";
import type {
  CourtProfile,
  MatchRequest,
  PlayerProfile,
  PlayerSessionStats,
  Round,
  Tier,
} from "@/lib/types";

export function CourtCard({
  court,
  round,
  queuedRound,
  rounds,
  anyOtherCourtInProgress,
  busyElsewhereLabel,
  playersById,
  playerStats,
  playerTiers,
  eligiblePlayerIds,
  pendingRequests,
  catchUpMode,
  skillBalanceMode,
}: {
  court: CourtProfile;
  round: Round | undefined;
  /** This court's pending queued round, if any (reserving players for its next round). */
  queuedRound: Round | undefined;
  /** Every round this session, needed to build the wider "queue" candidate pool. */
  rounds: Round[];
  /** Whether some OTHER court currently has a round in progress — gates the "Queue next round" action. */
  anyOtherCourtInProgress: boolean;
  /** playerId -> the court label they're currently busy on, for tagging reserved players. */
  busyElsewhereLabel: Record<string, string>;
  playersById: Record<string, PlayerProfile>;
  playerStats: Record<string, PlayerSessionStats>;
  playerTiers: Record<string, Tier | undefined>;
  eligiblePlayerIds: string[];
  pendingRequests: MatchRequest[];
  catchUpMode: boolean;
  skillBalanceMode: boolean;
}) {
  const startRound = useSessionStore((s) => s.startRound);
  const queueRound = useSessionStore((s) => s.queueRound);
  const cancelQueuedRound = useSessionStore((s) => s.cancelQueuedRound);
  const finishRound = useSessionStore((s) => s.finishRound);
  const cancelRound = useSessionStore((s) => s.cancelRound);
  const updateRoundShuttlecocks = useSessionStore((s) => s.updateRoundShuttlecocks);

  const [proposal, setProposal] = useState<{ mode: "start" | "queue"; teams: [Team, Team] } | null>(
    null,
  );
  const [notEnough, setNotEnough] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [confirmingCancel, setConfirmingCancel] = useState(false);

  const nameOf = (id: string) => playersById[id]?.name ?? "?";

  const poolFor = (mode: "start" | "queue") =>
    mode === "queue" ? getQueueablePlayerIds(playerStats, rounds, court.id) : eligiblePlayerIds;

  const rollProposal = (mode: "start" | "queue") => {
    const result = generateRound({
      eligiblePlayerIds: poolFor(mode),
      playerStats,
      playerTiers,
      pendingRequests,
      catchUpMode,
      skillBalanceMode,
    });
    if (!result.ok) {
      setNotEnough(true);
      setProposal(null);
      return;
    }
    setNotEnough(false);
    setProposal({ mode, teams: result.teams });
  };

  const showQueueAction = anyOtherCourtInProgress && !queuedRound;

  return (
    <div className="rounded-xl border border-hairline bg-ink-raised p-4">
      <div className="flex items-center justify-between">
        <p className="font-display text-2xl tracking-wide text-line">{court.label.toUpperCase()}</p>
        {round && (
          <span className="font-display text-2xl tabular-nums tracking-wide text-in">
            <LiveElapsed since={round.startedAt} format="clock" />
          </span>
        )}
      </div>

      {round ? (
        <>
          <div className="mt-3 flex animate-reveal items-stretch gap-2">
            {round.teams.map((team, i) => (
              <div key={i} className="flex-1 rounded-xl bg-ink-overlay p-3">
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-line-dim">
                  Team {i === 0 ? "A" : "B"}
                </p>
                <div className="flex flex-col gap-2.5">
                  {team.map((pid) => (
                    <div key={pid} className="flex items-center gap-2">
                      <TierBadge size="md" tier={playersById[pid]?.tier} avatar={playersById[pid]?.avatar} />
                      <span className="min-w-0 truncate text-[15px] font-semibold text-line">
                        {nameOf(pid)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-2.5 flex items-center justify-between rounded-lg bg-ink-overlay px-3 py-2">
            <span className="flex items-center gap-1.5 text-xs font-medium text-line-dim">
              <ShuttleIcon className="h-4 w-4 text-shuttle" />
              Shuttlecocks
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  updateRoundShuttlecocks(round.id, Math.max(0, (round.shuttlecocksUsed ?? 0) - 1))
                }
                disabled={!round.shuttlecocksUsed}
                aria-label="Decrease shuttlecock count"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-lg font-semibold text-line disabled:opacity-30"
              >
                −
              </button>
              <span className="w-8 text-center font-display text-lg tabular-nums text-line">
                {round.shuttlecocksUsed ?? 0}
              </span>
              <button
                onClick={() => updateRoundShuttlecocks(round.id, (round.shuttlecocksUsed ?? 0) + 1)}
                aria-label="Increase shuttlecock count"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-lg font-semibold text-line"
              >
                +
              </button>
            </div>
          </div>

          {!confirmingCancel ? (
            <div className="mt-3 flex gap-2">
              <Button variant="danger" className="flex-1" onClick={() => setConfirmingCancel(true)}>
                Cancel
              </Button>
              <Button className="flex-[2]" onClick={() => setFinishing(true)}>
                Mark Complete
              </Button>
            </div>
          ) : (
            <div className="mt-3 animate-reveal rounded-lg border border-bench/40 bg-bench/10 p-3">
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

          {showQueueAction && (
            <Button
              variant="secondary"
              fullWidth
              className="mt-2"
              onClick={() => rollProposal("queue")}
            >
              Queue next round
            </Button>
          )}
        </>
      ) : (
        <>
          <div className="mt-2">
            <Chip>Free</Chip>
          </div>
          {!queuedRound && (
            <>
              {notEnough && (
                <p className="mt-2 animate-reveal text-xs text-shuttle">
                  Not enough eligible players waiting for a full round.
                </p>
              )}
              <Button fullWidth className="mt-3" onClick={() => rollProposal("start")}>
                Randomize
              </Button>
              {showQueueAction && (
                <Button
                  variant="secondary"
                  fullWidth
                  className="mt-2"
                  onClick={() => rollProposal("queue")}
                >
                  Queue next round
                </Button>
              )}
            </>
          )}
        </>
      )}

      {queuedRound && (
        <div className="mt-3 animate-reveal rounded-xl border border-bench/40 bg-bench/10 p-3">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-bench">
            Queued · starts when everyone&rsquo;s free
          </p>
          <div className="flex flex-col gap-1.5">
            {queuedRound.players.map((pid) => (
              <div key={pid} className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-sm font-medium text-line">{nameOf(pid)}</span>
                {busyElsewhereLabel[pid] && (
                  <span className="shrink-0 rounded-full bg-bench/20 px-1.5 py-0.5 text-[10px] font-semibold text-bench">
                    {busyElsewhereLabel[pid]}
                  </span>
                )}
              </div>
            ))}
          </div>
          <Button
            variant="danger"
            fullWidth
            className="mt-2"
            onClick={() => cancelQueuedRound(queuedRound.id)}
          >
            Cancel queue
          </Button>
        </div>
      )}

      {proposal && (
        <ProposedRoundSheet
          courtLabel={court.label}
          teams={proposal.teams}
          onTeamsChange={(teams) => setProposal({ mode: proposal.mode, teams })}
          onRerandomize={() => rollProposal(proposal.mode)}
          eligiblePool={poolFor(proposal.mode)}
          playersById={playersById}
          playerStats={playerStats}
          pendingRequests={pendingRequests}
          skillBalanceMode={skillBalanceMode}
          mode={proposal.mode}
          busyElsewhereLabel={busyElsewhereLabel}
          onClose={() => setProposal(null)}
          onConfirm={(players, teams) => {
            const honoredIds = pendingRequests
              .filter((r) => requestSatisfied(r, players, teams))
              .map((r) => r.id);
            if (proposal.mode === "queue") {
              queueRound(court.id, players, teams, honoredIds);
            } else {
              startRound(court.id, players, teams, honoredIds);
            }
            setProposal(null);
          }}
        />
      )}

      {finishing && round && (
        <FinishRoundSheet
          courtLabel={court.label}
          initialShuttlecocks={round.shuttlecocksUsed}
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
