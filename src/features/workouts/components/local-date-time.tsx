"use client";

import { useSyncExternalStore } from "react";

interface LocalDateTimeProps {
  value: string;
  dateStyle?: "medium";
  timeStyle?: "short";
}

export function LocalDateTime({
  value,
  dateStyle,
  timeStyle = "short",
}: LocalDateTimeProps) {
  const isClient = useSyncExternalStore(
    _subscribe,
    _getClientSnapshot,
    _getServerSnapshot,
  );
  const formattedValue = isClient
    ? new Intl.DateTimeFormat("en-US", { dateStyle, timeStyle }).format(
        new Date(value),
      )
    : "...";

  return <time dateTime={value}>{formattedValue}</time>;
}

function _subscribe(): () => void {
  return () => undefined;
}

function _getClientSnapshot(): boolean {
  return true;
}

function _getServerSnapshot(): boolean {
  return false;
}
