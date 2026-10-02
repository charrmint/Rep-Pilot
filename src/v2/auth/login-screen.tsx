import { connection } from "next/server";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/features/auth/auth-server-service";
import type { AuthPageProps } from "@/features/auth/types";
import { DemoEntryForm } from "@/features/demo/demo-entry-form";

import { LoginForm } from "./login-form";
import { PublicShell } from "../public/public-shell";

export default async function LoginPage({ searchParams }: AuthPageProps) {
  await connection();

  const user = await getCurrentUser();
  const { error, status } = await searchParams;

  if (user && !user.is_anonymous && error !== "invalid_link") {
    redirect("/templates");
  }

  return <PublicShell narrow>
    <header className="v2-public-stack"><h1>Your training starts here.</h1><p className="v2-description">Sign in to your account or create one to keep your training together.</p></header>
    {error === "invalid_link" && <p role="alert" className="v2-auth-notice v2-auth-error">This confirmation link is expired, already used, or couldn’t be verified. Try signing in if you already confirmed your email. Otherwise, create your account again and open the latest confirmation link in the same browser and device.</p>}
    {status === "password_reset" && <p role="status" className="v2-auth-notice v2-auth-success">Password updated. Sign in with your new password.</p>}
    <LoginForm />
    <section className="v2-card v2-public-stack" aria-labelledby="demo-heading"><h2 id="demo-heading">Take a look around</h2><p className="v2-muted">Try a private demo with plans and workout history ready to explore.</p><DemoEntryForm secondary /></section>
  </PublicShell>;
}
