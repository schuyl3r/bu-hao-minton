import { create } from "zustand";
import { persist } from "zustand/middleware";
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
    defaultDurationMinutes: number;
    estimatedMinutesPerGame: number;
  }) => void;
  endSession: () => void;

  setAttendance: (playerId: string, present: boolean) => void;
  setResting: (playerId: string, resting: boolean) => void;

  setCatchUpMode: (on: boolean) => void;
  setSkillBalanceMode: (on: boolean) => void;
  setEstimatedMinutesPerGame: (minutes: number) => void;

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
}

function blankStats(): PlayerSessionStats {
  return { status: "not-arrived", gamesPlayed: 0, pairedWith: {}, against: {} };
}

function blankCourtState(): CourtSessionState {
  return { startTime: null, currentRoundId: null };
}

function bump(record: Record<string, number>, key: string) {
  record[key] = (record[key] ?? 0) + 1;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      session: null,
      playerStats: {},
      courtStates: {},
      rounds: [],
      requests: [],

      startNewSession: ({ defaultDurationMinutes, estimatedMinutesPerGame }) => {
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
            defaultDurationMinutes,
            estimatedMinutesPerGame,
            catchUpMode: false,
            skillBalanceMode: false,
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
          const existing = s.playerStats[playerId] ?? blankStats();
          if (existing.status === "resting" && present) return s;
          return {
            playerStats: {
              ...s.playerStats,
              [playerId]: { ...existing, status: present ? "present" : "not-arrived" },
            },
          };
        }),

      setResting: (playerId, resting) =>
        set((s) => {
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

      setEstimatedMinutesPerGame: (minutes) =>
        set((s) => ({
          session: s.session
            ? { ...s.session, estimatedMinutesPerGame: minutes }
            : s.session,
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
          const prevCourtState = s.courtStates[courtId] ?? blankCourtState();
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
              [courtId]: {
                startTime: prevCourtState.startTime ?? now,
                currentRoundId: id,
              },
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
          return {
            rounds: s.rounds.map((r) =>
              r.id === roundId ? { ...r, status: "cancelled", finishedAt: Date.now() } : r,
            ),
            courtStates: {
              ...s.courtStates,
              [round.courtId]: {
                ...s.courtStates[round.courtId],
                currentRoundId: null,
              },
            },
            // A cancelled round never happened — any requests it tentatively
            // consumed must go back to the pending queue for a future round.
            requests: s.requests.map((r) =>
              r.honoredInRoundId === roundId
                ? { ...r, status: "pending", honoredInRoundId: undefined }
                : r,
            ),
          };
        }),
    }),
    {
      name: "buhaominton-session",
      skipHydration: true,
    },
  ),
);
