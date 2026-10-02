import Link from "next/link";
import type { PublicShellProps } from "./types";
import "../styles.css";
import "./styles.css";

export function PublicShell({ children, narrow = false, showSignIn = true }: PublicShellProps) {
  return <div className="v2-root v2-public">
    <a className="v2-public-skip" href="#public-content">Skip to content</a>
    <header className="v2-public-header"><Link className="v2-public-brand" href="/">RepPilot</Link>
      {showSignIn && <Link className="v2-text-link" href="/login">Sign in</Link>}
    </header>
    <main id="public-content" className={narrow ? "v2-public-content v2-public-content--narrow" : "v2-public-content"}>{children}</main>
  </div>;
}
