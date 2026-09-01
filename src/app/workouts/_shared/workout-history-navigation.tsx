import Link from "next/link";

export type WorkoutHistoryView = "recent" | "templates" | "exercises";

interface WorkoutHistoryNavigationProps {
  activeView: WorkoutHistoryView;
}

const HISTORY_VIEWS: Array<{
  href: string;
  label: string;
  view: WorkoutHistoryView;
}> = [
  { href: "/workouts", label: "Recent", view: "recent" },
  { href: "/workouts/templates", label: "Templates", view: "templates" },
  { href: "/workouts/exercises", label: "Exercises", view: "exercises" },
];

export function WorkoutHistoryNavigation({
  activeView,
}: WorkoutHistoryNavigationProps) {
  return (
    <nav
      aria-label="Workout history views"
      className="grid grid-cols-3 rounded-md bg-gray-200 p-1 text-sm font-semibold"
    >
      {HISTORY_VIEWS.map((item) => {
        const isActive = item.view === activeView;

        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={`rounded px-3 py-2 text-center transition ${
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
  );
}
