"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AppShellProps, NavigationItem } from "../types";
import { Icon } from "../ui/icon";
import { RetryButton } from "../ui/retry-button";
import { ButtonLink } from "../ui/primitives";

const NAVIGATION: NavigationItem[] = [
  { href: "/v2", label: "Today", icon: "today" },
  { href: "/v2/history", label: "History", icon: "history" },
  { href: "/v2/library", label: "Library", icon: "library" },
  { href: "/v2/profile", label: "Profile", icon: "profile" },
];

export function AppShell({
  children,
  email,
  signedIn,
  activeWorkout,
  activeWorkoutUnavailable = false,
}: AppShellProps) {
  const pathname = usePathname();
  const focused = pathname.startsWith("/v2/workouts/");
  const accountLabel =
    email || (signedIn ? "Demo account" : "Welcome to RepPilot");

  function _navigation(label: string, className: string) {
    return (
      <nav aria-label={label} className={className}>
        {NAVIGATION.map((item) => {
          const active =
            item.href === "/v2"
              ? pathname === item.href
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className="v2-nav-link"
            >
              <span className="v2-nav-icon">
                <Icon name={item.icon} />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <div className={`v2-root${focused ? " v2-root--workout" : ""}`}>
      <a className="v2-skip-link" href="#v2-content">
        Skip to content
      </a>
      <aside className="v2-sidebar">
        <Link className="v2-brand" href="/v2">
          <span className="v2-brand-mark">RP</span>RepPilot
        </Link>
        {_navigation("Primary navigation", "v2-rail-nav")}
        {activeWorkout && (
          <section className="v2-rail-workout">
            <p className="v2-eyebrow">Workout in progress</p>
            <h2>{activeWorkout.templateName}</h2>
            <ButtonLink href={`/v2/workouts/${activeWorkout.id}`}>
              Resume workout <Icon name="arrow" />
            </ButtonLink>
          </section>
        )}
        <div className="v2-rail-account">
          <Link href="/v2/profile" className="v2-account-link">
            <span className="v2-avatar">
              <Icon name="profile" />
            </span>
            <span>
              <strong>Your training space</strong>
              <span className="v2-account-email">{accountLabel}</span>
            </span>
          </Link>
          <Link href="/templates" className="v2-text-link">
            Open classic app <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>
      <div className="v2-main-column">
        <header className="v2-mobile-header">
          <Link className="v2-brand" href="/v2">
            <span className="v2-brand-mark">RP</span>RepPilot
          </Link>
          <Link
            className="v2-avatar"
            href="/v2/profile"
            aria-label="Open profile"
          >
            <Icon name="profile" />
          </Link>
        </header>
        <main id="v2-content" tabIndex={-1} className="v2-content">
          {activeWorkoutUnavailable && pathname !== "/v2" && (
            <section
              className="v2-card v2-workout-status-error"
              aria-label="Workout status"
            >
              <p role="alert">
                Your active workout status couldn’t load. Starting a workout is
                unavailable until we can check it.
              </p>
              <RetryButton />
            </section>
          )}
          {children}
        </main>
      </div>
      {_navigation("Mobile navigation", "v2-bottom-nav")}
    </div>
  );
}
