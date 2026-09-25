"use client";

import { useEffect, useState } from "react";

export function ElapsedTime({ startedAt }: { startedAt: string }) {
  const [seconds, setSeconds] = useState<number | null>(null);
  useEffect(() => {
    function _update() {
      setSeconds(
        Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000)),
      );
    }
    _update();
    const timer = setInterval(_update, 1000);
    return () => clearInterval(timer);
  }, [startedAt]);
  return (
    <span className="v2-elapsed" aria-label="Elapsed workout time">
      {seconds === null
        ? "—"
        : `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`}{" "}
      elapsed
    </span>
  );
}
