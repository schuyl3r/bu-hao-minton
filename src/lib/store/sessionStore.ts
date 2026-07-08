import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getLockedPlayerIds } from "@/lib/eligibility";
import { makeId } from "@/lib/id";
import { useConfigStore } from "@/lib/store/configStore";
import { activateReadyQueuedRounds } from "@/lib/store/queueActivation";
import type {
  CourtSessionState,
  MatchRequest,
  PlayerSessionStats,
  RequestKind,
  Round,
  SessionMeta,
  ShuttlecockPricing,
} from "@/lib/types";

interface SessionState {
  session: SessionMeta | null;
  playerStats: Record<string, PlayerSessionStats>;
  courtStates: Record<string, CourtSessionState>;
  rounds: Round[];
  requests: MatchRequest[];

  startNewSession: (opts: {
    totalHours: number;
    courtCount: number;
    catchUpMode: boolean;
    skillBalanceMode: boolean;
  }) => void;
  endSession: () => void;

  setAttendance: (playerId: string, present: boolean) => void;
  setResting: (playerId: string, resting: boolean) => void;

  setCatchUpMode: (on: boolean) => void;
  setSkillBalanceMode: (on: boolean) => void;

  /** Entered after ending a session — both optional, either can be undefined to clear. */
  setSessionCosts: (courtCost?: number, shuttlecockPricing?: ShuttlecockPricing) => void;

  addRequest: (fromPlayerId: string, targetPlayerId: string, kind: RequestKind) => void;
  cancelRequest: (requestId: string) => void;

  /** Registers a freshly-created player (mid-session addition) into playerStats. */
  registerPlayer: (playerId: string) => void;
  /** Registers a freshly-created court (mid-session addition) into courtStates. */
  registerCourt: (courtId: string) => void;

  startRound: (
    courtId: string,
    players: [string, string, string, string],
    teams: [[string, string], [string, string]],
    honoredRequestIds: string[],
  ) => string;
  finishRound: (roundId: string, shuttlecocksUsed?: number) => void;
  cancelRound: (roundId: string) => void;
  /** Live-updates the shuttlecock count on an in-progress round, so it can
   *  be tracked as they're used rather than only entered at Mark Complete. */
  updateRoundShuttlecocks: (roundId: string, count: number) => void;

  /**
   * Reserves `players` for `courtId`'s next round even though some/all of
   * them may still be busy on another court right now. They're hard-locked
   * out of every other court's eligible pool immediately; the round
   * auto-activates onto `courtId` the instant all 4 are actually free. A
   * no-op (returns "") if `courtId` already has a pending queued round.
   */
  queueRound: (
    courtId: string,
    players: [string, string, string, string],
    teams: [[string, string], [string, string]],
    honoredRequestIds: string[],
  ) => string;
  /** Cancels a pending queued round, releasing any of its already-free players. */
  cancelQueuedRound: (roundId: string) => void;

  /** Cancels any in-progress or queued round on this court, so it can be safely removed. */
  cancelActiveRoundForCourt: (courtId: string) => void;
  /** Cancels any in-progress or queued round this player is seated in, so they can be safely removed. */
  cancelActiveRoundForPlayer: (playerId: string) => void;
}

function blankStats(): PlayerSessionStats {
  return { status: "not-arrived", gamesPlayed: 0, pairedWith: {}, against: {} };
}

function blankCourtState(): CourtSessionState {
  return { currentRoundId: null, queuedRoundId: null };
}

function bump(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1;
}

/** Shared by finishRound/cancelRound cleanup paths below. */
function cancelRoundInState(
  s: Pick<SessionState, "rounds" | "courtStates" | "requests">,
  round: Round,
) {
  const field = round.status === "queued" ? "queuedRoundId" : "currentRoundId";
  const { rounds, courtStates } = activateReadyQueuedRounds(
    s.rounds.map((r) =>
      r.id === round.id ? { ...r, status: "cancelled" as const, finishedAt: Date.now() } : r,
    ),
    {
      ...s.courtStates,
      [round.courtId]: { ...s.courtStates[round.courtId], [field]: null },
    },
  );
  return {
    rounds,
    courtStates,
    requests: s.requests.map((r) =>
      r.honoredInRoundId === round.id
        ? { ...r, status: "pending" as const, honoredInRoundId: undefined }
        : r,
    ),
  };
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      playerStats: {},
      courtStates: {},
      rounds: [],
      requests: [],

      startNewSession: ({ totalHours, courtCount, catchUpMode, skillBalanceMode }) => {
        // Gap-fill: only ever ADD court slots to reach the requested count,
        // never duplicate or touch what's already saved. Players aren't
        // gap-filled — the saved roster carries over as-is and attendance is
        // picked explicitly (Players tab) rather than declared as a count.
        const configState = useConfigStore.getState();
        for (let i = configState.courts.length; i < courtCount; i++) {
          useConfigStore.getState().addCourt(`Court ${i + 1}`);
        }

        const { players, courts } = useConfigStore.getState();
        const playerStats: Record<string, PlayerSessionStats> = {};
        players.forEach((p) => {
          playerStats[p.id] = blankStats();
        });
        const courtStates: Record<string, CourtSessionState> = {};
        courts.forEach((c) => {
          courtStates[c.id] = blankCourtState();
        });
        set({
          session: {
            id: makeId(),
            startedAt: Date.now(),
            endedAt: null,
            totalHours,
            catchUpMode,
            skillBalanceMode,
          },
          playerStats,
          courtStates,
          rounds: [],
          requests: [],
        });
      },

      endSession: () =>
        set((s) => ({
          session: s.session ? { ...s.session, endedAt: Date.now() } : s.session,
        })),

      setAttendance: (playerId, present) =>
        set((s) => {
          // A player mid-round (or reserved by a pending queue) is a
          // randomizer input that's already locked in — don't let attendance
          // change out from under it. The UI disables these controls too;
          // this is the backstop.
          if (getLockedPlayerIds(s.rounds).has(playerId)) return s;
          const existing = s.playerStats[playerId] ?? blankStats();
          return {
            playerStats: {
              ...s.playerStats,
              [playerId]: { ...existing, status: present ? "present" : "not-arrived" },
            },
          };
        }),

      setResting: (playerId, resting) =>
        set((s) => {
          if (getLockedPlayerIds(s.rounds).has(playerId)) return s;
          const existing = s.playerStats[playerId];
          if (!existing || existing.status === "not-arrived") return s;
          return {
            playerStats: {
              ...s.playerStats,
              [playerId]: { ...existing, status: resting ? "resting" : "present" },
            },
          };
        }),

      setCatchUpMode: (on) =>
        set((s) => ({ session: s.session ? { ...s.session, catchUpMode: on } : s.session })),

      setSkillBalanceMode: (on) =>
        set((s) => ({
          session: s.session ? { ...s.session, skillBalanceMode: on } : s.session,
        })),

      setSessionCosts: (courtCost, shuttlecockPricing) =>
        set((s) => ({
          session: s.session ? { ...s.session, courtCost, shuttlecockPricing } : s.session,
        })),

      addRequest: (fromPlayerId, targetPlayerId, kind) =>
        set((s) => ({
          requests: [
            ...s.requests,
            {
              id: makeId(),
              fromPlayerId,
              targetPlayerId,
              kind,
              status: "pending",
              createdAt: Date.now(),
            },
          ],
        })),

      cancelRequest: (requestId) =>
        set((s) => ({
          requests: s.requests.map((r) =>
            r.id === requestId ? { ...r, status: "cancelled" } : r,
          ),
        })),

      registerPlayer: (playerId) =>
        set((s) =>
          s.playerStats[playerId]
            ? s
            : { playerStats: { ...s.playerStats, [playerId]: blankStats() } },
        ),

      registerCourt: (courtId) =>
        set((s) =>
          s.courtStates[courtId]
            ? s
            : { courtStates: { ...s.courtStates, [courtId]: blankCourtState() } },
        ),

      startRound: (courtId, players, teams, honoredRequestIds) => {
        const id = makeId();
        const now = Date.now();
        let started = false;
        set((s) => {
          // A pending queued round already owns this court's "next round" —
          // don't let a manual start race ahead of it. The UI hides the
          // Randomize action in this state too; this is the backstop.
          if (s.courtStates[courtId]?.queuedRoundId) return s;
          started = true;
          const requestIds = new Set(honoredRequestIds);
          return {
            rounds: [
              ...s.rounds,
              {
                id,
                courtId,
                players,
                teams,
                startedAt: now,
                finishedAt: null,
                status: "in-progress",
              },
            ],
            courtStates: {
              ...s.courtStates,
              [courtId]: { ...s.courtStates[courtId], currentRoundId: id },
            },
            requests: s.requests.map((r) =>
              requestIds.has(r.id)
                ? { ...r, status: "honored", honoredInRoundId: id }
                : r,
            ),
          };
        });
        return started ? id : "";
      },

      queueRound: (courtId, players, teams, honoredRequestIds) => {
        const id = makeId();
        const now = Date.now();
        let queued = false;
        set((s) => {
          if (s.courtStates[courtId]?.queuedRoundId) return s;
          queued = true;
          const requestIds = new Set(honoredRequestIds);
          return {
            rounds: [
              ...s.rounds,
              {
                id,
                courtId,
                players,
                teams,
                startedAt: now,
                finishedAt: null,
                status: "queued",
              },
            ],
            courtStates: {
              ...s.courtStates,
              [courtId]: { ...s.courtStates[courtId], queuedRoundId: id },
            },
            requests: s.requests.map((r) =>
              requestIds.has(r.id)
                ? { ...r, status: "honored", honoredInRoundId: id }
                : r,
            ),
          };
        });
        return queued ? id : "";
      },

      finishRound: (roundId, shuttlecocksUsed) =>
        set((s) => {
          const round = s.rounds.find((r) => r.id === roundId);
          if (!round || round.status !== "in-progress") return s;

          const playerStats = { ...s.playerStats };
          const [teamA, teamB] = round.teams;
          round.players.forEach((pid) => {
            const stats = playerStats[pid] ?? blankStats();
            playerStats[pid] = {
              ...stats,
              gamesPlayed: stats.gamesPlayed + 1,
              pairedWith: { ...stats.pairedWith },
              against: { ...stats.against },
            };
          });
          const recordPair = (a: string, b: string, key: "pairedWith" | "against") => {
            bump(playerStats[a][key], b);
            bump(playerStats[b][key], a);
          };
          recordPair(teamA[0], teamA[1], "pairedWith");
          recordPair(teamB[0], teamB[1], "pairedWith");
          teamA.forEach((a) => teamB.forEach((b) => recordPair(a, b, "against")));

          const finishedRounds = s.rounds.map((r) =>
            r.id === roundId
              ? { ...r, status: "finished" as const, finishedAt: Date.now(), shuttlecocksUsed }
              : r,
          );
          const { rounds, courtStates } = activateReadyQueuedRounds(finishedRounds, {
            ...s.courtStates,
            [round.courtId]: {
              ...s.courtStates[round.courtId],
              currentRoundId: null,
            },
          });

          return { playerStats, rounds, courtStates };
        }),

      cancelRound: (roundId) =>
        set((s) => {
          const round = s.rounds.find((r) => r.id === roundId);
          if (!round || (round.status !== "in-progress" && round.status !== "queued")) return s;
          return cancelRoundInState(s, round);
        }),

      cancelQueuedRound: (roundId) =>
        set((s) => {
          const round = s.rounds.find((r) => r.id === roundId);
          if (!round || round.status !== "queued") return s;
          return cancelRoundInState(s, round);
        }),

      updateRoundShuttlecocks: (roundId, count) =>
        set((s) => {
          const round = s.rounds.find((r) => r.id === roundId);
          if (!round || round.status !== "in-progress") return s;
          const clamped = Math.max(0, Math.round(count));
          return {
            rounds: s.rounds.map((r) =>
              r.id === roundId ? { ...r, shuttlecocksUsed: clamped } : r,
            ),
          };
        }),

      cancelActiveRoundForCourt: (courtId) =>
        set((s) => {
          // A court can have BOTH an in-progress round and its own queued
          // next-round waiting at once (self-queue) — cancel whichever of
          // those exist in one shot (not via a per-round loop through
          // cancelRoundInState, which would let cancelling the first
          // auto-activate the second via activateReadyQueuedRounds before
          // the second cancellation runs, based on its now-stale status).
          const activeIds = new Set(
            s.rounds
              .filter(
                (r) => r.courtId === courtId && (r.status === "in-progress" || r.status === "queued"),
              )
              .map((r) => r.id),
          );
          if (activeIds.size === 0) return s;
          const cancelledRounds = s.rounds.map((r) =>
            activeIds.has(r.id) ? { ...r, status: "cancelled" as const, finishedAt: Date.now() } : r,
          );
          const { rounds, courtStates } = activateReadyQueuedRounds(cancelledRounds, {
            ...s.courtStates,
            [courtId]: { currentRoundId: null, queuedRoundId: null },
          });
          return {
            rounds,
            courtStates,
            requests: s.requests.map((r) =>
              r.honoredInRoundId && activeIds.has(r.honoredInRoundId)
                ? { ...r, status: "pending" as const, honoredInRoundId: undefined }
                : r,
            ),
          };
        }),

      cancelActiveRoundForPlayer: (playerId) =>
        set((s) => {
          const round = s.rounds.find(
            (r) =>
              (r.status === "in-progress" || r.status === "queued") &&
              r.players.includes(playerId),
          );
          if (!round) return s;
          return cancelRoundInState(s, round);
        }),
    }),
    {
      name: "buhaominton-session",
      skipHydration: true,
    },
  ),
);
