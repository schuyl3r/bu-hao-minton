"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { TierBadge } from "@/components/ui/TierBadge";
import { RequestSheet } from "@/components/players/RequestSheet";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { TIERS, type PlayerProfile, type PlayerStatus, type Tier } from "@/lib/types";

const STATUS_LABEL: Record<PlayerStatus, string> = {
  "not-arrived": "Not arrived",
  present: "Present",
  resting: "Resting",
};

export function PlayerRow({ player }: { player: PlayerProfile }) {
  const [mode, setMode] = useState<"view" | "edit" | "remove">("view");
  const [showRequests, setShowRequests] = useState(false);
  const [editName, setEditName] = useState(player.name);
  const [editTier, setEditTier] = useState<Tier | undefined>(player.tier);

  const updatePlayer = useConfigStore((s) => s.updatePlayer);
  const removePlayer = useConfigStore((s) => s.removePlayer);
  const session = useSessionStore((s) => s.session);
  const stats = useSessionStore((s) => s.playerStats[player.id]);
  const setAttendance = useSessionStore((s) => s.setAttendance);
  const setResting = useSessionStore((s) => s.setResting);
  const pendingRequestCount = useSessionStore(
    (s) =>
      s.requests.filter((r) => r.fromPlayerId === player.id && r.status === "pending")
        .length,
  );

  const hasActiveSession = Boolean(session && !session.endedAt);
  const status: PlayerStatus = stats?.status ?? "not-arrived";

  if (mode === "edit") {
    return (
      <li className="rounded-xl border border-hairline bg-ink-raised p-3">
        <input
          autoFocus
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          className="w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line focus:outline-none"
        />
        <div className="mt-2 flex gap-1.5">
          {TIERS.map((t) => (
            <button
              key={t}
              onClick={() => setEditTier(editTier === t ? undefined : t)}
              className={`h-9 flex-1 rounded-lg text-sm font-semibold ${editTier === t ? "bg-court-bright text-line" : "bg-ink-overlay text-line-dim"}`}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mt-3 flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setMode("view")}>
            Cancel
          </Button>
          <Button
            fullWidth
            disabled={!editName.trim()}
            onClick={() => {
              updatePlayer(player.id, { name: editName.trim(), tier: editTier });
              setMode("view");
            }}
          >
            Save
          </Button>
        </div>
      </li>
    );
  }

  return (
    <li className="rounded-xl border border-hairline bg-ink-raised p-3">
      <div className="flex items-center gap-3">
        <TierBadge tier={player.tier} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-semibold text-line">{player.name}</p>
          {hasActiveSession && (
            <p className="text-xs text-line-dim">
              {stats?.gamesPlayed ?? 0} game{stats?.gamesPlayed === 1 ? "" : "s"} played
              {pendingRequestCount > 0 && (
                <span className="text-shuttle"> · {pendingRequestCount} queued request{pendingRequestCount === 1 ? "" : "s"}</span>
              )}
            </p>
          )}
        </div>
        {mode === "remove" ? (
          <div className="flex shrink-0 gap-1.5">
            <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => setMode("view")}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="px-2.5 py-1.5 text-xs"
              onClick={() => removePlayer(player.id)}
            >
              Confirm
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 gap-1">
            {hasActiveSession && (
              <button
                onClick={() => setShowRequests(true)}
                aria-label="Request a match"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-overlay text-line-dim"
              >
                +
              </button>
            )}
            <button
              onClick={() => setMode("edit")}
              aria-label="Edit player"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-overlay text-line-dim"
            >
              ✎
            </button>
            <button
              onClick={() => setMode("remove")}
              aria-label="Remove player"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-overlay text-line-dim"
            >
              ×
            </button>
          </div>
        )}
      </div>

      {hasActiveSession && (
        <div className="mt-2.5 flex gap-1.5">
          <button
            onClick={() => setAttendance(player.id, false)}
            className={`h-8 flex-1 rounded-lg text-xs font-semibold ${status === "not-arrived" ? "bg-ink-overlay text-line" : "bg-transparent text-line-dim"}`}
          >
            Not arrived
          </button>
          <button
            onClick={() => setAttendance(player.id, true)}
            className={`h-8 flex-1 rounded-lg text-xs font-semibold ${status === "present" ? "bg-in/20 text-in" : "bg-transparent text-line-dim"}`}
          >
            Present
          </button>
          <button
            disabled={status === "not-arrived"}
            onClick={() => setResting(player.id, status !== "resting")}
            className={`h-8 flex-1 rounded-lg text-xs font-semibold disabled:opacity-30 ${status === "resting" ? "bg-bench/20 text-bench" : "bg-transparent text-line-dim"}`}
          >
            Resting
          </button>
        </div>
      )}

      {!hasActiveSession && (
        <div className="mt-2">
          <Chip>{STATUS_LABEL[status]} · start a session to take attendance</Chip>
        </div>
      )}

      {showRequests && (
        <RequestSheet fromPlayer={player} onClose={() => setShowRequests(false)} />
      )}
    </li>
  );
}
