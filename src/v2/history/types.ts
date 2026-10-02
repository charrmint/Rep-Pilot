import type { PersistedProgressionRecommendation } from "@/features/progression/types";
import type { WeightUnit } from "@/lib/units/types";
import type { ReactNode } from "react";
import type { HistoryRecommendations, PaginatedHistory, WorkoutHistorySession } from "@/features/workouts/types";

export type HistoryView = "sessions" | "plans" | "exercises";
export interface HistoryPageProps {
  searchParams: Promise<{ page?: string | string[] }>;
}
export interface HistoryFrameProps {
  view: HistoryView;
  title: string;
  children: ReactNode;
}
export interface HistoryMonth {
  key: string;
  label: string;
  sessions: WorkoutHistorySession[];
}
export interface SessionListProps {
  sessions: WorkoutHistorySession[];
  recommendations: HistoryRecommendations;
}

export type HistoryPaginationProps = Pick<PaginatedHistory<unknown>, "page" | "hasPreviousPage" | "hasNextPage"> & { basePath: string };
export interface HistoryDecisionProps {
  recommendation?: PersistedProgressionRecommendation;
  unit?: WeightUnit;
}
