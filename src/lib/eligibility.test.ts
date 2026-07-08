import { describe, expect, it } from "vitest";
import {
  getBusyPlayerIds,
  getEligiblePlayerIds,
  getLockedPlayerIds,
  getQueueablePlayerIds,
  getReservedPlayerIds,
} from "@/lib/eligibility";
import type { PlayerSessionStats, Round } from "@/lib/types";

function blankStats(): PlayerSessionStats {
  return { status: "present", gamesPlayed: 0, pairedWith: {}, against: {} };
}

function statsFor(ids: string[]): Record<string, PlayerSessionStats> {
  const out: Record<string, PlayerSessionStats> = {};
  ids.forEach((id) => (out[id] = blankStats()));
  return out;
}

function round(overrides: Partial<Round>): Round {
  return {
    id: "r1",
    courtId: "court-1",
    players: ["A", "B", "C", "D"],
    teams: [
      ["A", "B"],
      ["C", "D"],
    ],
    startedAt: 0,
    finishedAt: null,
    status: "in-progress",
    ...overrides,
  };
}

describe("getBusyPlayerIds", () => {
  it("only counts in-progress rounds", () => {
    const rounds = [
      round({ id: "r1", status: "in-progress", players: ["A", "B", "C", "D"] }),
      round({ id: "r2", status: "queued", players: ["E", "F", "G", "H"] }),
      round({ id: "r3", status: "finished", players: ["I", "J", "K", "L"] }),
    ];
    expect(getBusyPlayerIds(rounds)).toEqual(new Set(["A", "B", "C", "D"]));
  });
});

describe("getReservedPlayerIds", () => {
  it("only counts queued rounds", () => {
    const rounds = [
      round({ id: "r1", status: "in-progress", players: ["A", "B", "C", "D"] }),
      round({ id: "r2", status: "queued", players: ["E", "F", "G", "H"] }),
    ];
    expect(getReservedPlayerIds(rounds)).toEqual(new Set(["E", "F", "G", "H"]));
  });
});

describe("getLockedPlayerIds", () => {
  it("unions busy and reserved players", () => {
    const rounds = [
      round({ id: "r1", status: "in-progress", players: ["A", "B", "C", "D"] }),
      round({ id: "r2", status: "queued", players: ["E", "F", "G", "H"] }),
    ];
    expect(getLockedPlayerIds(rounds)).toEqual(new Set(["A", "B", "C", "D", "E", "F", "G", "H"]));
  });
});

describe("getEligiblePlayerIds", () => {
  it("excludes busy and reserved players, keeps present-and-free ones", () => {
    const playerStats = statsFor(["A", "B", "C", "D", "E", "F", "G", "H", "I"]);
    playerStats["I"].status = "resting";
    const rounds = [
      round({ id: "r1", status: "in-progress", players: ["A", "B", "C", "D"] }),
      round({ id: "r2", status: "queued", players: ["E", "F", "G", "H"] }),
    ];
    expect(getEligiblePlayerIds(playerStats, rounds).sort()).toEqual([]);
  });

  it("returns present players not locked by any round", () => {
    const playerStats = statsFor(["A", "B", "C", "D", "E"]);
    const rounds = [round({ id: "r1", status: "in-progress", players: ["A", "B", "C", "D"] })];
    expect(getEligiblePlayerIds(playerStats, rounds)).toEqual(["E"]);
  });
});

describe("getQueueablePlayerIds", () => {
  it("includes players busy on other courts (unlike getEligiblePlayerIds)", () => {
    const playerStats = statsFor(["A", "B", "C", "D", "E", "F"]);
    const rounds = [
      round({ id: "r1", courtId: "court-1", status: "in-progress", players: ["A", "B", "C", "D"] }),
    ];
    // Building a queue proposal targeting court-2 should be able to see A-D even though they're busy on court-1.
    expect(getQueueablePlayerIds(playerStats, rounds, "court-2").sort()).toEqual(
      ["A", "B", "C", "D", "E", "F"].sort(),
    );
  });

  it("excludes players reserved by a different court's pending queue", () => {
    const playerStats = statsFor(["A", "B", "C", "D", "E", "F"]);
    const rounds = [
      round({ id: "r1", courtId: "court-1", status: "in-progress", players: ["A", "B", "C", "D"] }),
      round({ id: "r2", courtId: "court-2", status: "queued", players: ["A", "B", "E", "F"] }),
    ];
    // court-3 building a queue should not see A/B/E/F (all reserved for court-2), only C/D (merely busy elsewhere).
    expect(getQueueablePlayerIds(playerStats, rounds, "court-3").sort()).toEqual(["C", "D"]);
  });

  it("includes players reserved by the SAME target court's own pending queue", () => {
    const playerStats = statsFor(["A", "B", "C", "D"]);
    const rounds = [
      round({ id: "r2", courtId: "court-2", status: "queued", players: ["A", "B", "C", "D"] }),
    ];
    expect(getQueueablePlayerIds(playerStats, rounds, "court-2").sort()).toEqual(
      ["A", "B", "C", "D"].sort(),
    );
  });
});
