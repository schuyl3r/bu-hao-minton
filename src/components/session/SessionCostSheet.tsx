"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useSessionStore } from "@/lib/store/sessionStore";
import { useLockBodyScroll } from "@/lib/useLockBodyScroll";
import type { SessionMeta, ShuttlecockPricing } from "@/lib/types";

const DEFAULT_SHUTTLES_PER_TUBE = "12";

export function SessionCostSheet({
  session,
  onClose,
}: {
  session: SessionMeta;
  onClose: () => void;
}) {
  useLockBodyScroll();
  const setSessionCosts = useSessionStore((s) => s.setSessionCosts);
  const [courtCost, setCourtCost] = useState(
    session.courtCost != null ? String(session.courtCost) : "",
  );
  const [mode, setMode] = useState<ShuttlecockPricing["mode"]>(
    session.shuttlecockPricing?.mode ?? "per-shuttle",
  );
  const [price, setPrice] = useState(
    session.shuttlecockPricing?.price != null ? String(session.shuttlecockPricing.price) : "",
  );
  const [shuttlesPerTube, setShuttlesPerTube] = useState(
    session.shuttlecockPricing?.shuttlesPerTube != null
      ? String(session.shuttlecockPricing.shuttlesPerTube)
      : DEFAULT_SHUTTLES_PER_TUBE,
  );

  const save = () => {
    const parsedCourtCost = courtCost.trim() ? Number(courtCost) : undefined;
    const parsedPrice = price.trim() ? Number(price) : undefined;
    const pricing: ShuttlecockPricing | undefined =
      parsedPrice != null
        ? {
            mode,
            price: parsedPrice,
            shuttlesPerTube: mode === "per-tube" ? Number(shuttlesPerTube) || 12 : undefined,
          }
        : undefined;
    setSessionCosts(parsedCourtCost, pricing);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/60 animate-fade-in" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full animate-sheet-in overflow-y-auto rounded-t-2xl border-t border-hairline bg-ink-raised p-4"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-hairline" />
        <h3 className="font-display text-xl tracking-wide text-line">SESSION COSTS</h3>
        <p className="mt-1 text-xs text-line-dim">
          Both optional. Add these to have the PDF work out an even per-person share.
        </p>

        <label className="mt-4 block text-xs font-medium text-line-dim">
          Total court cost (for all courts & time)
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          inputMode="decimal"
          value={courtCost}
          onChange={(e) => setCourtCost(e.target.value)}
          placeholder="0.00"
          className="mt-1 w-full rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line placeholder:text-line-dim focus:outline-none"
        />

        <label className="mt-4 block text-xs font-medium text-line-dim">
          Shuttlecock price
        </label>
        <div className="mt-1 flex gap-1.5">
          {(["per-shuttle", "per-tube"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`h-9 flex-1 rounded-lg text-sm font-semibold transition-colors ${
                mode === m ? "bg-court-bright text-ink" : "bg-ink-overlay text-line-dim"
              }`}
            >
              {m === "per-shuttle" ? "Per shuttle" : "Per tube"}
            </button>
          ))}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            min={0}
            step="0.01"
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder={mode === "per-shuttle" ? "Price per shuttle" : "Price per tube"}
            className="flex-1 rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line placeholder:text-line-dim focus:outline-none"
          />
          {mode === "per-tube" && (
            <input
              type="number"
              min={1}
              inputMode="numeric"
              value={shuttlesPerTube}
              onChange={(e) => setShuttlesPerTube(e.target.value)}
              placeholder="Shuttles/tube"
              className="w-28 rounded-lg bg-ink-overlay px-3 py-2.5 text-base text-line placeholder:text-line-dim focus:outline-none"
            />
          )}
        </div>
        <p className="mt-1 text-[11px] text-line-dim">
          Uses the shuttlecock count logged per round to work out the total.
        </p>

        <div className="mt-5 flex gap-2">
          <Button variant="secondary" fullWidth onClick={onClose}>
            Skip for now
          </Button>
          <Button fullWidth onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
