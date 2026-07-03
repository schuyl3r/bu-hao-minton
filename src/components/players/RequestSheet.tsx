"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { PlayerProfile, RequestKind } from "@/lib/types";

export function RequestSheet({
  fromPlayer,
  onClose,
}: {
  fromPlayer: PlayerProfile;
  onClose: () => void;
}) {
  const players = useConfigStore((s) => s.players);
  const addRequest = useSessionStore((s) => s.addRequest);
  const existingRequests = useSessionStore((s) => s.requests);
  const [kind, setKind] = useState<RequestKind>("with");

  const others = players.filter((p) => p.id !== fromPlayer.id);

  const alreadyPending = (targetId: string) =>
    existingRequests.some(
      (r) =>
        r.status === "pending" &&
        r.fromPlayerId === fromPlayer.id &&
        r.targetPlayerId === targetId &&
        r.kind === kind,
    );

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 animate-fade-in" onClick={onClose}>
      <div
        className="max-h-[75vh] w-full animate-sheet-in overflow-y-auto rounded-t-2xl border-t border-hairline bg-ink-raised p-4 pb-8"
        style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-hairline" />
        <h3 className="font-display text-xl tracking-wide text-line">
          {`${fromPlayer.name.toUpperCase()} WANTS TO…`}
        </h3>

        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setKind("with")}
            className={`h-10 flex-1 rounded-lg text-sm font-semibold ${kind === "with" ? "bg-court-bright text-ink" : "bg-ink-overlay text-line-dim"}`}
          >
            Play WITH
          </button>
          <button
            onClick={() => setKind("against")}
            className={`h-10 flex-1 rounded-lg text-sm font-semibold ${kind === "against" ? "bg-court-bright text-ink" : "bg-ink-overlay text-line-dim"}`}
          >
            Play AGAINST
          </button>
        </div>

        <ul className="mt-3 divide-y divide-hairline">
          {others.map((p) => {
            const pending = alreadyPending(p.id);
            return (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <span className="text-[15px] text-line">{p.name}</span>
                <Button
                  variant={pending ? "secondary" : "primary"}
                  disabled={pending}
                  onClick={() => addRequest(fromPlayer.id, p.id, kind)}
                  className="px-3 py-1.5 text-xs"
                >
                  {pending ? "Queued" : "Request"}
                </Button>
              </li>
            );
          })}
          {others.length === 0 && (
            <li className="py-4 text-center text-sm text-line-dim">
              Add more players to request a match.
            </li>
          )}
        </ul>

        <Button variant="secondary" fullWidth onClick={onClose} className="mt-4">
          Done
        </Button>
      </div>
    </div>
  );
}
