"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import { TIERS, type Tier } from "@/lib/types";

export function AddPlayerForm() {
  const [name, setName] = useState("");
  const [tier, setTier] = useState<Tier | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const addPlayer = useConfigStore((s) => s.addPlayer);
  const registerPlayer = useSessionStore((s) => s.registerPlayer);
  const hasActiveSession = useSessionStore((s) => Boolean(s.session && !s.session.endedAt));

  if (!open) {
    return (
      <Button fullWidth onClick={() => setOpen(true)}>
        + Add player
      </Button>
    );
  }

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const id = addPlayer(trimmed, tier);
    if (hasActiveSession) registerPlayer(id);
    setName("");
    setTier(undefined);
    setOpen(false);
  };

  return (
    <div className="rounded-xl border border-hairline bg-ink-raised p-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="Player name"
        className="w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line placeholder:text-line-dim focus:outline-none"
      />
      <div className="mt-2 flex gap-1.5">
        {TIERS.map((t) => (
          <button
            key={t}
            onClick={() => setTier(tier === t ? undefined : t)}
            className={`h-9 flex-1 rounded-lg text-sm font-semibold transition-colors ${
              tier === t
                ? "bg-court-bright text-line"
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
      <div className="mt-3 flex gap-2">
        <Button variant="secondary" fullWidth onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button fullWidth onClick={submit} disabled={!name.trim()}>
          Add
        </Button>
      </div>
    </div>
  );
}
