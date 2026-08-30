import { mapWorkoutTemplateRowToWorkoutTemplate } from "./template-mappers";
import {
  createWorkoutTemplateRow,
  listWorkoutTemplateRows,
  updateWorkoutTemplateArchiveStatusRow,
} from "./template-queries";
import type {
  CreateWorkoutTemplateInput,
  SetWorkoutTemplateArchiveStatusInput,
  WorkoutTemplate,
  WorkoutTemplateLibrary,
  WorkoutTemplateRow,
} from "./types";
import {
  normalizeWorkoutTemplateName,
  validateWorkoutTemplateName,
} from "./template-validation";

export async function listWorkoutTemplateLibrary(
  userId: string,
): Promise<WorkoutTemplateLibrary> {
  const rows = await listWorkoutTemplateRows(userId);
  const templates = rows.map(mapWorkoutTemplateRowToWorkoutTemplate);

  return {
    activeTemplates: templates.filter((template) => !template.isArchived),
    archivedTemplates: templates.filter((template) => template.isArchived),
  };
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

export async function setWorkoutTemplateArchiveStatus(
  input: SetWorkoutTemplateArchiveStatusInput,
): Promise<WorkoutTemplate> {
  const row = await updateWorkoutTemplateArchiveStatusRow(input);

  return mapWorkoutTemplateRowToWorkoutTemplate(row);
}

function _hasTemplateNameMatch(
  rows: WorkoutTemplateRow[],
  name: string,
): boolean {
  const normalizedName = normalizeWorkoutTemplateName(name).toLowerCase();

  return rows.some((row) => {
    return (
      normalizeWorkoutTemplateName(row.name).toLowerCase() === normalizedName
    );
  });
}
