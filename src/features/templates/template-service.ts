import {
  mapWorkoutTemplateExerciseRowToWorkoutTemplateExercise,
  mapWorkoutTemplateRowToWorkoutTemplate,
  mapWorkoutTemplateRowToWorkoutTemplateDetails,
} from "./template-mappers";
import {
  createWorkoutTemplateExerciseRow,
  createWorkoutTemplateRow,
  deleteWorkoutTemplateExerciseRow,
  getWorkoutTemplateRow,
  listWorkoutTemplateExerciseRows,
  listWorkoutTemplateExerciseRowsForTemplates,
  listWorkoutTemplateRows,
  updateWorkoutTemplateArchiveStatusRow,
  updateWorkoutTemplateExerciseConfigRow,
  updateWorkoutTemplateExercisePositionRow,
  updateWorkoutTemplateNameRow,
} from "./template-queries";
import type {
  AddWorkoutTemplateExerciseInput,
  CreateWorkoutTemplateInput,
  MoveWorkoutTemplateExerciseInput,
  RenameWorkoutTemplateInput,
  RemoveWorkoutTemplateExerciseInput,
  SetWorkoutTemplateArchiveStatusInput,
  UpdateWorkoutTemplateExerciseInput,
  WorkoutTemplate,
  WorkoutTemplateDetails,
  WorkoutTemplateExercise,
  WorkoutTemplateExerciseConfig,
  WorkoutTemplateExerciseUpdate,
  WorkoutTemplateExerciseRow,
  WorkoutTemplateExerciseRowWithExercise,
  WorkoutTemplateLibrary,
  WorkoutTemplateRow,
} from "./types";
import {
  normalizeWorkoutTemplateName,
  validateWorkoutTemplateExerciseConfig,
  validateWorkoutTemplateName,
} from "./template-validation";

export async function listWorkoutTemplateLibrary(
  userId: string,
): Promise<WorkoutTemplateLibrary> {
  const templateRows = await listWorkoutTemplateRows(userId);
  const templateExerciseRows = await listWorkoutTemplateExerciseRowsForTemplates(
    userId,
    templateRows.map((row) => row.id),
  );
  const exercisesByTemplateId = _groupTemplateExercisesByTemplateId(
    templateExerciseRows,
  );
  const templates = templateRows.map((row) =>
    mapWorkoutTemplateRowToWorkoutTemplateDetails(
      row,
      exercisesByTemplateId.get(row.id) ?? [],
    ),
  );

  return {
    activeTemplates: templates.filter((template) => !template.isArchived),
    archivedTemplates: templates.filter((template) => template.isArchived),
  };
}

export async function getWorkoutTemplateDetails({
  userId,
  templateId,
}: {
  userId: string;
  templateId: string;
}): Promise<WorkoutTemplateDetails | null> {
  const row = await getWorkoutTemplateRow({ userId, templateId });

  if (!row) {
    return null;
  }

  const exerciseRows = await listWorkoutTemplateExerciseRows(userId, templateId);

  return mapWorkoutTemplateRowToWorkoutTemplateDetails(
    row,
    exerciseRows.map(mapWorkoutTemplateExerciseRowToWorkoutTemplateExercise),
  );
}

export async function createWorkoutTemplate({
  userId,
  name,
}: CreateWorkoutTemplateInput): Promise<WorkoutTemplate> {
  const normalizedName = validateWorkoutTemplateName(name);
  const rows = await listWorkoutTemplateRows(userId);

  if (_hasTemplateNameMatch(rows, normalizedName)) {
    throw new Error("A template with this name already exists.");
  }

  const row = await createWorkoutTemplateRow({
    user_id: userId,
    name: normalizedName,
  });

  return mapWorkoutTemplateRowToWorkoutTemplate(row);
}

export async function renameWorkoutTemplate({
  userId,
  templateId,
  name,
}: RenameWorkoutTemplateInput): Promise<WorkoutTemplate> {
  const normalizedName = validateWorkoutTemplateName(name);
  const rows = await listWorkoutTemplateRows(userId);

  if (_hasTemplateNameMatch(rows, normalizedName, templateId)) {
    throw new Error("A template with this name already exists.");
  }

  const row = await updateWorkoutTemplateNameRow({
    userId,
    templateId,
    name: normalizedName,
  });

  return mapWorkoutTemplateRowToWorkoutTemplate(row);
}

export async function setWorkoutTemplateArchiveStatus(
  input: SetWorkoutTemplateArchiveStatusInput,
): Promise<WorkoutTemplate> {
  const row = await updateWorkoutTemplateArchiveStatusRow(input);

  return mapWorkoutTemplateRowToWorkoutTemplate(row);
}

export async function addWorkoutTemplateExercise(
  input: AddWorkoutTemplateExerciseInput,
): Promise<WorkoutTemplateExercise> {
  const config = validateWorkoutTemplateExerciseConfig(input.config);
  const existingRows = await listWorkoutTemplateExerciseRows(
    input.userId,
    input.templateId,
  );

  if (_hasExerciseAlreadyInTemplate(existingRows, input.exerciseId)) {
    throw new Error("This exercise is already in the template.");
  }

  const row = await createWorkoutTemplateExerciseRow({
    user_id: input.userId,
    template_id: input.templateId,
    exercise_id: input.exerciseId,
    position: _getNextTemplateExercisePosition(existingRows),
    target_sets: config.targetSets,
    min_reps: config.minReps,
    max_reps: config.maxReps,
    default_weight_value: config.defaultWeightValue,
    default_weight_unit: config.defaultWeightUnit,
    default_normalized_weight_lbs: config.defaultNormalizedWeightLbs,
    weight_increment_lbs: config.weightIncrementLbs,
  });

  return _getWorkoutTemplateExerciseAfterMutation({
    userId: input.userId,
    templateId: input.templateId,
    templateExerciseId: row.id,
  });
}

export async function updateWorkoutTemplateExercise(
  input: UpdateWorkoutTemplateExerciseInput,
): Promise<WorkoutTemplateExercise> {
  const config = validateWorkoutTemplateExerciseConfig(input.config);
  const row = await updateWorkoutTemplateExerciseConfigRow({
    userId: input.userId,
    templateId: input.templateId,
    templateExerciseId: input.templateExerciseId,
    update: _toWorkoutTemplateExerciseUpdate(config),
  });

  return _getWorkoutTemplateExerciseAfterMutation({
    userId: input.userId,
    templateId: input.templateId,
    templateExerciseId: row.id,
  });
}

export async function removeWorkoutTemplateExercise(
  input: RemoveWorkoutTemplateExerciseInput,
): Promise<void> {
  await deleteWorkoutTemplateExerciseRow(input);
  await _compactWorkoutTemplateExercisePositions(input.userId, input.templateId);
}

export async function moveWorkoutTemplateExercise({
  userId,
  templateId,
  templateExerciseId,
  direction,
}: MoveWorkoutTemplateExerciseInput): Promise<void> {
  const exercises = await listWorkoutTemplateExerciseRows(userId, templateId);
  const currentIndex = exercises.findIndex(
    (row) => row.id === templateExerciseId,
  );

  if (currentIndex === -1) {
    throw new Error("Template exercise not found.");
  }

  const targetIndex =
    direction === "move_up" ? currentIndex - 1 : currentIndex + 1;

  if (targetIndex < 0 || targetIndex >= exercises.length) {
    return;
  }

  const current = exercises[currentIndex];
  const target = exercises[targetIndex];
  const temporaryPosition =
    Math.max(...exercises.map((row) => row.position)) + 1;

  await updateWorkoutTemplateExercisePositionRow({
    userId,
    templateId,
    templateExerciseId: current.id,
    position: temporaryPosition,
  });
  await updateWorkoutTemplateExercisePositionRow({
    userId,
    templateId,
    templateExerciseId: target.id,
    position: current.position,
  });
  await updateWorkoutTemplateExercisePositionRow({
    userId,
    templateId,
    templateExerciseId: current.id,
    position: target.position,
  });
}

function _groupTemplateExercisesByTemplateId(
  rows: WorkoutTemplateExerciseRowWithExercise[],
): Map<string, WorkoutTemplateExercise[]> {
  const groups = new Map<string, WorkoutTemplateExercise[]>();

  for (const row of rows) {
    const exercise = mapWorkoutTemplateExerciseRowToWorkoutTemplateExercise(row);
    const group = groups.get(row.template_id) ?? [];

    group.push(exercise);
    groups.set(row.template_id, group);
  }

  return groups;
}

function _hasTemplateNameMatch(
  rows: WorkoutTemplateRow[],
  name: string,
  ignoredTemplateId?: string,
): boolean {
  const normalizedName = normalizeWorkoutTemplateName(name).toLowerCase();

  return rows.some((row) => {
    if (row.id === ignoredTemplateId) {
      return false;
    }

    return (
      normalizeWorkoutTemplateName(row.name).toLowerCase() === normalizedName
    );
  });
}

function _hasExerciseAlreadyInTemplate(
  rows: WorkoutTemplateExerciseRow[],
  exerciseId: string,
): boolean {
  return rows.some((row) => row.exercise_id === exerciseId);
}

function _getNextTemplateExercisePosition(
  rows: WorkoutTemplateExerciseRow[],
): number {
  if (rows.length === 0) {
    return 1;
  }

  return Math.max(...rows.map((row) => row.position)) + 1;
}

async function _getWorkoutTemplateExerciseAfterMutation({
  userId,
  templateId,
  templateExerciseId,
}: {
  userId: string;
  templateId: string;
  templateExerciseId: string;
}): Promise<WorkoutTemplateExercise> {
  const exercises = await listWorkoutTemplateExerciseRows(userId, templateId);
  const exercise = exercises.find((row) => row.id === templateExerciseId);

  if (!exercise) {
    throw new Error("Template exercise not found.");
  }

  return mapWorkoutTemplateExerciseRowToWorkoutTemplateExercise(exercise);
}

function _toWorkoutTemplateExerciseUpdate(
  config: WorkoutTemplateExerciseConfig,
): WorkoutTemplateExerciseUpdate {
  return {
    target_sets: config.targetSets,
    min_reps: config.minReps,
    max_reps: config.maxReps,
    default_weight_value: config.defaultWeightValue,
    default_weight_unit: config.defaultWeightUnit,
    default_normalized_weight_lbs: config.defaultNormalizedWeightLbs,
    weight_increment_lbs: config.weightIncrementLbs,
  };
}

async function _compactWorkoutTemplateExercisePositions(
  userId: string,
  templateId: string,
): Promise<void> {
  const exercises = await listWorkoutTemplateExerciseRows(userId, templateId);

  for (const [index, exercise] of exercises.entries()) {
    const position = index + 1;

    if (exercise.position !== position) {
      await updateWorkoutTemplateExercisePositionRow({
        userId,
        templateId,
        templateExerciseId: exercise.id,
        position,
      });
    }
  }
}
