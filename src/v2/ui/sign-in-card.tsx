import { ButtonLink, Card } from "./primitives";

export function SignInCard() {
  return (
    <Card className="v2-empty">
      <h2>Your training, all together.</h2>
      <p>
        Sign in to see your plans, exercises, and workout history, or explore
        with a demo account.
      </p>
      <div className="v2-actions">
        <ButtonLink href="/login">Sign in</ButtonLink>
        <ButtonLink href="/" variant="secondary">
          Explore demo
        </ButtonLink>
      </div>
    </Card>
  );
}
