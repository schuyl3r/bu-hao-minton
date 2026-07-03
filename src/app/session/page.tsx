"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CourtManager } from "@/components/session/CourtManager";
import { ExportPdfButton } from "@/components/session/ExportPdfButton";
import { PendingRequestsList } from "@/components/session/PendingRequestsList";
import { SessionSettings } from "@/components/session/SessionSettings";
import { StartSessionForm } from "@/components/session/StartSessionForm";
import { useSessionStore } from "@/lib/store/sessionStore";

function formatElapsed(startedAt: number) {
  const mins = Math.floor((Date.now() - startedAt) / 60000);
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function SessionPage() {
  const session = useSessionStore((s) => s.session);
  const endSession = useSessionStore((s) => s.endSession);
  const [confirmingEnd, setConfirmingEnd] = useState(false);
  const hasActiveSession = Boolean(session && !session.endedAt);

  return (
    <main className="flex-1 px-4">
      <SectionHeader title="Session" />

      {hasActiveSession && session && (
        <div className="mb-3 rounded-xl border border-hairline bg-ink-raised p-4">
          <p className="text-xs uppercase tracking-wide text-line-dim">In progress</p>
          <p className="font-display text-3xl tracking-wide text-line">
            {formatElapsed(session.startedAt)}
          </p>
          {!confirmingEnd ? (
            <Button variant="danger" fullWidth className="mt-3" onClick={() => setConfirmingEnd(true)}>
              End Session
            </Button>
          ) : (
            <div className="mt-3 rounded-lg border border-bench/40 bg-bench/10 p-3">
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
        <div className="mb-3 rounded-xl border border-in/40 bg-in/10 p-4">
          <p className="text-sm font-semibold text-in">Session ended</p>
          <p className="mt-1 mb-3 text-xs text-line-dim">
            Export the full summary &mdash; every game, fairness check, and unhonored
            requests &mdash; as a PDF.
          </p>
          <ExportPdfButton session={session} />
        </div>
      )}

      <div className="mb-3">
        <StartSessionForm />
      </div>

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
    </main>
  );
}
