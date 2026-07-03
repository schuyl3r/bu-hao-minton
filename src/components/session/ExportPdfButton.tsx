"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { computeSessionSummary } from "@/lib/sessionSummary";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { SessionMeta } from "@/lib/types";

export function ExportPdfButton({ session }: { session: SessionMeta }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const players = useConfigStore((s) => s.players);
  const courts = useConfigStore((s) => s.courts);
  const rounds = useSessionStore((s) => s.rounds);
  const requests = useSessionStore((s) => s.requests);
  const playerStats = useSessionStore((s) => s.playerStats);

  const handleExport = async () => {
    setGenerating(true);
    setError(null);
    try {
      const summary = computeSessionSummary({
        session,
        players,
        courts,
        rounds,
        requests,
        playerStats,
        now: Date.now(),
      });
      const [{ pdf }, { SessionSummaryDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/pdf/SessionSummaryDocument"),
      ]);
      const sessionLabel = new Date(session.startedAt).toLocaleDateString(undefined, {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const blob = await pdf(
        <SessionSummaryDocument summary={summary} sessionLabel={sessionLabel} />,
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `buhaominton-session-${new Date(session.startedAt).toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("Couldn't generate the PDF. Try again — if it keeps failing, the summary data is still safe in the app.");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div>
      <Button fullWidth onClick={handleExport} disabled={generating}>
        {generating ? "Generating PDF…" : "Export PDF Summary"}
      </Button>
      {error && <p className="mt-2 text-xs font-medium text-bench">{error}</p>}
    </div>
  );
}
