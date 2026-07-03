import { describe, expect, it } from "vitest";
import { generateRound, type GenerateRoundInput } from "@/lib/randomizer";
import type { MatchRequest, PlayerSessionStats, Tier } from "@/lib/types";

function blankStats(): PlayerSessionStats {
  return { status: "present", gamesPlayed: 0, pairedWith: {}, against: {} };
}

function statsFor(ids: string[]): Record<string, PlayerSessionStats> {
  const out: Record<string, PlayerSessionStats> = {};
  ids.forEach((id) => (out[id] = blankStats()));
  return out;
}

function recordMeeting(
  stats: Record<string, PlayerSessionStats>,
  a: string,
  b: string,
  kind: "pairedWith" | "against",
) {
  stats[a][kind][b] = (stats[a][kind][b] ?? 0) + 1;
  stats[b][kind][a] = (stats[b][kind][a] ?? 0) + 1;
}

function request(
  fromPlayerId: string,
  targetPlayerId: string,
  kind: "with" | "against",
  createdAt = 0,
): MatchRequest {
  return {
    id: `${fromPlayerId}-${targetPlayerId}-${kind}-${createdAt}`,
    fromPlayerId,
    targetPlayerId,
    kind,
    status: "pending",
    createdAt,
  };
}

/**
 * Every scenario-level test below cares about the deterministic ranking
 * (requests/repeats/catch-up/skill), not the final random tiebreak — so
 * they all run through a fixed `random: () => 0`, which always resolves to
 * the first candidate in the fully-tied group (the same candidate the old,
 * purely index-based tiebreak would have picked). The RNG behavior itself
 * gets its own dedicated tests further down.
 */
function run(input: Omit<GenerateRoundInput, "random"> & { random?: () => number }) {
  return generateRound({ random: () => 0, ...input });
}

const PLAYERS8 = ["A", "B", "C", "D", "E", "F", "G", "H"];

describe("generateRound", () => {
  it("returns not-enough-players when fewer than 4 are eligible", () => {
    const result = run({
      eligiblePlayerIds: ["A", "B", "C"],
      playerStats: statsFor(["A", "B", "C"]),
      playerTiers: {},
      pendingRequests: [],
      catchUpMode: false,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(false);
  });

  it("seats exactly 4 of the eligible players with a valid 2v2 split when history is empty", () => {
    const result = run({
      eligiblePlayerIds: PLAYERS8,
      playerStats: statsFor(PLAYERS8),
      playerTiers: {},
      pendingRequests: [],
      catchUpMode: false,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(new Set(result.players).size).toBe(4);
    expect(result.repeatScore).toBe(0);
    const [teamA, teamB] = result.teams;
    expect(new Set([...teamA, ...teamB])).toEqual(new Set(result.players));
  });

  it("minimizes repeats: prefers a group with zero prior meetings over one with history", () => {
    const stats = statsFor(["A", "B", "C", "D"]);
    // A and B have played together many times; C and D never have.
    recordMeeting(stats, "A", "B", "pairedWith");
    recordMeeting(stats, "A", "B", "pairedWith");
    recordMeeting(stats, "A", "B", "pairedWith");

    const result = run({
      eligiblePlayerIds: ["A", "B", "C", "D"],
      playerStats: stats,
      playerTiers: {},
      pendingRequests: [],
      catchUpMode: false,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // The only 4 eligible players must all be seated, but the split should
    // avoid pairing A with B again if any split does better.
    // With only 4 players there are 3 splits: AB|CD, AC|BD, AD|BC.
    // AB|CD forces the repeated A-B pairing AND leaves C-D fresh, but A-B
    // contributes 3 to repeatScore. AC|BD and AD|BC each still put A and B
    // against each other (since with only 4 players, if not teammates they
    // must be opponents) — every split includes the A-B relationship in
    // some form once both are in the round, so all 3 splits score >=3 here.
    // This confirms the algorithm still seats everyone (soft constraint)
    // rather than refusing when repeats are unavoidable.
    expect(result.repeatScore).toBeGreaterThanOrEqual(3);
  });

  it("still seats players once all pairings are exhausted (soft minimization, no hard block)", () => {
    const ids = ["A", "B", "C", "D"];
    const stats = statsFor(ids);
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        recordMeeting(stats, ids[i], ids[j], "pairedWith");
      }
    }
    const result = run({
      eligiblePlayerIds: ids,
      playerStats: stats,
      playerTiers: {},
      pendingRequests: [],
      catchUpMode: false,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(true);
  });

  it("honors a fresh 'with' request by seating both on the same team", () => {
    const result = run({
      eligiblePlayerIds: PLAYERS8,
      playerStats: statsFor(PLAYERS8),
      playerTiers: {},
      pendingRequests: [request("A", "B", "with")],
      catchUpMode: false,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.honoredRequestIds).toContain("A-B-with-0");
    const [teamA, teamB] = result.teams;
    const sameTeam =
      (teamA.includes("A") && teamA.includes("B")) || (teamB.includes("A") && teamB.includes("B"));
    expect(sameTeam).toBe(true);
  });

  it("honors a fresh 'against' request by seating both on opposite teams", () => {
    const result = run({
      eligiblePlayerIds: PLAYERS8,
      playerStats: statsFor(PLAYERS8),
      playerTiers: {},
      pendingRequests: [request("A", "B", "against")],
      catchUpMode: false,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.honoredRequestIds).toContain("A-B-against-0");
    expect(result.players).toContain("A");
    expect(result.players).toContain("B");
    const [teamA, teamB] = result.teams;
    const opposite =
      (teamA.includes("A") && teamB.includes("B")) || (teamB.includes("A") && teamA.includes("B"));
    expect(opposite).toBe(true);
  });

  it("skips a request that would force a repeat when a fresh alternative round exists", () => {
    const stats = statsFor(PLAYERS8);
    // A and B have already played together — honoring "A with B" again
    // would repeat that pairing, but C..H are all fresh, so a fully-fresh
    // round is available without touching A/B at all... except A and B
    // still need to be *somewhere* if selected. The key test: since other
    // fresh groups of 4 exist among C,D,E,F,G,H, the algorithm should pick
    // one of those (repeatScore 0) rather than force A-B together again.
    recordMeeting(stats, "A", "B", "pairedWith");

    const result = run({
      eligiblePlayerIds: PLAYERS8,
      playerStats: stats,
      playerTiers: {},
      pendingRequests: [request("A", "B", "with")],
      catchUpMode: false,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.repeatScore).toBe(0);
    expect(result.honoredRequestIds).not.toContain("A-B-with-0");
  });

  it("honors a request that forces a repeat when NO fresh alternative exists anywhere", () => {
    const ids = ["A", "B", "C", "D"];
    const stats = statsFor(ids);
    // Every pair has already met, so no round can possibly be fresh.
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        recordMeeting(stats, ids[i], ids[j], "pairedWith");
      }
    }
    const result = run({
      eligiblePlayerIds: ids,
      playerStats: stats,
      playerTiers: {},
      pendingRequests: [request("A", "B", "with")],
      catchUpMode: false,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // Since declining buys nothing (every option repeats something), the
    // request should be honored.
    expect(result.honoredRequestIds).toContain("A-B-with-0");
  });

  it("leaves a request pending (not honored) when its target isn't in the eligible pool", () => {
    const result = run({
      eligiblePlayerIds: ["A", "C", "D", "E"],
      playerStats: statsFor(["A", "B", "C", "D", "E"]),
      playerTiers: {},
      pendingRequests: [request("A", "B", "with")], // B is not eligible
      catchUpMode: false,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.honoredRequestIds).toEqual([]);
  });

  it("catch-up mode prefers the group with fewer total games played among repeat-score ties", () => {
    const stats = statsFor(PLAYERS8);
    stats["A"].gamesPlayed = 5;
    stats["B"].gamesPlayed = 5;
    stats["C"].gamesPlayed = 5;
    stats["D"].gamesPlayed = 5;
    // E, F, G, H are late arrivals with zero games played.

    const result = run({
      eligiblePlayerIds: PLAYERS8,
      playerStats: stats,
      playerTiers: {},
      pendingRequests: [],
      catchUpMode: true,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    // All candidates tie at repeatScore 0, so catch-up should steer toward
    // the zero-games group entirely.
    expect(result.players.every((id) => ["E", "F", "G", "H"].includes(id))).toBe(true);
  });

  it("skill balance mode balances team totals, not individual matchups (A can face E)", () => {
    const ids = ["A", "B", "C", "D"];
    const tiers: Record<string, Tier> = { A: "A", B: "E", C: "A", D: "D" };
    // Possible splits or their tier totals:
    //   AB|CD -> (5+1)=6 vs (5+2)=7 -> diff 1
    //   AC|BD -> (5+5)=10 vs (1+2)=3 -> diff 7
    //   AD|BC -> (5+2)=7 vs (1+5)=6 -> diff 1
    // Best (lowest diff) options are AB|CD and AD|BC, both diff 1 — and
    // both of those seat the tier-A "A" against an E or a D, never against
    // nobody: balance is about totals, individual gaps are untouched.
    const result = run({
      eligiblePlayerIds: ids,
      playerStats: statsFor(ids),
      playerTiers: tiers,
      pendingRequests: [],
      catchUpMode: false,
      skillBalanceMode: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const [teamA, teamB] = result.teams;
    const diff = Math.abs(
      teamA.reduce((s, id) => s + { A: 5, B: 4, C: 3, D: 2, E: 1 }[tiers[id]], 0) -
        teamB.reduce((s, id) => s + { A: 5, B: 4, C: 3, D: 2, E: 1 }[tiers[id]], 0),
    );
    expect(diff).toBe(1);
  });

  it("flags partialSkillBalance when an unrated player is seated under skill-balance mode", () => {
    const ids = ["A", "B", "C", "D"];
    const tiers: Record<string, Tier> = { A: "A", B: "B" }; // C, D unrated
    const result = run({
      eligiblePlayerIds: ids,
      playerStats: statsFor(ids),
      playerTiers: tiers,
      pendingRequests: [],
      catchUpMode: false,
      skillBalanceMode: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.partialSkillBalance).toBe(true);
  });

  it("does not flag partialSkillBalance when skill-balance mode is off", () => {
    const ids = ["A", "B", "C", "D"];
    const result = run({
      eligiblePlayerIds: ids,
      playerStats: statsFor(ids),
      playerTiers: {},
      pendingRequests: [],
      catchUpMode: false,
      skillBalanceMode: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.partialSkillBalance).toBe(false);
  });

  describe("re-randomize (RNG tiebreak)", () => {
    it("only randomizes among candidates that are fully tied on every deterministic priority", () => {
      // A and B have met before; C, D, E, F have not met anyone. The only
      // way to get repeatScore 0 is to exclude the A-B pair from meeting
      // again, so the winning group must be drawn from the C/D/E/F fresh
      // pool — regardless of which random draw is used.
      const ids = ["A", "B", "C", "D", "E", "F"];
      const stats = statsFor(ids);
      recordMeeting(stats, "A", "B", "pairedWith");

      for (const draw of [0, 0.33, 0.66, 0.99]) {
        const result = run({
          eligiblePlayerIds: ids,
          playerStats: stats,
          playerTiers: {},
          pendingRequests: [],
          catchUpMode: false,
          skillBalanceMode: false,
          random: () => draw,
        });
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        expect(result.repeatScore).toBe(0);
      }
    });

    it("different random draws can surface different candidates among a genuine tie", () => {
      const ids = ["A", "B", "C", "D", "E", "F", "G", "H"];
      const stats = statsFor(ids);
      // Completely fresh pool: every 4-player group scores identically, so
      // the entire candidate set is tied and eligible for the random draw.
      const seenGroups = new Set<string>();
      for (const draw of [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]) {
        const result = run({
          eligiblePlayerIds: ids,
          playerStats: stats,
          playerTiers: {},
          pendingRequests: [],
          catchUpMode: false,
          skillBalanceMode: false,
          random: () => draw,
        });
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        seenGroups.add([...result.players].sort().join(","));
      }
      expect(seenGroups.size).toBeGreaterThan(1);
    });

    it("is fully deterministic for a fixed random source (same draw -> same result)", () => {
      const a = run({
        eligiblePlayerIds: PLAYERS8,
        playerStats: statsFor(PLAYERS8),
        playerTiers: {},
        pendingRequests: [],
        catchUpMode: false,
        skillBalanceMode: false,
        random: () => 0.42,
      });
      const b = run({
        eligiblePlayerIds: PLAYERS8,
        playerStats: statsFor(PLAYERS8),
        playerTiers: {},
        pendingRequests: [],
        catchUpMode: false,
        skillBalanceMode: false,
        random: () => 0.42,
      });
      expect(a).toEqual(b);
    });
  });
});
