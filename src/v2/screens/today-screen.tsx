import { getV2Context } from "../server/context";
import { ButtonLink, Card, PageHeader } from "../ui/primitives";
import { Icon } from "../ui/icon";
import { SignInCard } from "../ui/sign-in-card";

export async function TodayScreen() {
  const { user, activeWorkout } = await getV2Context();
  return (
    <>
      <PageHeader
        eyebrow="Your training, one set at a time"
        title="Ready when you are."
        description="A little consistency. A little stronger."
      />
      {!user ? (
        <SignInCard />
      ) : (
        <Card className="v2-hero">
          <span className="v2-chip v2-chip--success">
            {activeWorkout ? "Workout in progress" : "Your next session"}
          </span>
          <h2>{activeWorkout?.templateName ?? "Start with a plan."}</h2>
          <p>
            {activeWorkout
              ? "Pick up where you left off. Your logged sets are saved."
              : "Choose your routine, get into your rhythm, and make every set count."}
          </p>
          <ButtonLink
            href={
              activeWorkout ? `/v2/workouts/${activeWorkout.id}` : "/v2/library"
            }
          >
            {activeWorkout ? "Resume workout" : "Choose a workout"}
            <Icon name="arrow" />
          </ButtonLink>
        </Card>
      )}
      <div className="v2-section-heading">
        <div>
          <p className="v2-eyebrow">Built around your training</p>
          <h2>Find your next step</h2>
        </div>
      </div>
      <div className="v2-two-column">
        <Card className="v2-destination">
          <span className="v2-tile-icon">
            <Icon name="library" />
          </span>
          <h2>Your routine, ready.</h2>
          <p>Keep your training plans and go-to exercises in one place.</p>
          <ButtonLink href="/v2/library" variant="secondary">
            Explore library <Icon name="arrow" />
          </ButtonLink>
        </Card>
        <Card className="v2-destination">
          <span className="v2-tile-icon">
            <Icon name="history" />
          </span>
          <h2>Every session adds up.</h2>
          <p>Look back at your training and see what to build on.</p>
          <ButtonLink href="/v2/history" variant="secondary">
            View history <Icon name="arrow" />
          </ButtonLink>
        </Card>
      </div>
    </>
  );
}
