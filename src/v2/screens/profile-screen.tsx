import Link from "next/link";
import { getV2Context } from "../server/context";
import { ButtonLink, Card, PageHeader } from "../ui/primitives";
import { SignInCard } from "../ui/sign-in-card";
import { SignOutButton } from "./sign-out-button";

export async function ProfileScreen() {
  const { user } = await getV2Context();
  const demo = Boolean(user?.is_anonymous);
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
          <div className="v2-account-identity">
            <p className="v2-eyebrow">{demo ? "Demo account" : "Signed in"}</p>
            <h2>{demo ? "Training in demo mode" : user.email || "Your account"}</h2>
            <p className="v2-muted">
              {demo
                ? "Explore plans, log workouts, and get a feel for your routine."
                : "Manage access to your RepPilot account."}
            </p>
          </div>
          <div className="v2-account-actions">
            {!demo && user.email && (
              <section className="v2-account-action" aria-labelledby="profile-password-heading">
                <div>
                  <h3 id="profile-password-heading">Password recovery</h3>
                  <p className="v2-muted">
                    Request a reset email, then follow its link to choose a new password.
                  </p>
                </div>
                <ButtonLink href="/forgot-password" variant="secondary">
                  Reset password
                </ButtonLink>
              </section>
            )}
            <section className="v2-account-action" aria-labelledby="profile-session-heading">
              <div>
                <h3 id="profile-session-heading">{demo ? "Demo session" : "Account session"}</h3>
                <p className="v2-muted">
                  {demo
                    ? "Sign out when you’re finished exploring."
                    : "Sign out of RepPilot on all devices. Your saved workouts stay in your account."}
                </p>
              </div>
              <SignOutButton />
            </section>
          </div>
        </Card>
      )}
      <div className="v2-profile-classic">
        <p className="v2-muted">Looking for the classic interface?</p>
        <Link href="/templates" className="v2-text-link">
          Open classic app <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </>
  );
}
