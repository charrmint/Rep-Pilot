"use client";

import { useSyncExternalStore } from "react";
import { formatHistoryDate } from "./dates";

function _subscribe(onChange: () => void) {
  const timer = window.setInterval(onChange, 60_000);
  window.addEventListener("focus", onChange);
  return () => { window.clearInterval(timer); window.removeEventListener("focus", onChange); };
}
function _now() { return Math.floor(Date.now() / 60_000) * 60_000; }
function _serverNow() { return null; }

export function HistoryDate({ value }: { value: string }) {
  const now = useSyncExternalStore(_subscribe, _now, _serverNow);
  return <time dateTime={value}>{now === null ? "…" : formatHistoryDate(value, now, Intl.DateTimeFormat().resolvedOptions().timeZone)}</time>;
}
