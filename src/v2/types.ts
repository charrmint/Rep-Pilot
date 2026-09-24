import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import type { ActiveWorkoutSummary } from "@/features/workouts/types";
import type { ExerciseLibrary } from "@/features/exercises/types";
import type { WorkoutTemplateLibrary } from "@/features/templates/types";

export type IconName =
  | "today"
  | "history"
  | "library"
  | "profile"
  | "arrow"
  | "plus"
  | "search"
  | "dumbbell";
export type LibraryView = "plans" | "exercises";
export interface NavigationItem {
  href: string;
  label: string;
  icon: IconName;
}
export interface AppShellProps {
  children: ReactNode;
  email: string | null;
  signedIn: boolean;
  activeWorkout: ActiveWorkoutSummary | null;
}
export interface PageHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}
export interface CardProps {
  children: ReactNode;
  className?: string;
}
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "quiet";
}
export interface ButtonLinkProps {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "quiet";
}
export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}
export interface LibraryBrowserProps {
  view: LibraryView;
  plans?: WorkoutTemplateLibrary;
  exercises?: ExerciseLibrary;
}
