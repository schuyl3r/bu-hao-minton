import { describe, expect, it } from "vitest";
import { activateReadyQueuedRounds } from "@/lib/store/queueActivation";
import type { CourtSessionState, Round } from "@/lib/types";

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

function courtState(overrides: Partial<CourtSessionState> = {}): CourtSessionState {
  return { currentRoundId: null, queuedRoundId: null, ...overrides };
}

describe("activateReadyQueuedRounds", () => {
  it("leaves a queued round alone when not all 4 players are free yet", () => {
    const rounds = [
      round({ id: "r1", courtId: "court-1", status: "in-progress", players: ["A", "B", "C", "D"] }),
      round({ id: "r2", courtId: "court-2", status: "queued", players: ["A", "E", "F", "G"] }),
    ];
    const courtStates = {
      "court-1": courtState({ currentRoundId: "r1" }),
      "court-2": courtState({ queuedRoundId: "r2" }),
    };
    const result = activateReadyQueuedRounds(rounds, courtStates);
    expect(result.rounds.find((r) => r.id === "r2")?.status).toBe("queued");
    expect(result.courtStates["court-2"].queuedRoundId).toBe("r2");
  });

  it("activates a queued round once all 4 players are free", () => {
    const rounds = [
      round({ id: "r1", courtId: "court-1", status: "finished", players: ["A", "B", "C", "D"] }),
      round({ id: "r2", courtId: "court-2", status: "queued", players: ["A", "B", "E", "F"] }),
    ];
    const courtStates = {
      "court-1": courtState({ currentRoundId: null }),
      "court-2": courtState({ queuedRoundId: "r2" }),
    };
    const result = activateReadyQueuedRounds(rounds, courtStates);
    const activated = result.rounds.find((r) => r.id === "r2");
    expect(activated?.status).toBe("in-progress");
    expect(result.courtStates["court-2"]).toEqual({ currentRoundId: "r2", queuedRoundId: null });
  });

  it("activates two independently-ready queued rounds targeting different courts in one pass", () => {
    const rounds = [
      round({ id: "r1", courtId: "court-2", status: "queued", players: ["A", "B", "C", "D"] }),
      round({ id: "r2", courtId: "court-3", status: "queued", players: ["E", "F", "G", "H"] }),
    ];
    const courtStates = {
      "court-2": courtState({ queuedRoundId: "r1" }),
      "court-3": courtState({ queuedRoundId: "r2" }),
    };
    const result = activateReadyQueuedRounds(rounds, courtStates);
    expect(result.rounds.every((r) => r.status === "in-progress")).toBe(true);
    expect(result.courtStates["court-2"]).toEqual({ currentRoundId: "r1", queuedRoundId: null });
    expect(result.courtStates["court-3"]).toEqual({ currentRoundId: "r2", queuedRoundId: null });
  });

  it("activates a queued round on the same court as its own just-finished round", () => {
    const rounds = [
      round({ id: "r1", courtId: "court-1", status: "finished", players: ["A", "B", "C", "D"] }),
      round({ id: "r2", courtId: "court-1", status: "queued", players: ["A", "B", "E", "F"] }),
    ];
    const courtStates = {
      "court-1": courtState({ currentRoundId: null, queuedRoundId: "r2" }),
    };
    const result = activateReadyQueuedRounds(rounds, courtStates);
    expect(result.courtStates["court-1"]).toEqual({ currentRoundId: "r2", queuedRoundId: null });
  });

  it("is a no-op when there are no queued rounds", () => {
    const rounds = [round({ id: "r1", status: "in-progress" })];
    const courtStates = { "court-1": courtState({ currentRoundId: "r1" }) };
    const result = activateReadyQueuedRounds(rounds, courtStates);
    expect(result.rounds).toBe(rounds);
    expect(result.courtStates).toBe(courtStates);
  });
});
