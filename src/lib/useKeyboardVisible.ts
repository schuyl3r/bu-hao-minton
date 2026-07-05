"use client";

import { useEffect, useState } from "react";

// A shrink smaller than this is just the browser's own chrome (address bar
// collapsing on scroll, etc.), not a virtual keyboard.
const KEYBOARD_HEIGHT_THRESHOLD = 150;

/** True while the on-screen keyboard is covering part of the viewport, so
 *  fixed bottom UI (the nav bar) can get out of its way instead of sitting
 *  uselessly underneath it. Relies on visualViewport, so it's a no-op
 *  (always false) on browsers that don't support it. */
export function useKeyboardVisible() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const handleResize = () => {
      const shrunkBy = window.innerHeight - viewport.height;
      setVisible(shrunkBy > KEYBOARD_HEIGHT_THRESHOLD);
    };

    viewport.addEventListener("resize", handleResize);
    handleResize();
    return () => viewport.removeEventListener("resize", handleResize);
  }, []);

  return visible;
}
