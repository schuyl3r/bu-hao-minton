"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { LiveElapsed } from "@/components/ui/LiveElapsed";
import { QuestionMarkIcon } from "@/components/ui/icons";
import { CourtManager } from "@/components/session/CourtManager";
import { ExportPdfButton } from "@/components/session/ExportPdfButton";
import { PendingRequestsList } from "@/components/session/PendingRequestsList";
import { SessionSettings } from "@/components/session/SessionSettings";
import { StartSessionForm } from "@/components/session/StartSessionForm";
import { HelpSheet } from "@/components/HelpSheet";
import { useSessionStore } from "@/lib/store/sessionStore";

export default function HomePage() {
  const session = useSessionStore((s) => s.session);
  const endSession = useSessionStore((s) => s.endSession);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const hasActiveSession = Boolean(session && !session.endedAt);

  return (
    <main className="flex-1 px-4">
      <div className="court-rule flex items-end justify-between pb-3 pt-4">
        <div>
          <p className="font-display text-5xl leading-[0.85] tracking-wide text-court-bright">
            不好
          </p>
          <p className="mt-1 font-display text-xl tracking-[0.2em] text-line">BUHAOMINTON</p>
        </div>
        <button
          onClick={() => setShowHelp(true)}
          aria-label="How this app works"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-overlay text-line-dim"
        >
          <QuestionMarkIcon />
        </button>
      </div>

      {hasActiveSession && session && (
        <div className="mb-3 mt-3 animate-reveal rounded-xl border border-hairline bg-ink-raised p-4">
          <p className="text-xs uppercase tracking-wide text-line-dim">In progress</p>
          <p className="font-display text-3xl tracking-wide text-line">
            <LiveElapsed since={session.startedAt} format="compact" />
          </p>
          <p className="text-xs text-line-dim">Planned for {session.totalHours}h</p>
          {!confirmingEnd ? (
            <Button variant="danger" fullWidth className="mt-3" onClick={() => setConfirmingEnd(true)}>
              End Session
            </Button>
          ) : (
            <div className="mt-3 animate-reveal rounded-lg border border-bench/40 bg-bench/10 p-3">
              <p className="text-sm font-medium text-bench">
                Ending the session locks in the results and lets you export the PDF
                summary. In-progress rounds stay recorded as-is.
              </p>
              <div className="mt-2 flex gap-2">
                <Button variant="secondary" fullWidth onClick={() => setConfirmingEnd(false)}>
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  fullWidth
                  onClick={() => {
                    endSession();
                    setConfirmingEnd(false);
                  }}
                >
                  End Session
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {session?.endedAt && (
        <div className="mb-3 mt-3 animate-reveal rounded-xl border border-in/40 bg-in/10 p-4">
          <p className="text-sm font-semibold text-in">Session ended</p>
          <p className="mt-1 mb-3 text-xs text-line-dim">
            Export the full summary &mdash; every game, fairness check, and unhonored
            requests &mdash; as a PDF.
          </p>
          <ExportPdfButton session={session} />
        </div>
      )}

      {!hasActiveSession && (
        <div className="mb-3 mt-3">
          <StartSessionForm />
        </div>
      )}

      {hasActiveSession && (
        <>
          <div className="mb-3">
            <SessionSettings />
          </div>

          <h2 className="mb-2 mt-4 font-display text-xl tracking-wide text-line">
            COURTS
          </h2>
          <div className="mb-3">
            <CourtManager />
          </div>

          <h2 className="mb-2 mt-4 font-display text-xl tracking-wide text-line">
            PENDING REQUESTS
          </h2>
          <PendingRequestsList />
        </>
      )}

      {!hasActiveSession && !session?.endedAt && (
        <div className="mt-2">
          <h2 className="mb-2 font-display text-xl tracking-wide text-line">COURTS</h2>
          <CourtManager />
        </div>
      )}

      <p className="mb-2 mt-8 text-center text-[11px] text-line-dim">
        Built by <span className="font-semibold text-line">Schuyler Ng</span>
      </p>

      {showHelp && <HelpSheet onClose={() => setShowHelp(false)} />}
    </main>
  );
}
