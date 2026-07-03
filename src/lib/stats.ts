/** Average gamesPlayed across a set of session stats, 0 if empty. */
export function averageGamesPlayed(stats: Record<string, { gamesPlayed: number }>): number {
  const values = Object.values(stats).map((s) => s.gamesPlayed);
  return values.length ? values.reduce((sum, g) => sum + g, 0) / values.length : 0;
}

/**
 * Color-codes a player's games-played count against the session average, so
 * a glance shows who's fallen behind (red at zero once others have played,
 * amber below average) versus who's had their fair share (green) — the same
 * fairness signal catch-up mode already optimizes for, made visible. Used by
 * both the Players roster and the Courts waiting list for a consistent read.
 */
export function gamesPlayedColorClass(gamesPlayed: number, avgGames: number): string {
  if (avgGames === 0) return "text-line";
  if (gamesPlayed === 0) return "text-bench";
  if (gamesPlayed < avgGames) return "text-shuttle";
  return "text-in";
}
