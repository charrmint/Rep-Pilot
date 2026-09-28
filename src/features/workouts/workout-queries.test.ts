import { beforeEach, expect, it, vi } from "vitest";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { getLatestCompletedWorkoutSessionRow } from "./workout-queries";

vi.mock("@/lib/supabase/server", () => ({ createSupabaseServerClient: vi.fn() }));

const query = {
  select: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  maybeSingle: vi.fn(),
};
const from = vi.fn(() => query);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(createSupabaseServerClient).mockResolvedValue({ from } as unknown as Awaited<ReturnType<typeof createSupabaseServerClient>>);
});

it("filters by owner and completed status before limiting, rather than filtering a mixed history page", async () => {
  query.maybeSingle.mockResolvedValue({ data: { id: "completed" }, error: null });
  expect(await getLatestCompletedWorkoutSessionRow("owner")).toEqual({ id: "completed" });
  expect(from).toHaveBeenCalledWith("workout_sessions");
  expect(query.select).toHaveBeenCalledWith("id");
  expect(query.eq.mock.calls).toEqual([["user_id", "owner"], ["status", "completed"]]);
  expect(query.order.mock.calls).toEqual([
    ["completed_at", { ascending: false, nullsFirst: false }],
    ["started_at", { ascending: false }],
    ["id", { ascending: false }],
  ]);
  expect(query.limit).toHaveBeenCalledWith(1);
  expect(query.eq.mock.invocationCallOrder[1]).toBeLessThan(query.limit.mock.invocationCallOrder[0]);
});

it("returns no result for accounts without completed sessions", async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: null });
  expect(await getLatestCompletedWorkoutSessionRow("owner")).toBeNull();
});

it("keeps failed reads distinct from accounts without completions", async () => {
  query.maybeSingle.mockResolvedValue({ data: null, error: { message: "timeout" } });
  await expect(getLatestCompletedWorkoutSessionRow("owner")).rejects.toThrow("Failed to get latest completed workout");
});
