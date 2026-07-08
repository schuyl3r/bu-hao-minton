import { beforeEach, describe, expect, it } from "vitest";
import { getEligiblePlayerIds } from "@/lib/eligibility";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { CourtSessionState, PlayerSessionStats } from "@/lib/types";

function blankStats(): PlayerSessionStats {
  return { status: "present", gamesPlayed: 0, pairedWith: {}, against: {} };
}

function blankCourtState(): CourtSessionState {
  return { currentRoundId: null, queuedRoundId: null };
}

/** Seeds a minimal session directly (bypassing startNewSession/configStore). */
function seed(playerIds: string[], courtIds: string[]) {
  const playerStats: Record<string, PlayerSessionStats> = {};
  playerIds.forEach((id) => (playerStats[id] = blankStats()));
  const courtStates: Record<string, CourtSessionState> = {};
  courtIds.forEach((id) => (courtStates[id] = blankCourtState()));
  useSessionStore.setState({
    session: {
      id: "s1",
      startedAt: 0,
      endedAt: null,
      totalHours: 2,
      catchUpMode: false,
      skillBalanceMode: false,
    },
    playerStats,
    courtStates,
    rounds: [],
    requests: [],
  });
}

const TEAMS: [[string, string], [string, string]] = [
  ["A", "B"],
  ["C", "D"],
];

beforeEach(() => {
  useSessionStore.setState({
    session: null,
    playerStats: {},
    courtStates: {},
    rounds: [],
    requests: [],
  });
});

describe("queueRound", () => {
  it("reserves players immediately, visible on the very next eligibility read", () => {
    seed(["A", "B", "C", "D", "E"], ["court-1", "court-2"]);
    const { queueRound } = useSessionStore.getState();
    queueRound("court-2", ["A", "B", "C", "D"], TEAMS, []);

    const { playerStats, rounds } = useSessionStore.getState();
    expect(getEligiblePlayerIds(playerStats, rounds).sort()).toEqual(["E"]);
    expect(useSessionStore.getState().courtStates["court-2"].queuedRoundId).not.toBeNull();
  });

  it("is a no-op when the target court already has a pending queue", () => {
    seed(["A", "B", "C", "D", "E", "F", "G", "H"], ["court-1", "court-2"]);
    const { queueRound } = useSessionStore.getState();
    const first = queueRound("court-2", ["A", "B", "C", "D"], TEAMS, []);
    const second = queueRound("court-2", ["E", "F", "G", "H"], TEAMS, []);

    expect(first).not.toBe("");
    expect(second).toBe("");
    expect(useSessionStore.getState().rounds).toHaveLength(1);
  });
});

describe("finishRound", () => {
  it("auto-activates a fully-ready queued round on a different court", () => {
    seed(["A", "B", "C", "D", "E", "F"], ["court-1", "court-2"]);
    const { startRound, queueRound, finishRound } = useSessionStore.getState();
    const sourceRoundId = startRound("court-1", ["A", "B", "C", "D"], TEAMS, []);
    const queuedTeams: [[string, string], [string, string]] = [
      ["A", "E"],
      ["B", "F"],
    ];
    const queuedId = queueRound("court-2", ["A", "E", "B", "F"], queuedTeams, []);

    finishRound(sourceRoundId);

    const state = useSessionStore.getState();
    const activated = state.rounds.find((r) => r.id === queuedId);
    expect(activated?.status).toBe("in-progress");
    expect(state.courtStates["court-2"].currentRoundId).toBe(queuedId);
    expect(state.courtStates["court-2"].queuedRoundId).toBeNull();
  });
});

describe("cancelRound (cancel-not-finish path)", () => {
  it("also triggers activation of a queued round waiting on the cancelled round's players", () => {
    seed(["A", "B", "C", "D", "E", "F"], ["court-1", "court-2"]);
    const { startRound, queueRound, cancelRound } = useSessionStore.getState();
    const sourceRoundId = startRound("court-1", ["A", "B", "C", "D"], TEAMS, []);
    const queuedTeams: [[string, string], [string, string]] = [
      ["A", "E"],
      ["B", "F"],
    ];
    const queuedId = queueRound("court-2", ["A", "E", "B", "F"], queuedTeams, []);

    cancelRound(sourceRoundId);

    const state = useSessionStore.getState();
    expect(state.rounds.find((r) => r.id === queuedId)?.status).toBe("in-progress");
    expect(state.courtStates["court-2"].currentRoundId).toBe(queuedId);
  });
});

describe("cancelQueuedRound", () => {
  it("releases already-free players but leaves still-busy players untouched", () => {
    seed(["A", "B", "C", "D", "E", "F"], ["court-1", "court-2"]);
    const { startRound, queueRound, cancelQueuedRound } = useSessionStore.getState();
    startRound("court-1", ["A", "B", "C", "D"], TEAMS, []);
    const queuedTeams: [[string, string], [string, string]] = [
      ["A", "E"],
      ["B", "F"],
    ];
    const queuedId = queueRound("court-2", ["A", "E", "B", "F"], queuedTeams, []);

    cancelQueuedRound(queuedId);

    const state = useSessionStore.getState();
    expect(state.rounds.find((r) => r.id === queuedId)?.status).toBe("cancelled");
    // E and F were only reserved, never busy — they're free again.
    expect(getEligiblePlayerIds(state.playerStats, state.rounds).sort()).toEqual(["E", "F"]);
    expect(state.courtStates["court-2"].queuedRoundId).toBeNull();
  });
});

describe("startRound", () => {
  it("is a no-op on a court with a pending queued round", () => {
    seed(["A", "B", "C", "D", "E", "F", "G", "H"], ["court-1", "court-2"]);
    const { queueRound, startRound } = useSessionStore.getState();
    queueRound("court-2", ["A", "B", "C", "D"], TEAMS, []);
    const result = startRound("court-2", ["E", "F", "G", "H"], TEAMS, []);

    expect(result).toBe("");
    expect(useSessionStore.getState().rounds).toHaveLength(1);
  });
});

describe("cancelActiveRoundForCourt", () => {
  it("cancels both an in-progress AND a queued round on the same court", () => {
    seed(["A", "B", "C", "D", "E", "F", "G", "H"], ["court-1"]);
    const { startRound, queueRound, cancelActiveRoundForCourt } = useSessionStore.getState();
    // Self-queue: court-1 queues its own next round while still playing.
    startRound("court-1", ["A", "B", "C", "D"], TEAMS, []);
    const queuedTeams: [[string, string], [string, string]] = [
      ["A", "E"],
      ["B", "F"],
    ];
    queueRound("court-1", ["A", "E", "B", "F"], queuedTeams, []);

    cancelActiveRoundForCourt("court-1");

    const state = useSessionStore.getState();
    expect(state.rounds.every((r) => r.status === "cancelled")).toBe(true);
    expect(state.courtStates["court-1"]).toEqual({ currentRoundId: null, queuedRoundId: null });
  });
});

describe("cancelActiveRoundForPlayer", () => {
  it("cancels a queued round a player is reserved in, not just an in-progress one", () => {
    seed(["A", "B", "C", "D", "E", "F"], ["court-1", "court-2"]);
    const { queueRound, cancelActiveRoundForPlayer } = useSessionStore.getState();
    const queuedId = queueRound("court-2", ["A", "B", "C", "D"], TEAMS, []);

    cancelActiveRoundForPlayer("C");

    const state = useSessionStore.getState();
    expect(state.rounds.find((r) => r.id === queuedId)?.status).toBe("cancelled");
    expect(state.courtStates["court-2"].queuedRoundId).toBeNull();
  });
});

describe("request honoring around queueing", () => {
  it("honors a request at queue time and reverts it to pending on cancel", () => {
    seed(["A", "B", "C", "D"], ["court-1"]);
    useSessionStore.setState({
      requests: [
        {
          id: "req1",
          fromPlayerId: "A",
          targetPlayerId: "B",
          kind: "with",
          status: "pending",
          createdAt: 0,
        },
      ],
    });
    const { queueRound, cancelQueuedRound } = useSessionStore.getState();
    const queuedId = queueRound("court-1", ["A", "B", "C", "D"], TEAMS, ["req1"]);
    expect(useSessionStore.getState().requests[0].status).toBe("honored");

    cancelQueuedRound(queuedId);
    expect(useSessionStore.getState().requests[0].status).toBe("pending");
    expect(useSessionStore.getState().requests[0].honoredInRoundId).toBeUndefined();
  });
});
