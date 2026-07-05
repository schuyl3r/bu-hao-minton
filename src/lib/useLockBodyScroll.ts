"use client";

import { useEffect } from "react";

// Module-level so nested/sibling sheets (e.g. a FinishRoundSheet opened
// while another sheet's exit animation is still unmounting) don't unlock
// the body out from under one another.
let lockCount = 0;

/** Locks page scroll for as long as the calling component is mounted (or,
 *  for components that stay mounted and toggle their own overlay, for as
 *  long as `active` is true) — call from every full-screen sheet/modal so
 *  the page behind it can't be scrolled (or, via scroll-chained touch, feel
 *  interactive) underneath. */
export function useLockBodyScroll(active = true) {
  useEffect(() => {
    if (!active) return;
    if (lockCount === 0) {
      document.body.style.overflow = "hidden";
    }
    lockCount++;
    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.overflow = "";
      }
    };
  }, [active]);
}
