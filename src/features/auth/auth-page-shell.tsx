import Link from "next/link";
import { PublicShell } from "@/v2/public/public-shell";
import type { AuthPageShellProps } from "./types";

export function AuthPageShell({ title, description, children }: AuthPageShellProps) {
  return <PublicShell narrow>
    <header className="v2-public-stack"><h1>{title}</h1><p className="v2-description">{description}</p></header>
    {children}
    <Link href="/login" className="v2-text-link">Back to sign in</Link>
  </PublicShell>;
}
