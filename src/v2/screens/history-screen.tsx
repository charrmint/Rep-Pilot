import { getV2Context } from "../server/context";
import { ButtonLink, Card, PageHeader } from "../ui/primitives";
import { Icon } from "../ui/icon";
import { SignInCard } from "../ui/sign-in-card";

export async function HistoryScreen() {
  const { user } = await getV2Context();
  return (
    <>
      <PageHeader
        eyebrow="History"
        title="Progress, with context."
        description="Your sessions, your numbers, and the work behind them."
      />
      {!user ? (
        <SignInCard />
      ) : (
        <>
          <Card className="v2-hero">
            <span className="v2-tile-icon">
              <Icon name="history" />
            </span>
            <h2>Look back. Move forward.</h2>
            <p>
              Review logged sets, personal records, and recommendations from
              your workouts.
            </p>
            <ButtonLink href="/workouts">
              Browse workout history <Icon name="arrow" />
            </ButtonLink>
          </Card>
          <div className="v2-two-column">
            <Card className="v2-destination">
              <h2>Follow a plan</h2>
              <p>See how each training plan has progressed over time.</p>
              <ButtonLink href="/workouts/templates" variant="secondary">
                History by plan
              </ButtonLink>
            </Card>
            <Card className="v2-destination">
              <h2>Focus on an exercise</h2>
              <p>Compare your performance across individual movements.</p>
              <ButtonLink href="/workouts/exercises" variant="secondary">
                History by exercise
              </ButtonLink>
            </Card>
          </div>
        </>
      )}
    </>
  );
}
