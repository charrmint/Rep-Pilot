"use client";

import { SearchPicker } from "../ui/search-picker";
import type { ExercisePickerProps } from "./types";

export function ExercisePicker({ exercises, ...props }: ExercisePickerProps) {
  return <SearchPicker {...props} options={exercises} label="Exercise" itemLabel="exercise" fieldName="exerciseId"
    describeOption={exercise => exercise.isSystemExercise ? "Built-in" : "Custom"} />;
}
