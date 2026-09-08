"use client";

import { useEffect, useState } from "react";

const UNITS = ["Days", "Hours", "Mins", "Secs"] as const;

/** Milliseconds until the end of the coming Sunday, in the viewer's timezone. */
function msUntilWeekEnd(now: Date): number {
  const end = new Date(now);
  end.setDate(now.getDate() + ((7 - now.getDay()) % 7));
  end.setHours(23, 59, 59, 999);
  return Math.max(0, end.getTime() - now.getTime());
}

function split(ms: number): string[] {
  const s = Math.floor(ms / 1000);
  return [
    Math.floor(s / 86400),
    Math.floor((s % 86400) / 3600),
    Math.floor((s % 3600) / 60),
    s % 60,
  ].map((n) => String(n).padStart(2, "0"));
}

/**
 * Renders `--` until mounted. The deadline depends on the viewer's clock, so
 * computing it during SSR would guarantee a hydration mismatch.
 */
export function Countdown() {
  const [parts, setParts] = useState<string[] | null>(null);

  useEffect(() => {
    const tick = () => setParts(split(msUntilWeekEnd(new Date())));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex flex-wrap gap-2" role="timer" aria-live="off">
      {UNITS.map((unit, i) => (
        <div key={unit} className="text-center">
          <div className="grid h-10 w-10 place-items-center sm:h-11 sm:w-11 rounded-lg bg-white/20 font-display text-[16px] font-extrabold tabular-nums text-white backdrop-blur-sm">
            {parts ? parts[i] : "--"}
          </div>
          <p className="mt-1.5 text-[10px] font-medium text-white/80">{unit}</p>
        </div>
      ))}
    </div>
  );
}
