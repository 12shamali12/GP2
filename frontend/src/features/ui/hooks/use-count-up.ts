"use client";

import { useEffect, useState } from "react";

/**
 * Animates a number from 0 up to `target` over `duration` ms using an
 * ease-out cubic curve for a satisfying deceleration. Mirrors the private
 * counter in the game surface, promoted here so dashboards can share it.
 *
 * Respects reduced motion: when the OS preference or the in-app Settings
 * toggle (`html[data-reduced-motion="true"]`) is on, the hook returns the
 * final `target` immediately with no animation.
 */
export function useCountUp(target: number, duration = 800): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" &&
      (window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
        document.documentElement.dataset.reducedMotion === "true");

    if (prefersReduced || duration <= 0) {
      setValue(target);
      return;
    }

    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(target * eased);
      if (progress < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}
