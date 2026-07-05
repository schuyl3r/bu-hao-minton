"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { TierBadge } from "@/components/ui/TierBadge";
import { fileToAvatarDataUrl } from "@/lib/image";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import { TIERS, type Tier } from "@/lib/types";

export function AddPlayerForm() {
  const [name, setName] = useState("");
  const [tier, setTier] = useState<Tier | undefined>(undefined);
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const addPlayer = useConfigStore((s) => s.addPlayer);
  const updatePlayer = useConfigStore((s) => s.updatePlayer);
  const registerPlayer = useSessionStore((s) => s.registerPlayer);
  const session = useSessionStore((s) => s.session);
  const hasActiveSession = Boolean(session && !session.endedAt);
  // Mirrors PlayerRow's tier lock: a tier the randomizer never weighs (skill
  // balance off) is just a setting nobody can act on, so don't offer it.
  const tierLocked = hasActiveSession && !session?.skillBalanceMode;

  useLockBodyScroll(open);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setAvatarDataUrl(await fileToAvatarDataUrl(file));
  };

  const reset = () => {
    setName("");
    setTier(undefined);
    setAvatarDataUrl(undefined);
    setOpen(false);
  };

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = addPlayer(trimmed, tierLocked ? undefined : tier);
    if (avatarDataUrl) updatePlayer(id, { avatar: avatarDataUrl });
    if (hasActiveSession) registerPlayer(id);
    reset();
  };

  return (
    <>
      <Button fullWidth onClick={() => setOpen(true)}>
        + Add player
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex animate-fade-in items-center justify-center bg-black/60 p-4"
          onClick={reset}
        >
          <div
            className="w-full max-w-sm animate-modal-in rounded-2xl border border-hairline bg-ink-raised p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                aria-label="Add photo"
              >
                <TierBadge tier={tier} avatar={avatarDataUrl} />
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <span className="text-xs text-line-dim">Optional photo</span>
              {avatarDataUrl && (
                <Button
                  variant="ghost"
                  className="ml-auto px-2 py-1 text-xs text-bench"
                  onClick={() => setAvatarDataUrl(undefined)}
                >
                  Remove photo
                </Button>
              )}
            </div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Player name"
              className="w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line placeholder:text-line-dim focus:outline-none"
            />
            {tierLocked ? (
              <p className="mt-2 rounded-lg bg-ink-overlay px-3 py-2 text-xs text-line-dim">
                Turn on <span className="font-semibold text-line">Skill tier balance</span> in
                Session settings to set player tiers.
              </p>
            ) : (
              <>
                <div className="mt-2 flex gap-1.5">
                  {TIERS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTier(tier === t ? undefined : t)}
                      className={`h-9 flex-1 rounded-lg text-sm font-semibold transition-colors ${
                        tier === t
                          ? "bg-court-bright text-ink"
                          : "bg-ink-overlay text-line-dim"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[11px] text-line-dim">
                  Tier is optional — leave blank if unrated.
                </p>
              </>
            )}
            <div className="mt-3 flex gap-2">
              <Button variant="secondary" fullWidth onClick={reset}>
                Cancel
              </Button>
              <Button fullWidth onClick={submit} disabled={!name.trim()}>
                Add
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
