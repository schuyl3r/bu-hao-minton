"use client";

import { useEffect, useState } from "react";
import { useConfigStore } from "@/lib/store/configStore";
import { useSessionStore } from "@/lib/store/sessionStore";

/**
 * Zustand's persist middleware can't read localStorage during SSR, so both
 * stores are created with skipHydration. Rehydrating here, inside a client-
 * only effect, avoids a hydration mismatch between the server-rendered
 * (empty) state and whatever was actually saved on this device.
 */
export function HydrationGate({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Promise.all([
      useConfigStore.persist.rehydrate(),
      useSessionStore.persist.rehydrate(),
    ]).finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-ink">
        <div className="font-display text-2xl tracking-wide text-line-dim">
          LOADING&hellip;
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
