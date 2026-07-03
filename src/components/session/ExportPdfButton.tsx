"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { computeSessionSummary } from "@/lib/sessionSummary";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";
import type { SessionMeta } from "@/lib/types";

export function ExportPdfButton({ session }: { session: SessionMeta }) {
  const [generating, setGenerating] = useState(false);
  const players = useConfigStore((s) => s.players);
  const courts = useConfigStore((s) => s.courts);
  const courtStates = useSessionStore((s) => s.courtStates);
  const rounds = useSessionStore((s) => s.rounds);
  const requests = useSessionStore((s) => s.requests);
  const playerStats = useSessionStore((s) => s.playerStats);

  const handleExport = async () => {
    setGenerating(true);
    try {
      const summary = computeSessionSummary({
        session,
        players,
        courts,
        courtStates,
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
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Button fullWidth onClick={handleExport} disabled={generating}>
      {generating ? "Generating PDF…" : "Export PDF Summary"}
    </Button>
  );
}
