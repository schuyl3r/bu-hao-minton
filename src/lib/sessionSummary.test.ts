import { describe, expect, it } from "vitest";
import { computeSessionSummary } from "@/lib/sessionSummary";
import type {
  CourtProfile,
  CourtSessionState,
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

const courts: CourtProfile[] = [{ id: "c1", label: "Court 1", durationMinutes: 120 }];

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
  defaultDurationMinutes: 120,
  estimatedMinutesPerGame: 20,
  catchUpMode: false,
  skillBalanceMode: false,
};

const courtStates: Record<string, CourtSessionState> = {
  c1: { startTime: 0, currentRoundId: null },
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
      courtStates,
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
      courtStates,
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
      courtStates,
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
      courtStates,
      rounds: [],
      requests,
      playerStats: stats({}),
      now: 60 * 60000,
    });
    expect(summary.unhonoredRequests).toEqual([{ fromName: "Alice", targetName: "Bob", kind: "with" }]);
  });

  it("computes per-court utilization as played time over active block time", () => {
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
      courtStates,
      rounds,
      requests: [],
      playerStats: stats({}),
      now: 60 * 60000,
    });
    expect(summary.courtUtilization).toHaveLength(1);
    expect(summary.courtUtilization[0].activeMinutes).toBe(60);
    expect(summary.courtUtilization[0].playedMinutes).toBe(30);
    expect(summary.courtUtilization[0].utilization).toBeCloseTo(0.5);
  });
});
