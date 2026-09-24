import { getV2Context } from "../server/context";
import { ButtonLink, Card, PageHeader } from "../ui/primitives";
import { SignInCard } from "../ui/sign-in-card";
import { SignOutButton } from "./sign-out-button";

export async function ProfileScreen() {
  const { user } = await getV2Context();
  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title="Your training space."
        description="Account essentials, out of the way of your next set."
      />
      {!user ? (
        <SignInCard />
      ) : (
        <Card className="v2-account-card">
          <p className="v2-eyebrow">
            {user.is_anonymous ? "Demo account" : "Signed in"}
          </p>
          <h2>{user.email || "Training in demo mode"}</h2>
          <p className="v2-muted">
            {user.is_anonymous
              ? "Explore plans, log workouts, and get a feel for your routine."
              : "Manage access to your RepPilot account."}
          </p>
          <div className="v2-actions">
            {user.email && (
              <ButtonLink href="/forgot-password" variant="secondary">
                Change password
              </ButtonLink>
            )}
            <SignOutButton />
          </div>
        </Card>
      )}
      <Card className="v2-destination">
        <h2>Keep your routine going.</h2>
        <p>All your workout tools are also available in the classic app.</p>
        <ButtonLink href="/templates" variant="secondary">
          Open classic app
        </ButtonLink>
      </Card>
    </>
  );
}
