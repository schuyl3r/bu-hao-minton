// Core domain types for BuHaominton.
//
// Two lifetimes are modeled explicitly:
//   - "Profile" data (players, courts) persists across sessions — you don't
//     re-enter your regular group or your venue's courts every week.
//   - "Session" data (attendance, stats, rounds, requests) resets whenever
//     a new session is started, since fairness math only means something
//     within a single night's play.

export type Tier = "A" | "B" | "C" | "D" | "E";

export const TIERS: Tier[] = ["A", "B", "C", "D", "E"];

export const TIER_VALUE: Record<Tier, number> = {
  A: 5,
  B: 4,
  C: 3,
  D: 2,
  E: 1,
};

export type PlayerStatus = "not-arrived" | "present" | "resting";

export interface PlayerProfile {
  id: string;
  name: string;
  tier?: Tier;
  /** Compressed square JPEG data URL, or undefined for the tier/? fallback. */
  avatar?: string;
}

export interface CourtProfile {
  id: string;
  label: string;
}

/** Session-scoped stats for a single player. Reset every new session. */
export interface PlayerSessionStats {
  status: PlayerStatus;
  gamesPlayed: number;
  /** playerId -> number of times on the SAME team */
  pairedWith: Record<string, number>;
  /** playerId -> number of times on OPPOSING teams */
  against: Record<string, number>;
}

/**
 * Session-scoped runtime state for a single court. Reset every new session.
 * Courts run fully independently — there's no shared block clock, so the
 * only thing tracked here is which round (if any) is currently on it. Each
 * round carries its own startedAt/finishedAt for its count-up stopwatch.
 */
export interface CourtSessionState {
  currentRoundId: string | null;
}

export type RoundStatus = "in-progress" | "finished" | "cancelled";

export interface Round {
  id: string;
  courtId: string;
  /** All 4 players in this round. */
  players: [string, string, string, string];
  /** Two teams of two, drawn from `players`. */
  teams: [[string, string], [string, string]];
  startedAt: number;
  finishedAt: number | null;
  status: RoundStatus;
  shuttlecocksUsed?: number;
}

export type RequestKind = "with" | "against";

export interface MatchRequest {
  id: string;
  fromPlayerId: string;
  targetPlayerId: string;
  kind: RequestKind;
  status: "pending" | "honored" | "cancelled";
  createdAt: number;
  honoredInRoundId?: string;
}

export interface SessionMeta {
  id: string;
  startedAt: number;
  endedAt: number | null;
  /** Informational label only — not tied to any timer, countdown, or warning. */
  totalHours: number;
  catchUpMode: boolean;
  skillBalanceMode: boolean;
}
