import type { WorkoutSet } from "../types";

interface WorkoutSetSummaryProps {
  sets: WorkoutSet[];
  emptyMessage?: string;
}

export function WorkoutSetSummary({
  sets,
  emptyMessage = "No working sets logged.",
}: WorkoutSetSummaryProps) {
  if (sets.length === 0) {
    return <p className="text-sm text-gray-500">{emptyMessage}</p>;
  }

  return (
    <ol className="flex flex-wrap gap-2">
      {sets.map((set) => (
        <li
          key={set.id}
          className="rounded bg-white px-2.5 py-1.5 text-sm text-gray-800 shadow-xs ring-1 ring-gray-200"
        >
          <span className="mr-1 text-xs font-medium text-gray-500">
            {set.position}.
          </span>
          <span className="font-semibold">
            {set.weightValue} {set.weightUnit} × {set.reps}
          </span>
        </li>
      ))}
    </ol>
  );
}
