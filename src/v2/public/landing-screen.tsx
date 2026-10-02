import Link from "next/link";
import { DemoEntryForm } from "@/features/demo/demo-entry-form";
import { Card } from "../ui/primitives";
import { PublicShell } from "./public-shell";

export function LandingScreen() {
  return <PublicShell showSignIn={false}>
    <section className="v2-landing-hero">
      <div className="v2-public-stack">
        <h1>Track your strength training.</h1>
        <p className="v2-description">Create plans, log sets, and review your progress.</p>
        <div className="v2-landing-entry"><DemoEntryForm /><p className="v2-muted">No account required.</p></div>
        <Link className="v2-text-link" href="/login">Sign in or create an account</Link>
      </div>
      <Card className="v2-public-stack v2-landing-preview">
        <p className="v2-eyebrow">Example workout</p><h2>Bench press</h2>
        <p className="v2-muted">3 sets · 8–12 reps</p>
        <ol className="v2-preview-sets"><li><span>Set 1</span><strong>60 kg × 10</strong></li><li><span>Set 2</span><strong>60 kg × 9</strong></li><li><span>Set 3</span><strong>60 kg × 8</strong></li></ol>
      </Card>
    </section>
  </PublicShell>;
}
