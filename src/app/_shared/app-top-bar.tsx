import Link from "next/link";

import { LogoutButton } from "@/features/auth/logout-button";

export type AppSection = "templates" | "exercises" | "history" | "workout";

interface AppTopBarProps {
  activeSection: AppSection;
  userEmail: string | null | undefined;
}

const NAV_ITEMS: Array<{ href: string; label: string; section: AppSection }> = [
  { href: "/templates", label: "Templates", section: "templates" },
  { href: "/exercises", label: "Exercises", section: "exercises" },
  { href: "/workouts", label: "History", section: "history" },
];

export function AppTopBar({ activeSection, userEmail }: AppTopBarProps) {
  return (
    <div className="flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <Link href="/templates" className="text-xl font-semibold text-gray-950">
          RepPilot
        </Link>
        {userEmail ? (
          <p className="mt-1 truncate text-sm text-gray-600">{userEmail}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex rounded-md bg-gray-100 p-1 text-sm font-medium">
          {NAV_ITEMS.map((item) => {
            const isActive = item.section === activeSection;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded px-3 py-2 transition ${
                  isActive
                    ? "bg-white text-gray-950 shadow-sm"
                    : "text-gray-600 hover:text-gray-950"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <LogoutButton />
      </div>
    </div>
  );
}
