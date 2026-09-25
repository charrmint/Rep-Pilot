import Link from "next/link";
import { listWorkoutTemplateLibrary } from "@/features/templates/template-service";
import { listExerciseLibrary } from "@/features/exercises/exercise-service";
import { getV2Context } from "../server/context";
import type { LibraryView } from "../types";
import { ButtonLink, PageHeader } from "../ui/primitives";
import { Icon } from "../ui/icon";
import { SignInCard } from "../ui/sign-in-card";
import { LibraryBrowser } from "./library-browser";

export async function LibraryScreen({ view }: { view: LibraryView }) {
  const { user, activeWorkout, activeWorkoutUnavailable } = await getV2Context();
  const plans =
    user && view === "plans"
      ? await listWorkoutTemplateLibrary(user.id)
      : undefined;
  const exercises =
    user && view === "exercises" ? await listExerciseLibrary() : undefined;
  return (
    <>
      <PageHeader
        eyebrow="Library"
        title="Make it your routine."
        description="Your plans and exercises. Ready for the next session."
        action={
          user ? (
            <ButtonLink href={view === "plans" ? "/templates" : "/exercises"}>
              <Icon name="plus" />
              {view === "plans" ? "Create a plan" : "Manage exercises"}
            </ButtonLink>
          ) : undefined
        }
      />
      <nav className="v2-tabs" aria-label="Library views">
        <Link
          href="/v2/library"
          aria-current={view === "plans" ? "page" : undefined}
        >
          Plans
        </Link>
        <Link
          href="/v2/library/exercises"
          aria-current={view === "exercises" ? "page" : undefined}
        >
          Exercises
        </Link>
      </nav>
      {user ? (
        <LibraryBrowser
          key={view}
          view={view}
          plans={plans}
          exercises={exercises}
          activeWorkout={activeWorkout}
          activeWorkoutUnavailable={activeWorkoutUnavailable}
        />
      ) : (
        <SignInCard />
      )}
    </>
  );
}
