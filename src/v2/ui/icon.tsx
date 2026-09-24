import type { IconName } from "../types";

const PATHS: Record<IconName, string> = {
  today: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  history: "M3 11a9 9 0 1 1 2 7M3 4v7h7M12 7v5l3 2",
  library: "M4 5h16M4 12h16M4 19h16M7 3v4M17 10v4M9 17v4",
  profile: "M16 8a4 4 0 1 1-8 0 4 4 0 0 1 8 0M4 21a8 8 0 0 1 16 0",
  arrow: "m9 6 6 6-6 6",
  plus: "M12 5v14M5 12h14",
  search: "M19 10a7 7 0 1 1-14 0 7 7 0 0 1 14 0m-2 5 5 6",
  dumbbell: "M6.5 6.5v11M3.5 8.5v7M17.5 6.5v11M20.5 8.5v7M6.5 12h11",
};

export function Icon({ name }: { name: IconName }) {
  return (
    <svg
      className="v2-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
