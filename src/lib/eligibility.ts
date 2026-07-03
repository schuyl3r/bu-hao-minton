import type { PlayerSessionStats, Round } from "@/lib/types";

/** Present, not resting, and not currently seated in an in-progress round on any court. */
export function getEligiblePlayerIds(
  playerStats: Record<string, PlayerSessionStats>,
  rounds: Round[],
): string[] {
  const busy = new Set(
    rounds.filter((r) => r.status === "in-progress").flatMap((r) => r.players),
  );
  return Object.entries(playerStats)
    .filter(([id, stats]) => stats.status === "present" && !busy.has(id))
    .map(([id]) => id);
}
