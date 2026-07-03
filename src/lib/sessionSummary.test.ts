import { describe, expect, it } from "vitest";
import { computeSessionSummary } from "@/lib/sessionSummary";
import type {
  CourtProfile,
  MatchRequest,
  PlayerProfile,
  PlayerSessionStats,
  Round,
  SessionMeta,
} from "@/lib/types";

const players: PlayerProfile[] = [
  { id: "A", name: "Alice" },
  { id: "B", name: "Bob" },
  { id: "C", name: "Cara" },
  { id: "D", name: "Dev" },
  { id: "E", name: "Eve" },
];

const courts: CourtProfile[] = [{ id: "c1", label: "Court 1" }];

function stats(overrides: Partial<Record<string, Partial<PlayerSessionStats>>>) {
  const base: Record<string, PlayerSessionStats> = {};
  for (const p of players) {
    base[p.id] = { status: "present", gamesPlayed: 0, pairedWith: {}, against: {}, ...overrides[p.id] };
  }
  return base;
}

const session: SessionMeta = {
  id: "s1",
  startedAt: 0,
  endedAt: 60 * 60000, // 60 minutes later
  totalHours: 2,
  catchUpMode: false,
  skillBalanceMode: false,
};

describe("computeSessionSummary", () => {
  it("only includes finished rounds in the game log, not cancelled or in-progress", () => {
    const rounds: Round[] = [
      {
        id: "r1",
        courtId: "c1",
        players: ["A", "B", "C", "D"],
        teams: [
          ["A", "B"],
          ["C", "D"],
        ],
        startedAt: 0,
        finishedAt: 20 * 60000,
        status: "finished",
        shuttlecocksUsed: 3,
      },
      {
        id: "r2",
        courtId: "c1",
        players: ["A", "B", "C", "D"],
        teams: [
          ["A", "C"],
          ["B", "D"],
        ],
        startedAt: 20 * 60000,
        finishedAt: 30 * 60000,
        status: "cancelled",
      },
      {
        id: "r3",
        courtId: "c1",
        players: ["A", "B", "C", "D"],
        teams: [
          ["A", "D"],
          ["B", "C"],
        ],
        startedAt: 40 * 60000,
        finishedAt: null,
        status: "in-progress",
      },
    ];
    const summary = computeSessionSummary({
      session,
      players,
      courts,
      rounds,
      requests: [],
      playerStats: stats({}),
      now: 60 * 60000,
    });
    expect(summary.games).toHaveLength(1);
    expect(summary.games[0].shuttlecocksUsed).toBe(3);
    expect(summary.totalShuttlecocks).toBe(3);
  });

  it("identifies the most-repeated pairing across combined with+against counts", () => {
    const playerStats = stats({
      A: { pairedWith: { B: 2 }, against: { C: 3 } },
      B: { pairedWith: { A: 2 }, against: { D: 1 } },
      C: { against: { A: 3 } },
      D: { against: { B: 1 } },
    });
    const summary = computeSessionSummary({
      session,
      players,
      courts,
      rounds: [],
      requests: [],
      playerStats,
      now: 60 * 60000,
    });
    expect(summary.mostRepeatedPairings).toHaveLength(1);
    expect(summary.mostRepeatedPairings[0].count).toBe(3);
    expect([summary.mostRepeatedPairings[0].playerAName, summary.mostRepeatedPairings[0].playerBName]).toEqual(
      expect.arrayContaining(["Alice", "Cara"]),
    );
  });

  it("excludes players who never arrived from the fewest-games fairness check", () => {
    const playerStats = stats({
      A: { status: "present", gamesPlayed: 3 },
      B: { status: "present", gamesPlayed: 0 },
      C: { status: "not-arrived", gamesPlayed: 0 },
      D: { status: "resting", gamesPlayed: 1 },
      E: { status: "present", gamesPlayed: 0 },
    });
    const summary = computeSessionSummary({
      session,
      players,
      courts,
      rounds: [],
      requests: [],
      playerStats,
      now: 60 * 60000,
    });
    const names = summary.fewestGamesPlayers.map((p) => p.name).sort();
    expect(names).toEqual(["Bob", "Eve"]);
  });

  it("lists only still-pending requests as unhonored", () => {
    const requests: MatchRequest[] = [
      { id: "req1", fromPlayerId: "A", targetPlayerId: "B", kind: "with", status: "pending", createdAt: 0 },
      {
        id: "req2",
        fromPlayerId: "C",
        targetPlayerId: "D",
        kind: "against",
        status: "honored",
        createdAt: 0,
        honoredInRoundId: "r1",
      },
    ];
    const summary = computeSessionSummary({
      session,
      players,
      courts,
      rounds: [],
      requests,
      playerStats: stats({}),
      now: 60 * 60000,
    });
    expect(summary.unhonoredRequests).toEqual([{ fromName: "Alice", targetName: "Bob", kind: "with" }]);
  });

  it("computes per-court activity as games played and total played time", () => {
    const rounds: Round[] = [
      {
        id: "r1",
        courtId: "c1",
        players: ["A", "B", "C", "D"],
        teams: [
          ["A", "B"],
          ["C", "D"],
        ],
        startedAt: 0,
        finishedAt: 30 * 60000,
        status: "finished",
      },
    ];
    const summary = computeSessionSummary({
      session,
      players,
      courts,
      rounds,
      requests: [],
      playerStats: stats({}),
      now: 60 * 60000,
    });
    expect(summary.courtActivity).toHaveLength(1);
    expect(summary.courtActivity[0].gamesPlayed).toBe(1);
    expect(summary.courtActivity[0].totalPlayedMinutes).toBe(30);
  });

  it("returns null gameDuration when no games have finished", () => {
    const summary = computeSessionSummary({
      session,
      players,
      courts,
      rounds: [],
      requests: [],
      playerStats: stats({}),
      now: 60 * 60000,
    });
    expect(summary.gameDuration).toBeNull();
  });

  it("computes average/longest/shortest game duration from finished rounds", () => {
    const rounds: Round[] = [
      {
        id: "r1",
        courtId: "c1",
        players: ["A", "B", "C", "D"],
        teams: [
          ["A", "B"],
          ["C", "D"],
        ],
        startedAt: 0,
        finishedAt: 10 * 60000, // 10 min
        status: "finished",
      },
      {
        id: "r2",
        courtId: "c1",
        players: ["A", "B", "C", "D"],
        teams: [
          ["A", "C"],
          ["B", "D"],
        ],
        startedAt: 10 * 60000,
        finishedAt: 40 * 60000, // 30 min
        status: "finished",
      },
    ];
    const summary = computeSessionSummary({
      session,
      players,
      courts,
      rounds,
      requests: [],
      playerStats: stats({}),
      now: 60 * 60000,
    });
    expect(summary.gameDuration).not.toBeNull();
    expect(summary.gameDuration?.averageMinutes).toBe(20);
    expect(summary.gameDuration?.longestMinutes).toBe(30);
    expect(summary.gameDuration?.shortestMinutes).toBe(10);
  });
});
