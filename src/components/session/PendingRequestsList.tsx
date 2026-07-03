"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";

export function PendingRequestsList() {
  const requests = useSessionStore((s) => s.requests);
  const cancelRequest = useSessionStore((s) => s.cancelRequest);
  const players = useConfigStore((s) => s.players);
  const nameOf = (id: string) => players.find((p) => p.id === id)?.name ?? "Unknown";

  const pending = requests
    .filter((r) => r.status === "pending")
    .sort((a, b) => a.createdAt - b.createdAt);

  if (pending.length === 0) {
    return <EmptyState title="No requests queued" hint="Player match requests will show up here until honored." />;
  }

  return (
    <ul className="flex flex-col gap-2">
      {pending.map((r) => (
        <li
          key={r.id}
          className="flex items-center justify-between rounded-xl border border-hairline bg-ink-raised px-3 py-2.5"
        >
          <span className="text-sm text-line">
            <strong>{nameOf(r.fromPlayerId)}</strong>{" "}
            <span className="text-line-dim">wants to play {r.kind}</span>{" "}
            <strong>{nameOf(r.targetPlayerId)}</strong>
          </span>
          <Button
            variant="ghost"
            className="px-2 py-1 text-xs"
            onClick={() => cancelRequest(r.id)}
          >
            Cancel
          </Button>
        </li>
      ))}
    </ul>
  );
}
