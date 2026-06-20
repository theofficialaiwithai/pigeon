"use client";
import { useEffect, useState } from "react";

/**
 * Animates a number from 0 to `target` over `duration` ms using a cubic ease-out.
 * Set `active` to false to hold at 0 (e.g. until the element is in view).
 */
export function useCountUp(target: number, duration = 800, active = true): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    setValue(0);
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, active]);

  return value;
}
