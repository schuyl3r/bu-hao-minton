import type { PlayerSessionStats, Round } from "@/lib/types";

/** Ids of every player currently seated in an in-progress round on any court. */
export function getBusyPlayerIds(rounds: Round[]): Set<string> {
  return new Set(
    rounds.filter((r) => r.status === "in-progress").flatMap((r) => r.players),
  );
}

/** Ids of every player named in a currently-queued round (targeting any court). */
export function getReservedPlayerIds(rounds: Round[]): Set<string> {
  return new Set(rounds.filter((r) => r.status === "queued").flatMap((r) => r.players));
}

/** Busy (in-progress) OR reserved (queued elsewhere) — the full hard-lock set. */
export function getLockedPlayerIds(rounds: Round[]): Set<string> {
  return new Set([...getBusyPlayerIds(rounds), ...getReservedPlayerIds(rounds)]);
}

/** Present, not resting, and not locked (busy or reserved) on any court. */
export function getEligiblePlayerIds(
  playerStats: Record<string, PlayerSessionStats>,
  rounds: Round[],
): string[] {
  const locked = getLockedPlayerIds(rounds);
  return Object.entries(playerStats)
    .filter(([id, stats]) => stats.status === "present" && !locked.has(id))
    .map(([id]) => id);
}

/**
 * The candidate pool for BUILDING a queued-round proposal on `targetCourtId`:
 * every present player except those already reserved by a DIFFERENT court's
 * pending queue. Deliberately wider than getEligiblePlayerIds — it includes
 * players still mid-game on other courts (and even this court's own current
 * round, supporting "queue my court's own next round while still playing").
 */
export function getQueueablePlayerIds(
  playerStats: Record<string, PlayerSessionStats>,
  rounds: Round[],
  targetCourtId: string,
): string[] {
  const reservedElsewhere = new Set(
    rounds
      .filter((r) => r.status === "queued" && r.courtId !== targetCourtId)
      .flatMap((r) => r.players),
  );
  return Object.entries(playerStats)
    .filter(([id, stats]) => stats.status === "present" && !reservedElsewhere.has(id))
    .map(([id]) => id);
}
