// @vitest-environment node
import { createServerClient } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));
vi.mock("@/lib/supabase/env", () => ({
  getSupabaseConfig: () => ({
    url: "https://example.supabase.co",
    publishableKey: "test-key",
  }),
}));

it("propagates rotated auth cookies and cache protection headers", async () => {
  vi.mocked(createServerClient).mockImplementation(
    (_url, _key, options) =>
      ({
        auth: {
          getUser: async () => {
            await options.cookies.setAll?.(
              [
                {
                  name: "auth-token",
                  value: "rotated",
                  options: { path: "/", sameSite: "lax" },
                },
              ],
              {
                "Cache-Control": "private, no-store",
                Pragma: "no-cache",
                Expires: "0",
              },
            );
            return { data: { user: {} }, error: null };
          },
        },
      }) as unknown as ReturnType<typeof createServerClient>,
  );
  const request = new NextRequest("https://rep-pilot.example/templates");
  const response = await middleware(request);
  expect(request.cookies.get("auth-token")?.value).toBe("rotated");
  expect(response.cookies.get("auth-token")?.value).toBe("rotated");
  expect(response.headers.get("cache-control")).toBe("private, no-store");
  expect(response.headers.get("pragma")).toBe("no-cache");
});
