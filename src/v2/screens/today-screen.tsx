import Link from "next/link";
import { Suspense } from "react";
import { getV2Context } from "../server/context";
import { ButtonLink, Card, PageHeader } from "../ui/primitives";
import { Icon } from "../ui/icon";
import { SignInCard } from "../ui/sign-in-card";
import { RetryButton } from "../ui/retry-button";
import { ElapsedTime } from "../workouts/elapsed-time";
import { ActiveProgress } from "../today/active-progress";
import { loadTodayPlans } from "../today/data";
import { NextWorkout, TodayPlans, TodayPlansHeading } from "../today/today-plans";

export async function TodayScreen() {
  const { user, activeWorkout, activeWorkoutUnavailable } = await getV2Context();
  const plans = user ? loadTodayPlans(user.id) : null;
  return (
    <>
      <PageHeader eyebrow="Your training, one set at a time" title="Ready when you are." description="A little consistency. A little stronger." />
      {!user || !plans ? <SignInCard /> : (
        <>
          {activeWorkoutUnavailable ? (
            <Card className="v2-hero">
              <h2>Let’s check your workout.</h2>
              <p role="alert">We couldn’t check whether you have a workout in progress. Try again before starting another.</p>
              <RetryButton />
            </Card>
          ) : activeWorkout ? (
            <Card className="v2-hero">
              <span className="v2-chip v2-chip--success">Workout in progress</span>
              <h2>{activeWorkout.templateName}</h2>
              <p>Pick up where you left off. Your logged sets are saved.</p>
              <ElapsedTime startedAt={activeWorkout.startedAt} />
              <Suspense fallback={<p role="status">Loading saved set progress…</p>}>
                <ActiveProgress userId={user.id} sessionId={activeWorkout.id} />
              </Suspense>
              <ButtonLink href={`/v2/workouts/${activeWorkout.id}`}>Resume workout <Icon name="arrow" /></ButtonLink>
            </Card>
          ) : (
            <Suspense fallback={<Card className="v2-hero"><h2>Your next session</h2><p role="status">Loading your plans…</p></Card>}>
              <NextWorkout plans={plans} />
            </Suspense>
          )}
          <section aria-labelledby="quick-start-heading">
            <TodayPlansHeading />
            <Suspense fallback={<Card><p role="status">Loading quick-start plans…</p></Card>}>
              <TodayPlans plans={plans} activeWorkout={activeWorkout} activeWorkoutUnavailable={activeWorkoutUnavailable} />
            </Suspense>
          </section>
          <div className="v2-actions v2-today-links">
            <Link className="v2-text-link" href="/v2/history">View workout history <Icon name="arrow" /></Link>
          </div>
        </>
      )}
    </>
  );
}
