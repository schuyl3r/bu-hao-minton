"use client";

import { useEffect, useRef, useState } from "react";
import { AddPlayerForm } from "@/components/players/AddPlayerForm";
import { PlayerRow } from "@/components/players/PlayerRow";
import { RestOfRoster } from "@/components/players/RestOfRoster";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchIcon, TrashIcon, XIcon } from "@/components/ui/icons";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { findBestNameMatch } from "@/lib/search";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";

const STATUS_ORDER = { present: 0, resting: 1, "not-arrived": 2 } as const;

// Search and sort only earn their space once the roster is long enough that
// finding someone by eye actually gets hard — below this, they're just
// clutter above an already-scannable list.
const TOOLS_THRESHOLD = 8;

type SortMode = "default" | "name" | "games";
const SORT_LABEL: Record<SortMode, string> = {
  default: "Default",
  name: "Name",
  games: "Games",
};

export default function PlayersPage() {
  const players = useConfigStore((s) => s.players);
  const courts = useConfigStore((s) => s.courts);
  const clearPlayers = useConfigStore((s) => s.clearPlayers);
  const playerStats = useSessionStore((s) => s.playerStats);
  const rounds = useSessionStore((s) => s.rounds);
  const cancelRound = useSessionStore((s) => s.cancelRound);
  const hasActiveSession = useSessionStore((s) => Boolean(s.session && !s.session.endedAt));

  const [search, setSearch] = useState("");
  const [matchedId, setMatchedId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>("default");
  const [confirmingClear, setConfirmingClear] = useState(false);
  const highlightTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Players seated in an in-progress round get pulled into their own
  // section further down, with their court + how-long-they've-been-on
  // attached, and disappear from the regular roster list while playing.
  const playingInfo: Record<string, { courtLabel: string; since: number }> = {};
  for (const round of rounds) {
    if (round.status !== "in-progress") continue;
    const courtLabel = courts.find((c) => c.id === round.courtId)?.label ?? "Court";
    for (const playerId of round.players) {
      playingInfo[playerId] = { courtLabel, since: round.startedAt };
    }
  }

  const roster = players.filter((p) => !playingInfo[p.id]);
  const playing = players.filter((p) => playingInfo[p.id]);

  // Once a session is running, attendance splits the roster in two: who's
  // actually here this week vs. everyone else known but not yet added —
  // pre-session there's no attendance concept yet, so it stays one flat list.
  const thisWeek = hasActiveSession
    ? roster.filter((p) => (playerStats[p.id]?.status ?? "not-arrived") !== "not-arrived")
    : roster;
  const restOfRoster = hasActiveSession
    ? roster.filter((p) => (playerStats[p.id]?.status ?? "not-arrived") === "not-arrived")
    : [];

  // Search doesn't filter the list — it scrolls the page to the best match
  // and briefly flashes that row, so the full roster stays visible and
  // nothing else jumps around while you type. Rest of Roster has its own,
  // separate search for filtering + adding, so this only needs to find rows
  // actually rendered as full PlayerRow cards (playing + This Week).
  useEffect(() => {
    if (!search.trim()) return;
    const debounce = setTimeout(() => {
      const match = findBestNameMatch(players, search);
      if (!match) return;
      setMatchedId(match.id);
      document
        .getElementById(`player-row-${match.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
      clearTimeout(highlightTimeout.current);
      highlightTimeout.current = setTimeout(() => setMatchedId(null), 1100);
    }, 200);
    return () => clearTimeout(debounce);
  }, [search, players]);

  const sorted = [...thisWeek].sort((a, b) => {
    if (sortMode === "name") return a.name.localeCompare(b.name);
    if (sortMode === "games") {
      const ga = playerStats[a.id]?.gamesPlayed ?? 0;
      const gb = playerStats[b.id]?.gamesPlayed ?? 0;
      return ga - gb;
    }
    if (!hasActiveSession) return 0;
    const sa = playerStats[a.id]?.status ?? "not-arrived";
    const sb = playerStats[b.id]?.status ?? "not-arrived";
    return STATUS_ORDER[sa] - STATUS_ORDER[sb];
  });

  const presentCount = players.filter(
    (p) => (playerStats[p.id]?.status ?? "not-arrived") !== "not-arrived",
  ).length;

  const showTools = sorted.length > TOOLS_THRESHOLD;

  const clearAll = () => {
    // Every in-progress or queued round necessarily includes someone about
    // to be removed, so cancel first — otherwise a round is left pointing at
    // players that no longer exist.
    rounds
      .filter((r) => r.status === "in-progress" || r.status === "queued")
      .forEach((r) => cancelRound(r.id));
    clearPlayers();
    setConfirmingClear(false);
  };

  return (
    <main className="flex-1 px-4">
      <SectionHeader
        title="Players"
        action={
          hasActiveSession && (
            <span className="pb-1 text-xs font-medium text-line-dim">
              {presentCount}/{players.length} here
            </span>
          )
        }
      />

      <div className="mb-3">
        <AddPlayerForm />
      </div>

      {showTools && (
        <div className="mb-3 flex flex-col gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-line-dim" />
            <input
              value={search}
              onChange={(e) => {
                const value = e.target.value;
                setSearch(value);
                if (!value.trim()) setMatchedId(null);
              }}
              placeholder="Jump to a player..."
              className="h-10 w-full rounded-lg border border-hairline bg-ink-raised pl-9 pr-8 text-sm text-line placeholder:text-line-dim focus:outline-none focus:ring-1 focus:ring-court-bright"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setMatchedId(null);
                }}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-line-dim"
              >
                <XIcon className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex gap-1.5">
            {(Object.keys(SORT_LABEL) as SortMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`h-8 flex-1 rounded-lg text-xs font-semibold transition-colors ${sortMode === mode ? "bg-ink-overlay text-line" : "bg-transparent text-line-dim"}`}
              >
                {SORT_LABEL[mode]}
              </button>
            ))}
          </div>
        </div>
      )}

      {playing.length > 0 && (
        <div className="mb-3">
          <h2 className="mb-2 font-display text-xl tracking-wide text-in">
            PLAYING NOW ({playing.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {playing.map((p) => (
              <PlayerRow
                key={p.id}
                player={p}
                playingOnCourtLabel={playingInfo[p.id].courtLabel}
                playingSince={playingInfo[p.id].since}
                highlighted={p.id === matchedId}
              />
            ))}
          </ul>
        </div>
      )}

      {!hasActiveSession ? (
        sorted.length === 0 ? (
          playing.length === 0 && (
            <EmptyState
              title="No players yet"
              hint="Add everyone on your roster — you'll only need to do this once."
            />
          )
        ) : (
          <ul className="flex flex-col gap-2">
            {sorted.map((p) => (
              <PlayerRow key={p.id} player={p} highlighted={p.id === matchedId} />
            ))}
          </ul>
        )
      ) : (
        <>
          <h2 className="mb-2 font-display text-xl tracking-wide text-line">
            THIS WEEK ({sorted.length})
          </h2>
          {sorted.length === 0 ? (
            <p className="mb-5 px-1 text-xs text-line-dim">
              Nobody added yet — pick names from Rest of Roster below.
            </p>
          ) : (
            <ul className="mb-5 flex flex-col gap-2">
              {sorted.map((p) => (
                <PlayerRow key={p.id} player={p} highlighted={p.id === matchedId} />
              ))}
            </ul>
          )}
          <RestOfRoster players={restOfRoster} allPlayers={players} />
        </>
      )}

      {players.length > 0 && (
        <div className="mb-8 mt-6">
          {!confirmingClear ? (
            <button
              onClick={() => setConfirmingClear(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-semibold text-line-dim"
            >
              <TrashIcon className="h-4 w-4" />
              Clear all players
            </button>
          ) : (
            <div className="animate-reveal rounded-lg border border-bench/40 bg-bench/10 p-3">
              <p className="text-sm font-medium text-bench">
                This removes your entire roster — {players.length} player
                {players.length === 1 ? "" : "s"} — for good. Courts and session history
                aren&apos;t affected.
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" fullWidth onClick={() => setConfirmingClear(false)}>
                  Cancel
                </Button>
                <Button variant="danger" fullWidth onClick={clearAll}>
                  Clear All
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
