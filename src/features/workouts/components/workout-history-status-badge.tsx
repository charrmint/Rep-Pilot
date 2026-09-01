import type { WorkoutHistorySession } from "../types";

interface WorkoutHistoryStatusBadgeProps {
  status: WorkoutHistorySession["status"];
}

export function WorkoutHistoryStatusBadge({
  status,
}: WorkoutHistoryStatusBadgeProps) {
  const isCompleted = status === "completed";

  return (
    <span
      className={`rounded-full px-2 py-1 text-xs font-semibold ${
        isCompleted
          ? "bg-green-50 text-green-700"
          : "bg-amber-50 text-amber-700"
      }`}
    >
      {isCompleted ? "Completed" : "Abandoned"}
    </span>
  );
}
