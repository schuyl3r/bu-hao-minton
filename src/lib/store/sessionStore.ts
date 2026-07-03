import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getBusyPlayerIds } from "@/lib/eligibility";
import { makeId } from "@/lib/id";
import { useConfigStore } from "@/lib/store/configStore";
import type {
  CourtSessionState,
  MatchRequest,
  PlayerSessionStats,
  RequestKind,
  Round,
  SessionMeta,
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
    playerCount: number;
    catchUpMode: boolean;
    skillBalanceMode: boolean;
  }) => void;
  endSession: () => void;

  setAttendance: (playerId: string, present: boolean) => void;
  setResting: (playerId: string, resting: boolean) => void;

  setCatchUpMode: (on: boolean) => void;
  setSkillBalanceMode: (on: boolean) => void;

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

  /** Cancels any in-progress round on this court, so it can be safely removed. */
  cancelActiveRoundForCourt: (courtId: string) => void;
  /** Cancels any in-progress round this player is seated in, so they can be safely removed. */
  cancelActiveRoundForPlayer: (playerId: string) => void;
}

function blankStats(): PlayerSessionStats {
  return { status: "not-arrived", gamesPlayed: 0, pairedWith: {}, against: {} };
}

function blankCourtState(): CourtSessionState {
  return { currentRoundId: null };
}

function bump(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1;
}

/** Shared by finishRound/cancelRound cleanup paths below. */
function cancelRoundInState(
  s: Pick<SessionState, "rounds" | "courtStates" | "requests">,
  round: Round,
) {
  return {
    rounds: s.rounds.map((r) =>
      r.id === round.id ? { ...r, status: "cancelled" as const, finishedAt: Date.now() } : r,
    ),
    courtStates: {
      ...s.courtStates,
      [round.courtId]: { ...s.courtStates[round.courtId], currentRoundId: null },
    },
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

      startNewSession: ({ totalHours, courtCount, playerCount, catchUpMode, skillBalanceMode }) => {
        // Gap-fill: only ever ADD slots to reach the requested count, never
        // duplicate or touch what's already in the persistent roster.
        const configState = useConfigStore.getState();
        for (let i = configState.players.length; i < playerCount; i++) {
          useConfigStore.getState().addPlayer(`Player ${i + 1}`);
        }
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
          // A player mid-round is a randomizer input that's already locked
          // in for this round — don't let attendance change out from under
          // it. The UI disables these controls too; this is the backstop.
          if (getBusyPlayerIds(s.rounds).has(playerId)) return s;
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
          if (getBusyPlayerIds(s.rounds).has(playerId)) return s;
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
        set((s) => {
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
              [courtId]: { currentRoundId: id },
            },
            requests: s.requests.map((r) =>
              requestIds.has(r.id)
                ? { ...r, status: "honored", honoredInRoundId: id }
                : r,
            ),
          };
        });
        return id;
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

          return {
            playerStats,
            rounds: s.rounds.map((r) =>
              r.id === roundId
                ? { ...r, status: "finished", finishedAt: Date.now(), shuttlecocksUsed }
                : r,
            ),
            courtStates: {
              ...s.courtStates,
              [round.courtId]: {
                ...s.courtStates[round.courtId],
                currentRoundId: null,
              },
            },
          };
        }),

      cancelRound: (roundId) =>
        set((s) => {
          const round = s.rounds.find((r) => r.id === roundId);
          if (!round || round.status !== "in-progress") return s;
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
          const round = s.rounds.find((r) => r.courtId === courtId && r.status === "in-progress");
          if (!round) return s;
          return cancelRoundInState(s, round);
        }),

      cancelActiveRoundForPlayer: (playerId) =>
        set((s) => {
          const round = s.rounds.find(
            (r) => r.status === "in-progress" && r.players.includes(playerId),
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
