"use client";

const STEPS = [
  {
    title: "Start a session",
    body: "Set how many courts and players you've got and roughly how long you're playing for (that's just a label — it's not a timer). Your roster and courts are saved, so next time you only add new people.",
  },
  {
    title: "Mark who's here",
    body: "On the Players tab, toggle each person to Present as they arrive. Tap a name to rename it, tap the avatar circle to add a photo, and use the tier buttons if you're tracking skill level.",
  },
  {
    title: "Queue a round",
    body: "On the Courts tab, tap Randomize on any free court. Don't like the match-up? Re-randomize, or tap a player to manually swap them, then Confirm & Start.",
  },
  {
    title: "Play, then Mark Complete",
    body: "Each court counts up on its own from when you confirm. Tap Mark Complete when the game's done to log it — shuttlecocks used is optional.",
  },
  {
    title: "Request a match",
    body: "On the Players tab, tap the request icon next to anyone to ask to play with or against them. It's best-effort — honored automatically when it won't force an unnecessary repeat.",
  },
  {
    title: "End the session",
    body: "When you're done for the night, End Session from the home tab, then Export PDF Summary for a full write-up: every game, fairest players, and any requests that never got honored.",
  },
];

export function HelpSheet({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end bg-black/60"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full animate-sheet-in overflow-y-auto rounded-t-2xl border-t border-hairline bg-ink-raised p-4"
        style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-hairline" />
        <h3 className="font-display text-2xl tracking-wide text-line">HOW IT WORKS</h3>
        <p className="mt-1 text-xs text-line-dim">
          One phone, one person running the show — no accounts, no syncing.
        </p>

        <ol className="mt-4 flex flex-col gap-4">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-court-bright font-display text-base text-ink">
                {i + 1}
              </span>
              <div className="min-w-0">
                <p className="text-[15px] font-semibold text-line">{step.title}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-line-dim">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <button
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-ink-overlay py-3 text-[15px] font-semibold text-line"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
