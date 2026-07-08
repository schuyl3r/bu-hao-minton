"use client";

import { useState } from "react";
import { SearchIcon, XIcon } from "@/components/ui/icons";
import { TierBadge } from "@/components/ui/TierBadge";
import { filterByName } from "@/lib/search";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { PlayerProfile } from "@/lib/types";

/**
 * The rest of the saved roster who haven't been marked present this session
 * yet — search narrows a long roster down, tapping a row adds them straight
 * to "This Week", and typing a name nobody has yet offers to add them fresh.
 */
export function RestOfRoster({
  players,
  allPlayers,
}: {
  /** Not-yet-arrived, not-playing players — the pool this section draws from. */
  players: PlayerProfile[];
  /** The full roster, used only to avoid offering to create a duplicate name. */
  allPlayers: PlayerProfile[];
}) {
  const [search, setSearch] = useState("");
  const addPlayer = useConfigStore((s) => s.addPlayer);
  const setAttendance = useSessionStore((s) => s.setAttendance);

  const trimmed = search.trim();
  const filtered = trimmed ? filterByName(players, trimmed) : players;
  const exactMatch = trimmed
    ? allPlayers.find((p) => p.name.trim().toLowerCase() === trimmed.toLowerCase())
    : undefined;

  const addToSession = (playerId: string) => {
    setAttendance(playerId, true);
    setSearch("");
  };

  const addNew = () => {
    if (!trimmed || exactMatch) return;
    const id = addPlayer(trimmed);
    setAttendance(id, true);
    setSearch("");
  };

  return (
    <div>
      <h2 className="mb-2 font-display text-xl tracking-wide text-line-dim">
        REST OF ROSTER ({players.length})
      </h2>

      <div className="relative mb-2">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-line-dim" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search or add a new player..."
          className="h-10 w-full rounded-lg border border-hairline bg-ink-raised pl-9 pr-8 text-sm text-line placeholder:text-line-dim focus:outline-none focus:ring-1 focus:ring-court-bright"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            aria-label="Clear search"
            className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center text-line-dim"
          >
            <XIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length > 0 && (
        <ul className="flex flex-col gap-2">
          {filtered.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-3 rounded-xl border border-hairline bg-ink-raised px-3 py-2"
            >
              <TierBadge tier={p.tier} avatar={p.avatar} />
              <span className="min-w-0 flex-1 truncate text-[15px] text-line">{p.name}</span>
              <button
                onClick={() => addToSession(p.id)}
                className="shrink-0 rounded-lg bg-ink-overlay px-3 py-1.5 text-xs font-semibold text-in"
              >
                + Add
              </button>
            </li>
          ))}
        </ul>
      )}

      {filtered.length === 0 && !trimmed && (
        <p className="px-1 text-xs text-line-dim">
          {allPlayers.length === 0
            ? "No saved players yet — search to add your first one."
            : "Everyone known is already in this session — search to add someone new."}
        </p>
      )}

      {trimmed &&
        (exactMatch ? (
          <p className="px-1 text-xs text-line-dim">
            {exactMatch.name} is already in this session.
          </p>
        ) : (
          <button
            onClick={addNew}
            className="mt-2 w-full rounded-xl border border-dashed border-hairline px-3 py-2.5 text-sm font-medium text-line-dim"
          >
            + Add &quot;{trimmed}&quot; as new player
          </button>
        ))}
    </div>
  );
}
