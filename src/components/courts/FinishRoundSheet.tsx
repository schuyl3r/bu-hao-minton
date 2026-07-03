"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export function FinishRoundSheet({
  courtLabel,
  initialShuttlecocks,
  onFinish,
  onClose,
}: {
  courtLabel: string;
  /** Carries forward the count already tracked live during the round, so
   *  this is a final check/adjustment rather than re-entering from zero. */
  initialShuttlecocks?: number;
  onFinish: (shuttlecocksUsed?: number) => void;
  onClose: () => void;
}) {
  const [shuttlecocks, setShuttlecocks] = useState(
    initialShuttlecocks != null ? String(initialShuttlecocks) : "",
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 animate-fade-in" onClick={onClose}>
      <div
        className="w-full animate-sheet-in rounded-t-2xl border-t border-hairline bg-ink-raised p-4"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-hairline" />
        <h3 className="font-display text-xl tracking-wide text-line">
          {`MARK COMPLETE · ${courtLabel.toUpperCase()}`}
        </h3>
        <label className="mt-3 block text-xs font-medium text-line-dim">
          Shuttlecocks used (optional)
        </label>
        <input
          type="number"
          min={0}
          inputMode="numeric"
          value={shuttlecocks}
          onChange={(e) => setShuttlecocks(e.target.value)}
          placeholder="0"
          className="mt-1 w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line placeholder:text-line-dim focus:outline-none"
        />
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Back
          </Button>
          <Button
            fullWidth
            onClick={() => onFinish(shuttlecocks.trim() ? Number(shuttlecocks) : undefined)}
          >
            Mark Complete
          </Button>
        </div>
      </div>
    </div>
  );
}
