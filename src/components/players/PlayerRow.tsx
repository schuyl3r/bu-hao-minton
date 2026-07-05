"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { PencilIcon, TrashIcon, UserPlusIcon } from "@/components/ui/icons";
import { LiveElapsed } from "@/components/ui/LiveElapsed";
import { TierBadge } from "@/components/ui/TierBadge";
import { RequestSheet } from "@/components/players/RequestSheet";
import { fileToAvatarDataUrl } from "@/lib/image";
import { averageGamesPlayed, gamesPlayedColorClass } from "@/lib/stats";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { TIERS, type PlayerProfile, type PlayerStatus } from "@/lib/types";

const STATUS_LABEL: Record<PlayerStatus, string> = {
  "not-arrived": "Not arrived",
  present: "Present",
  resting: "Resting",
};

/** Focuses the next player-name input in DOM order, for fast batch renaming
 *  (type a name, hit Enter, land straight in the next row — no re-tapping
 *  into edit mode for each of a dozen freshly auto-generated slots). */
function focusNextNameInput(current: HTMLInputElement) {
  const inputs = Array.from(
    document.querySelectorAll<HTMLInputElement>("[data-player-name-input]"),
  );
  const index = inputs.indexOf(current);
  const next = inputs[index + 1];
  if (next) {
    next.focus();
    next.select();
  } else {
    current.blur();
  }
}

export function PlayerRow({
  player,
  playingOnCourtLabel,
  playingSince,
  highlighted,
}: {
  player: PlayerProfile;
  /** Set when this player is seated in an in-progress round — locks every
   *  control below that could change randomizer inputs mid-round. */
  playingOnCourtLabel?: string;
  playingSince?: number;
  /** Briefly flashes this row — used by the Players page search, which
   *  scrolls to the best match instead of filtering the list. */
  highlighted?: boolean;
}) {
  const [removing, setRemoving] = useState(false);
  const [editingTier, setEditingTier] = useState(false);
  const [showRequests, setShowRequests] = useState(false);
  const [name, setName] = useState(player.name);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const updatePlayer = useConfigStore((s) => s.updatePlayer);
  const removePlayer = useConfigStore((s) => s.removePlayer);
  const session = useSessionStore((s) => s.session);
  const stats = useSessionStore((s) => s.playerStats[player.id]);
  const allStats = useSessionStore((s) => s.playerStats);
  const setAttendance = useSessionStore((s) => s.setAttendance);
  const setResting = useSessionStore((s) => s.setResting);
  const cancelActiveRoundForPlayer = useSessionStore((s) => s.cancelActiveRoundForPlayer);
  const pendingRequestCount = useSessionStore(
    (s) =>
      s.requests.filter((r) => r.fromPlayerId === player.id && r.status === "pending")
        .length,
  );

  const hasActiveSession = Boolean(session && !session.endedAt);
  const status: PlayerStatus = stats?.status ?? "not-arrived";
  const isPlaying = Boolean(playingOnCourtLabel);

  const gamesPlayed = stats?.gamesPlayed ?? 0;
  const gamesColor = gamesPlayedColorClass(gamesPlayed, averageGamesPlayed(allStats));

  // Tiers only mean anything when skill balance mode is actually weighing
  // them — outside of a session (still building the roster) tier-setting
  // stays open, but once a session is running without skill balance on,
  // editing would just be a no-op the randomizer never looks at.
  const tierLocked = hasActiveSession && !session?.skillBalanceMode;

  const commitName = () => {
    const trimmed = name.trim();
    if (trimmed && trimmed !== player.name) {
      updatePlayer(player.id, { name: trimmed });
    } else {
      setName(player.name);
    }
  };

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await fileToAvatarDataUrl(file);
    updatePlayer(player.id, { avatar: dataUrl });
  };

  return (
    <li
      id={`player-row-${player.id}`}
      className={`rounded-xl border p-3.5 transition-colors ${isPlaying ? "border-in/40 bg-in/5" : "border-hairline bg-ink-raised"} ${highlighted ? "animate-search-highlight" : ""}`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => avatarInputRef.current?.click()}
          aria-label="Change photo"
          className="shrink-0"
        >
          <TierBadge tier={player.tier} avatar={player.avatar} size="md" />
        </button>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarChange}
        />
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <input
            data-player-name-input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onFocus={(e) => e.currentTarget.select()}
            onBlur={commitName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                commitName();
                focusNextNameInput(e.currentTarget);
              }
            }}
            className="w-full min-w-0 truncate rounded-md bg-ink-overlay/60 px-1.5 py-0.5 -mx-1.5 text-[15px] font-semibold text-line focus:bg-ink-overlay focus:outline-none"
          />
          <PencilIcon className="h-3 w-3 shrink-0 text-line-dim" />
        </div>
        {removing ? (
          <div className="flex shrink-0 animate-reveal gap-1.5">
            <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => setRemoving(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              className="px-2.5 py-1.5 text-xs"
              onClick={() => {
                // A player mid-round has no surviving way to be Finished or
                // Cancelled off their court once they're gone from the
                // roster — cancel that round first so it isn't orphaned.
                cancelActiveRoundForPlayer(player.id);
                removePlayer(player.id);
              }}
            >
              Confirm
            </Button>
          </div>
        ) : (
          <div className="flex shrink-0 gap-1.5">
            {hasActiveSession && (
              <button
                onClick={() => setShowRequests(true)}
                disabled={isPlaying}
                aria-label="Request a match"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-overlay text-line-dim transition-opacity disabled:opacity-30"
              >
                <UserPlusIcon />
              </button>
            )}
            <button
              onClick={() => setEditingTier((v) => !v)}
              disabled={isPlaying}
              aria-label="Edit tier"
              className={`flex h-9 w-9 items-center justify-center rounded-lg bg-ink-overlay text-line-dim transition-opacity disabled:opacity-30 ${tierLocked ? "opacity-50" : ""}`}
            >
              <PencilIcon />
            </button>
            <button
              onClick={() => setRemoving(true)}
              disabled={isPlaying}
              aria-label="Remove player"
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-overlay text-line-dim transition-opacity disabled:opacity-30"
            >
              <TrashIcon />
            </button>
          </div>
        )}
      </div>

      {hasActiveSession && (
        <p className="mt-2 flex items-baseline gap-1 pl-[52px]">
          <span className={`font-display text-lg font-bold leading-none tabular-nums ${gamesColor}`}>
            {gamesPlayed}
          </span>
          <span className="text-xs text-line-dim">
            game{gamesPlayed === 1 ? "" : "s"} played
          </span>
          {pendingRequestCount > 0 && (
            <span className="text-xs text-shuttle">
              · {pendingRequestCount} queued request{pendingRequestCount === 1 ? "" : "s"}
            </span>
          )}
        </p>
      )}

      {editingTier && !isPlaying && (
        <div className="mt-3 flex animate-reveal flex-col gap-2">
          {tierLocked ? (
            <p className="rounded-lg bg-ink-overlay px-3 py-2 text-xs text-line-dim">
              Turn on <span className="font-semibold text-line">Skill tier balance</span> in
              Session settings to set player tiers.
            </p>
          ) : (
            <>
              <div className="flex gap-1.5">
                {TIERS.map((t) => (
                  <button
                    key={t}
                    onClick={() => {
                      updatePlayer(player.id, { tier: player.tier === t ? undefined : t });
                      setEditingTier(false);
                    }}
                    className={`h-9 flex-1 rounded-lg text-sm font-semibold transition-colors ${player.tier === t ? "bg-court-bright text-ink" : "bg-ink-overlay text-line-dim"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              {player.tier && (
                <Button
                  variant="ghost"
                  className="self-start px-2 py-1 text-xs text-bench"
                  onClick={() => {
                    updatePlayer(player.id, { tier: undefined });
                    setEditingTier(false);
                  }}
                >
                  Remove tier
                </Button>
              )}
            </>
          )}
          {player.avatar && (
            <Button
              variant="ghost"
              className="self-start px-2 py-1 text-xs text-bench"
              onClick={() => {
                updatePlayer(player.id, { avatar: undefined });
                setEditingTier(false);
              }}
            >
              Remove photo
            </Button>
          )}
        </div>
      )}

      {isPlaying ? (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-in/10 px-3 py-2">
          <span className="h-2 w-2 shrink-0 animate-pulse-slow rounded-full bg-in" />
          <span className="text-xs font-semibold text-in">Playing · {playingOnCourtLabel}</span>
          {playingSince != null && (
            <span className="ml-auto font-display text-sm tabular-nums text-in">
              <LiveElapsed since={playingSince} format="clock" />
            </span>
          )}
        </div>
      ) : hasActiveSession ? (
        <div className="mt-3 flex gap-1.5">
          <button
            onClick={() => setAttendance(player.id, false)}
            className={`h-8 flex-1 rounded-lg text-xs font-semibold transition-colors ${status === "not-arrived" ? "bg-ink-overlay text-line" : "bg-transparent text-line-dim"}`}
          >
            Not arrived
          </button>
          <button
            onClick={() => setAttendance(player.id, true)}
            className={`h-8 flex-1 rounded-lg text-xs font-semibold transition-colors ${status === "present" ? "bg-in/20 text-in" : "bg-transparent text-line-dim"}`}
          >
            Present
          </button>
          <button
            disabled={status === "not-arrived"}
            onClick={() => setResting(player.id, status !== "resting")}
            className={`h-8 flex-1 rounded-lg text-xs font-semibold transition-colors disabled:opacity-30 ${status === "resting" ? "bg-bench/20 text-bench" : "bg-transparent text-line-dim"}`}
          >
            Resting
          </button>
        </div>
      ) : (
        <div className="mt-3">
          <Chip>{STATUS_LABEL[status]} · start a session to take attendance</Chip>
        </div>
      )}

      {showRequests && (
        <RequestSheet fromPlayer={player} onClose={() => setShowRequests(false)} />
      )}
    </li>
  );
}
