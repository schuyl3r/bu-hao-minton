"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { PencilIcon, TrashIcon } from "@/components/ui/icons";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";

export function CourtManager() {
  const courts = useConfigStore((s) => s.courts);
  const addCourt = useConfigStore((s) => s.addCourt);
  const updateCourt = useConfigStore((s) => s.updateCourt);
  const removeCourt = useConfigStore((s) => s.removeCourt);
  const session = useSessionStore((s) => s.session);
  const registerCourt = useSessionStore((s) => s.registerCourt);
  const cancelActiveRoundForCourt = useSessionStore((s) => s.cancelActiveRoundForCourt);
  const hasActiveSession = Boolean(session && !session.endedAt);

  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);

  const submitAdd = () => {
    const trimmed = label.trim();
    if (!trimmed) return;
    const id = addCourt(trimmed);
    if (hasActiveSession) registerCourt(id);
    setLabel("");
    setAdding(false);
  };

  const confirmRemove = (courtId: string) => {
    // A court with an in-progress round has no surviving way to Finish or
    // Cancel that round once its card is gone — cancel it first so the
    // round doesn't get orphaned and its players don't get stuck "busy".
    cancelActiveRoundForCourt(courtId);
    removeCourt(courtId);
    setRemovingId(null);
  };

  return (
    <div className="flex flex-col gap-2">
      {courts.length === 0 && !adding && (
        <EmptyState title="No courts yet" hint="Add each physical court you'll rotate players through." />
      )}

      {courts.map((c) =>
        editingId === c.id ? (
          <div key={c.id} className="animate-reveal rounded-xl border border-hairline bg-ink-raised p-3">
            <input
              autoFocus
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line focus:outline-none"
            />
            <div className="mt-2 flex gap-2">
              <Button variant="secondary" fullWidth onClick={() => setEditingId(null)}>
                Cancel
              </Button>
              <Button
                fullWidth
                onClick={() => {
                  updateCourt(c.id, { label: editLabel.trim() });
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
            className="flex items-center justify-between rounded-xl border border-hairline bg-ink-raised px-3 py-2.5 transition-colors"
          >
            <p className="text-[15px] font-semibold text-line">{c.label}</p>
            {removingId === c.id ? (
              <div className="flex shrink-0 animate-reveal gap-1.5">
                <Button variant="secondary" className="px-2.5 py-1.5 text-xs" onClick={() => setRemovingId(null)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="px-2.5 py-1.5 text-xs"
                  onClick={() => confirmRemove(c.id)}
                >
                  Confirm
                </Button>
              </div>
            ) : (
              <div className="flex gap-1.5">
                <button
                  onClick={() => {
                    setEditingId(c.id);
                    setEditLabel(c.label);
                  }}
                  aria-label="Edit court"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-overlay text-line-dim"
                >
                  <PencilIcon />
                </button>
                <button
                  onClick={() => setRemovingId(c.id)}
                  aria-label="Remove court"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-ink-overlay text-line-dim"
                >
                  <TrashIcon />
                </button>
              </div>
            )}
          </div>
        ),
      )}

      {adding ? (
        <div className="animate-reveal rounded-xl border border-hairline bg-ink-raised p-3">
          <input
            autoFocus
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitAdd()}
            placeholder="Court label (e.g. Court 1)"
            className="w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line placeholder:text-line-dim focus:outline-none"
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
