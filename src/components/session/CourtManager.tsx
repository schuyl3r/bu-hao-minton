"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";

export function CourtManager() {
  const courts = useConfigStore((s) => s.courts);
  const addCourt = useConfigStore((s) => s.addCourt);
  const updateCourt = useConfigStore((s) => s.updateCourt);
  const removeCourt = useConfigStore((s) => s.removeCourt);
  const session = useSessionStore((s) => s.session);
  const registerCourt = useSessionStore((s) => s.registerCourt);
  const hasActiveSession = Boolean(session && !session.endedAt);

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [duration, setDuration] = useState(session?.defaultDurationMinutes ?? 120);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDuration, setEditDuration] = useState(0);

  const submitAdd = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = addCourt(trimmed, duration);
    if (hasActiveSession) registerCourt(id);
    setLabel("");
    setDuration(session?.defaultDurationMinutes ?? 120);
    setAdding(false);
  };

  return (
    <div className="flex flex-col gap-2">
      {courts.length === 0 && !adding && (
        <EmptyState title="No courts yet" hint="Add each physical court you'll rotate players through." />
      )}

      {courts.map((c) =>
        editingId === c.id ? (
          <div key={c.id} className="rounded-xl border border-hairline bg-ink-raised p-3">
            <input
              autoFocus
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line focus:outline-none"
            />
            <input
              type="number"
              min={1}
              value={editDuration}
              onChange={(e) => setEditDuration(Number(e.target.value) || 0)}
              className="mt-2 w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  updateCourt(c.id, { label: editLabel.trim(), durationMinutes: editDuration });
                  setEditingId(null);
                }}
              >
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div
            key={c.id}
            className="flex items-center justify-between rounded-xl border border-hairline bg-ink-raised px-3 py-2.5"
          >
            <div>
              <p className="text-[15px] font-semibold text-line">{c.label}</p>
              <p className="text-xs text-line-dim">{c.durationMinutes} min block</p>
            </div>
            <div className="flex gap-1.5">
              <button
                onClick={() => {
                  setEditingId(c.id);
                  setEditLabel(c.label);
                  setEditDuration(c.durationMinutes);
                }}
                aria-label="Edit court"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-overlay text-line-dim"
              >
                ✎
              </button>
              <button
                onClick={() => removeCourt(c.id)}
                aria-label="Remove court"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-overlay text-line-dim"
              >
                ×
              </button>
            </div>
          </div>
        ),
      )}

      {adding ? (
        <div className="rounded-xl border border-hairline bg-ink-raised p-3">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Court label (e.g. Court 1)"
            className="w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line placeholder:text-line-dim focus:outline-none"
          />
          <input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value) || 0)}
            className="mt-2 w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button fullWidth disabled={!label.trim()} onClick={submitAdd}>
              Add
            </Button>
          </div>
        </div>
      ) : (
        <Button variant="secondary" fullWidth onClick={() => setAdding(true)}>
          + Add court
        </Button>
      )}
    </div>
  );
}
