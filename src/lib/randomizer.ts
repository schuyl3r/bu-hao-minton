import { TIER_VALUE } from "@/lib/types";
import type { MatchRequest, PlayerSessionStats, Tier } from "@/lib/types";

/**
 * Round-generation algorithm.
 *
 * This is a brute-force search, not a greedy heuristic: every combination of
 * 4 players drawn from the eligible pool, crossed with every way to split
 * those 4 into 2 teams of 2 (3 splits per group), is scored and ranked. For
 * realistic session sizes (well under 100 eligible players) this is at most
 * a few hundred thousand candidates — trivial for a single button tap, and
 * it guarantees the true best candidate is found rather than an
 * approximation, which matters given how much correctness rides on this.
 *
 * Ranking is a strict lexicographic sort (each tier only breaks ties left
 * by the one above it — nothing is blended into a weighted score):
 *
 *   1. Honored request count, descending       (priority 1 in the spec)
 *   2. Repeat-pairing score, ascending          (priority 2, soft minimization)
 *   3. Catch-up bias, ascending (if enabled)    (priority 3)
 *   4. Skill-imbalance, ascending (if enabled)  (priority 4)
 *   5. Oldest honored request's age, ascending  (fairness tiebreak, see below)
 *   6. Candidate index                          (deterministic fallback)
 *
 * Request honoring (#1) has a carve-out: a request is only ever considered
 * "honorable" this round if satisfying it doesn't force a pairing that has
 * already happened, UNLESS every possible round this pass would force some
 * repeat anyway (in which case declining the request buys nothing). This is
 * evaluated per-request via `isHonorable`, not baked into the main score, so
 * a request that fails the check is treated as if it didn't exist for
 * scoring purposes — it simply stays pending and is retried next round.
 *
 * Tier 5 exists only to keep behavior predictable when two candidates tie
 * all the way down: prefer the one satisfying the OLDER pending request.
 * The spec doesn't mandate this, but without it, ties would be broken
 * arbitrarily by candidate order, which could let a newer request edge out
 * an older one indefinitely. It sits below repeat/catch-up/skill scoring
 * because those are the spec's actual priorities — this is just a fairness
 * nudge for otherwise-equal candidates.
 */

export type Team = [string, string];

export interface RoundCandidate {
  players: [string, string, string, string];
  teams: [Team, Team];
}

export interface GenerateRoundInput {
  /** Present, not resting, and not currently seated on any court. */
  eligiblePlayerIds: string[];
  playerStats: Record<string, PlayerSessionStats>;
  playerTiers: Record<string, Tier | undefined>;
  /** Only requests with status "pending"; both ends need not be eligible. */
  pendingRequests: MatchRequest[];
  catchUpMode: boolean;
  skillBalanceMode: boolean;
}

export type GenerateRoundResult =
  | {
      ok: true;
      players: [string, string, string, string];
      teams: [Team, Team];
      honoredRequestIds: string[];
      repeatScore: number;
      partialSkillBalance: boolean;
    }
  | { ok: false; reason: "not-enough-players" };

function meetingCount(stats: Record<string, PlayerSessionStats>, a: string, b: string): number {
  const sa = stats[a];
  if (!sa) return 0;
  return (sa.pairedWith[b] ?? 0) + (sa.against[b] ?? 0);
}

function* combinations4(pool: string[]): Generator<[string, string, string, string]> {
  const n = pool.length;
  for (let i = 0; i < n - 3; i++) {
    for (let j = i + 1; j < n - 2; j++) {
      for (let k = j + 1; k < n - 1; k++) {
        for (let l = k + 1; l < n; l++) {
          yield [pool[i], pool[j], pool[k], pool[l]];
        }
      }
    }
  }
}

function splitsOf4(group: [string, string, string, string]): [Team, Team][] {
  const [a, b, c, d] = group;
  return [
    [
      [a, b],
      [c, d],
    ],
    [
      [a, c],
      [b, d],
    ],
    [
      [a, d],
      [b, c],
    ],
  ];
}

/** Exported for live re-scoring in the UI after a manual pre-confirm swap. */
export function repeatScoreOf(
  stats: Record<string, PlayerSessionStats>,
  teams: [Team, Team],
): number {
  const [[a, b], [c, d]] = teams;
  return (
    meetingCount(stats, a, b) +
    meetingCount(stats, c, d) +
    meetingCount(stats, a, c) +
    meetingCount(stats, a, d) +
    meetingCount(stats, b, c) +
    meetingCount(stats, b, d)
  );
}

function tierSum(tiers: Record<string, Tier | undefined>, team: Team): number {
  return team.reduce((sum, id) => sum + (tiers[id] ? TIER_VALUE[tiers[id] as Tier] : 0), 0);
}

function hasUnratedPlayer(tiers: Record<string, Tier | undefined>, players: string[]): boolean {
  return players.some((id) => tiers[id] === undefined);
}

/** Exported for live re-scoring in the UI after a manual pre-confirm swap. */
export function requestSatisfied(
  request: MatchRequest,
  players: [string, string, string, string],
  teams: [Team, Team],
): boolean {
  if (!players.includes(request.fromPlayerId) || !players.includes(request.targetPlayerId)) {
    return false;
  }
  const sameTeam = teams.some(
    (t) => t.includes(request.fromPlayerId) && t.includes(request.targetPlayerId),
  );
  return request.kind === "with" ? sameTeam : !sameTeam;
}

export function generateRound(input: GenerateRoundInput): GenerateRoundResult {
  const {
    eligiblePlayerIds,
    playerStats,
    playerTiers,
    pendingRequests,
    catchUpMode,
    skillBalanceMode,
  } = input;

  if (eligiblePlayerIds.length < 4) {
    return { ok: false, reason: "not-enough-players" };
  }

  const pool = [...eligiblePlayerIds].sort();
  const relevantRequests = pendingRequests.filter(
    (r) => pool.includes(r.fromPlayerId) && pool.includes(r.targetPlayerId),
  );

  // Build every candidate up front — needed both to find the honorable set
  // (via hasFreshOption) and to rank the final pick.
  const candidates: { players: [string, string, string, string]; teams: [Team, Team] }[] = [];
  for (const group of combinations4(pool)) {
    for (const teams of splitsOf4(group)) {
      candidates.push({ players: group, teams });
    }
  }

  const hasFreshOption = candidates.some((c) => repeatScoreOf(playerStats, c.teams) === 0);

  const honorableRequests = relevantRequests.filter((r) => {
    const alreadyMet = meetingCount(playerStats, r.fromPlayerId, r.targetPlayerId) > 0;
    return !alreadyMet || !hasFreshOption;
  });

  type Scored = {
    candidate: RoundCandidate;
    honoredIds: string[];
    honoredCount: number;
    repeatScore: number;
    catchUpSum: number;
    skillImbalance: number;
    oldestHonoredAge: number;
    partialSkillBalance: boolean;
    index: number;
  };

  const scored: Scored[] = candidates.map((candidate, index) => {
    const honored = honorableRequests.filter((r) =>
      requestSatisfied(r, candidate.players, candidate.teams),
    );
    const catchUpSum = candidate.players.reduce(
      (sum, id) => sum + (playerStats[id]?.gamesPlayed ?? 0),
      0,
    );
    const skillImbalance = Math.abs(
      tierSum(playerTiers, candidate.teams[0]) - tierSum(playerTiers, candidate.teams[1]),
    );
    return {
      candidate,
      honoredIds: honored.map((r) => r.id),
      honoredCount: honored.length,
      repeatScore: repeatScoreOf(playerStats, candidate.teams),
      catchUpSum,
      skillImbalance,
      oldestHonoredAge: honored.length > 0 ? Math.min(...honored.map((r) => r.createdAt)) : Infinity,
      partialSkillBalance: hasUnratedPlayer(playerTiers, candidate.players),
      index,
    };
  });

  scored.sort((a, b) => {
    if (a.honoredCount !== b.honoredCount) return b.honoredCount - a.honoredCount;
    if (a.repeatScore !== b.repeatScore) return a.repeatScore - b.repeatScore;
    if (catchUpMode && a.catchUpSum !== b.catchUpSum) return a.catchUpSum - b.catchUpSum;
    if (skillBalanceMode && a.skillImbalance !== b.skillImbalance) {
      return a.skillImbalance - b.skillImbalance;
    }
    if (a.oldestHonoredAge !== b.oldestHonoredAge) return a.oldestHonoredAge - b.oldestHonoredAge;
    return a.index - b.index;
  });

  const winner = scored[0];
  return {
    ok: true,
    players: winner.candidate.players,
    teams: winner.candidate.teams,
    honoredRequestIds: winner.honoredIds,
    repeatScore: winner.repeatScore,
    partialSkillBalance: skillBalanceMode && winner.partialSkillBalance,
  };
}
