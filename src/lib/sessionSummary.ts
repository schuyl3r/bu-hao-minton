import type {
  CourtProfile,
  MatchRequest,
  PlayerProfile,
  PlayerSessionStats,
  Round,
  SessionMeta,
} from "@/lib/types";

export interface GameRow {
  courtLabel: string;
  playerNames: [string, string, string, string];
  teamNames: [[string, string], [string, string]];
  shuttlecocksUsed?: number;
  startedAt: number;
  finishedAt: number;
}

export interface PairingCount {
  playerAName: string;
  playerBName: string;
  count: number;
}

export interface CourtActivity {
  courtLabel: string;
  gamesPlayed: number;
  totalPlayedMinutes: number;
}

export interface GameDurationStats {
  averageMinutes: number;
  longestMinutes: number;
  shortestMinutes: number;
}

export interface CostSummary {
  courtCost: number;
  shuttlecockCost: number;
  totalCost: number;
  /** Everyone marked present at any point this session — the total is split evenly across them. */
  attendeeCount: number;
  perPersonShare: number | null;
}

export interface SessionSummary {
  games: GameRow[];
  gamesPerPlayer: { name: string; gamesPlayed: number }[];
  totalShuttlecocks: number;
  mostRepeatedPairings: PairingCount[];
  fewestGamesPlayers: { name: string; gamesPlayed: number }[];
  unhonoredRequests: { fromName: string; targetName: string; kind: string }[];
  sessionDurationMinutes: number;
  /** Games played and total time on each court — there's no "available time"
   *  to compare against anymore (courts have no duration/block), so this is
   *  activity, not a percentage utilization. */
  courtActivity: CourtActivity[];
  /** null when no games finished yet — there's nothing to average. */
  gameDuration: GameDurationStats | null;
  /** null unless a court cost or shuttlecock price was entered after ending the session. */
  costSummary: CostSummary | null;
}

export function computeSessionSummary({
  session,
  players,
  courts,
  rounds,
  requests,
  playerStats,
  now,
}: {
  session: SessionMeta;
  players: PlayerProfile[];
  courts: CourtProfile[];
  rounds: Round[];
  requests: MatchRequest[];
  playerStats: Record<string, PlayerSessionStats>;
  now: number;
}): SessionSummary {
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "Unknown";
  const courtLabelOf = (id: string) => courts.find((c) => c.id === id)?.label ?? "Unknown court";
  const finishedRounds = rounds.filter((r) => r.status === "finished" && r.finishedAt !== null);

  const games: GameRow[] = finishedRounds.map((r) => ({
    courtLabel: courtLabelOf(r.courtId),
    playerNames: r.players.map(nameOf) as [string, string, string, string],
    teamNames: [
      [nameOf(r.teams[0][0]), nameOf(r.teams[0][1])],
      [nameOf(r.teams[1][0]), nameOf(r.teams[1][1])],
    ],
    shuttlecocksUsed: r.shuttlecocksUsed,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt as number,
  }));

  const gamesPerPlayer = players.map((p) => ({
    name: p.name,
    gamesPlayed: playerStats[p.id]?.gamesPlayed ?? 0,
  }));

  const totalShuttlecocks = finishedRounds.reduce((sum, r) => sum + (r.shuttlecocksUsed ?? 0), 0);

  const pairingCounts = new Map<string, PairingCount>();
  for (const p of players) {
    const stats = playerStats[p.id];
    if (!stats) continue;
    const addAll = (record: Record<string, number>) => {
      for (const [otherId, count] of Object.entries(record)) {
        const key = [p.id, otherId].sort().join("::");
        const existing = pairingCounts.get(key);
        pairingCounts.set(key, {
          playerAName: nameOf(p.id),
          playerBName: nameOf(otherId),
          count: (existing?.count ?? 0) + count,
        });
      }
    };
    addAll(stats.pairedWith);
    addAll(stats.against);
  }
  // Each meeting was added once from each side (p and otherId both iterate),
  // so every pair's count is currently doubled — halve it before ranking.
  const allPairings = [...pairingCounts.values()].map((p) => ({ ...p, count: p.count / 2 }));
  const maxCount = allPairings.reduce((m, p) => Math.max(m, p.count), 0);
  const mostRepeatedPairings = maxCount > 0 ? allPairings.filter((p) => p.count === maxCount) : [];

  const attendedPlayers = players.filter(
    (p) => (playerStats[p.id]?.status ?? "not-arrived") !== "not-arrived",
  );
  const minGames =
    attendedPlayers.length > 0
      ? Math.min(...attendedPlayers.map((p) => playerStats[p.id]?.gamesPlayed ?? 0))
      : 0;
  const fewestGamesPlayers = attendedPlayers
    .filter((p) => (playerStats[p.id]?.gamesPlayed ?? 0) === minGames)
    .map((p) => ({ name: p.name, gamesPlayed: minGames }));

  const unhonoredRequests = requests
    .filter((r) => r.status === "pending")
    .map((r) => ({
      fromName: nameOf(r.fromPlayerId),
      targetName: nameOf(r.targetPlayerId),
      kind: r.kind,
    }));

  const sessionEnd = session.endedAt ?? now;
  const sessionDurationMinutes = Math.round((sessionEnd - session.startedAt) / 60000);

  const courtActivity: CourtActivity[] = courts.map((c) => {
    const onCourt = finishedRounds.filter((r) => r.courtId === c.id);
    const playedMs = onCourt.reduce((sum, r) => sum + ((r.finishedAt as number) - r.startedAt), 0);
    return {
      courtLabel: c.label,
      gamesPlayed: onCourt.length,
      totalPlayedMinutes: Math.round(playedMs / 60000),
    };
  });

  const gameDurationsMinutes = finishedRounds.map((r) => ((r.finishedAt as number) - r.startedAt) / 60000);
  const gameDuration: GameDurationStats | null =
    gameDurationsMinutes.length > 0
      ? {
          averageMinutes:
            Math.round((gameDurationsMinutes.reduce((a, b) => a + b, 0) / gameDurationsMinutes.length) * 10) / 10,
          longestMinutes: Math.round(Math.max(...gameDurationsMinutes) * 10) / 10,
          shortestMinutes: Math.round(Math.min(...gameDurationsMinutes) * 10) / 10,
        }
      : null;

  const { courtCost, shuttlecockPricing } = session;
  let costSummary: CostSummary | null = null;
  if (courtCost != null || shuttlecockPricing != null) {
    const unitPrice = shuttlecockPricing
      ? shuttlecockPricing.mode === "per-tube"
        ? shuttlecockPricing.price / (shuttlecockPricing.shuttlesPerTube || 12)
        : shuttlecockPricing.price
      : 0;
    const shuttlecockCost = Math.round(unitPrice * totalShuttlecocks * 100) / 100;
    const totalCourtCost = courtCost ?? 0;
    const totalCost = Math.round((totalCourtCost + shuttlecockCost) * 100) / 100;
    costSummary = {
      courtCost: totalCourtCost,
      shuttlecockCost,
      totalCost,
      attendeeCount: attendedPlayers.length,
      perPersonShare:
        attendedPlayers.length > 0 ? Math.round((totalCost / attendedPlayers.length) * 100) / 100 : null,
    };
  }

  return {
    games,
    gamesPerPlayer,
    totalShuttlecocks,
    mostRepeatedPairings,
    fewestGamesPlayers,
    unhonoredRequests,
    sessionDurationMinutes,
    courtActivity,
    gameDuration,
    costSummary,
  };
}
