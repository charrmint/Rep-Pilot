import type { PaginatedHistory } from "./types";

export function parseWorkoutHistoryPage(
  value: string | string[] | undefined,
): number {
  const pageValue = Array.isArray(value) ? value[0] : value;
  const page = Number(pageValue);

  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function getWorkoutHistoryOffset(
  page: number,
  pageSize: number,
): number {
  return (page - 1) * pageSize;
}

export function createPaginatedHistory<T>({
  items,
  page,
  pageSize,
}: {
  items: T[];
  page: number;
  pageSize: number;
}): PaginatedHistory<T> {
  return {
    items: items.slice(0, pageSize),
    page,
    hasPreviousPage: page > 1,
    hasNextPage: items.length > pageSize,
  };
}

export function getWorkoutDurationLabel({
  startedAt,
  completedAt,
}: {
  startedAt: string;
  completedAt: string | null;
}): string | null {
  if (!completedAt) {
    return null;
  }

  const durationMinutes = Math.max(
    1,
    Math.round(
      (new Date(completedAt).getTime() - new Date(startedAt).getTime()) /
        60_000,
    ),
  );
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}
