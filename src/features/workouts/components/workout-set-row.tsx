"use client";

import {
  type KeyboardEvent,
  type UIEvent,
  useEffect,
  useRef,
  useState,
  useTransition,
} from "react";

import {
  deleteWorkoutSetAction,
  saveWorkoutSetAction,
} from "../workout-actions";
import type { WorkoutSet } from "../types";

interface WorkoutSetRowProps {
  sessionExerciseId: string;
  position: number;
  defaultWeightValue: number;
  weightUnit: "lb" | "kg";
  workoutSet?: WorkoutSet;
  onSaved: (set: WorkoutSet) => void;
  onDeleted: (set: WorkoutSet) => void;
}

const RIR_OPTIONS: Array<number | null> = [null, 3, 2, 1, 0];
const RIR_OPTION_HEIGHT_PX = 32;

export function WorkoutSetRow({
  sessionExerciseId,
  position,
  defaultWeightValue,
  weightUnit,
  workoutSet,
  onSaved,
  onDeleted,
}: WorkoutSetRowProps) {
  const [weightValue, setWeightValue] = useState(
    String(workoutSet?.weightValue ?? defaultWeightValue),
  );
  const [reps, setReps] = useState(
    workoutSet ? String(workoutSet.reps) : "",
  );
  const [rir, setRir] = useState<number | null>(workoutSet?.rir ?? null);
  const rirPickerRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const initialIndex = RIR_OPTIONS.indexOf(workoutSet?.rir ?? null);

    if (rirPickerRef.current) {
      rirPickerRef.current.scrollTop = initialIndex * RIR_OPTION_HEIGHT_PX;
    }
  }, [workoutSet?.rir]);

  function _saveSet() {
    startTransition(async () => {
      try {
        const savedSet = await saveWorkoutSetAction({
          sessionExerciseId,
          workoutSetId: workoutSet?.id,
          position,
          reps: Number(reps),
          weightValue: Number(weightValue),
          weightUnit,
          rir,
        });

        setErrorMessage(null);
        onSaved(savedSet);
      } catch {
        setErrorMessage("Set could not be saved. Try again.");
      }
    });
  }

  function _deleteSet() {
    if (!workoutSet) {
      return;
    }

    startTransition(async () => {
      try {
        await deleteWorkoutSetAction({
          sessionExerciseId,
          workoutSetId: workoutSet.id,
        });

        setErrorMessage(null);
        onDeleted(workoutSet);
      } catch {
        setErrorMessage("Set could not be deleted. Try again.");
      }
    });
  }

  function _selectRir(index: number) {
    const boundedIndex = Math.min(
      RIR_OPTIONS.length - 1,
      Math.max(0, index),
    );

    setRir(RIR_OPTIONS[boundedIndex]);

    if (rirPickerRef.current) {
      rirPickerRef.current.scrollTop =
        boundedIndex * RIR_OPTION_HEIGHT_PX;
    }
  }

  function _handleRirScroll(event: UIEvent<HTMLDivElement>) {
    const nextIndex = Math.round(
      event.currentTarget.scrollTop / RIR_OPTION_HEIGHT_PX,
    );
    const nextRir = RIR_OPTIONS[nextIndex];

    if (nextRir !== undefined) {
      setRir(nextRir);
    }
  }

  function _handleRirKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") {
      return;
    }

    event.preventDefault();
    const currentIndex = RIR_OPTIONS.indexOf(rir);
    _selectRir(currentIndex + (event.key === "ArrowDown" ? 1 : -1));
  }

  return (
    <li className="rounded-md border border-gray-200 bg-gray-50 p-3">
      <div className="grid grid-cols-[1.5rem_minmax(0,1.35fr)_minmax(0,0.8fr)_minmax(3.75rem,0.6fr)] items-end gap-2">
        <span className="pb-3 text-center text-sm font-semibold text-gray-500">
          {position}
        </span>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-gray-600">
          Weight ({weightUnit})
          <input
            type="number"
            required
            min={0}
            step="any"
            inputMode="decimal"
            value={weightValue}
            onChange={(event) => setWeightValue(event.target.value)}
            className="min-h-12 min-w-0 rounded-md border border-gray-300 bg-white px-3 text-base text-gray-950 outline-none focus:border-gray-950"
          />
        </label>
        <label className="flex min-w-0 flex-col gap-1 text-xs font-medium text-gray-600">
          Reps
          <input
            type="number"
            required
            min={0}
            step={1}
            inputMode="numeric"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
            className="min-h-12 min-w-0 rounded-md border border-gray-300 bg-white px-3 text-base text-gray-950 outline-none focus:border-gray-950"
          />
        </label>
        <div className="flex min-w-0 flex-col gap-1 text-xs font-medium text-gray-600">
          <span>RIR</span>
          <div
            ref={rirPickerRef}
            role="listbox"
            tabIndex={0}
            aria-label={`RIR for set ${position}`}
            onScroll={_handleRirScroll}
            onKeyDown={_handleRirKeyDown}
            className="h-12 min-w-0 snap-y snap-mandatory overflow-y-auto overscroll-contain rounded-md border border-gray-300 bg-white py-2 text-base font-semibold text-gray-950 outline-none [scrollbar-width:none] focus:border-gray-950 [&::-webkit-scrollbar]:hidden"
          >
            {RIR_OPTIONS.map((option, index) => (
              <button
                key={option ?? "unset"}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={rir === option}
                onClick={() => _selectRir(index)}
                className={`block h-8 w-full snap-center text-center transition ${
                  rir === option ? "text-gray-950" : "text-gray-400"
                }`}
              >
                {option ?? "--"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-3 flex justify-end gap-2">
        <button
          type="button"
          disabled={isPending || weightValue === "" || reps === ""}
          onClick={_saveSet}
          className="min-h-11 flex-1 rounded-md bg-gray-950 px-4 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending
            ? "Saving..."
            : workoutSet
              ? "Update set"
              : "Log set"}
        </button>
        {workoutSet ? (
          <button
            type="button"
            disabled={isPending}
            onClick={_deleteSet}
            aria-label={`Delete set ${position}`}
            className="min-h-11 rounded-md border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
          >
            Delete
          </button>
        ) : null}
      </div>
      {errorMessage ? (
        <p className="mt-2 text-sm text-red-700">{errorMessage}</p>
      ) : null}
    </li>
  );
}
