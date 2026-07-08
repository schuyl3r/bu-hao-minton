import { getBusyPlayerIds } from "@/lib/eligibility";
import type { CourtSessionState, Round } from "@/lib/types";

/**
 * Flips every "queued" round whose 4 players are now all free (not seated in
 * any "in-progress" round) over to "in-progress" on its target court, with a
 * fresh startedAt. A queued round with only SOME of its players free simply
 * stays "queued" — no special partial-readiness handling is needed, since it
 * keeps hard-locking all 4 (including the already-free ones) until the last
 * one frees up too.
 */
export function activateReadyQueuedRounds(
  rounds: Round[],
  courtStates: Record<string, CourtSessionState>,
): { rounds: Round[]; courtStates: Record<string, CourtSessionState> } {
  const busy = getBusyPlayerIds(rounds);
  const ready = rounds.filter(
    (r) => r.status === "queued" && r.players.every((p) => !busy.has(p)),
  );
  if (ready.length === 0) return { rounds, courtStates };

  const readyIds = new Set(ready.map((r) => r.id));
  const now = Date.now();
  const nextRounds = rounds.map((r) =>
    readyIds.has(r.id) ? { ...r, status: "in-progress" as const, startedAt: now } : r,
  );
  const nextCourtStates = { ...courtStates };
  for (const r of ready) {
    nextCourtStates[r.courtId] = {
      ...nextCourtStates[r.courtId],
      currentRoundId: r.id,
      queuedRoundId: null,
    };
  }
  return { rounds: nextRounds, courtStates: nextCourtStates };
}
