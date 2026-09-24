// @vitest-environment node
import { AuthApiError } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  getPasswordRecoveryUser,
  updateRecoveredPassword,
} from "./password-recovery-service";
import { resetPassword } from "./password-recovery-actions";

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));
const auth = {
  getUser: vi.fn(),
  getClaims: vi.fn(),
  updateUser: vi.fn(),
  signOut: vi.fn(),
};
const rpc = vi.fn();
const user = {
  id: "account-id",
  email: "person@example.com",
  is_anonymous: false,
};
const input = {
  userId: user.id,
  password: "a-new-password",
  confirmation: "a-new-password",
};
const now = 1800000000;
function _claims(overrides = {}) {
  return {
    sub: user.id,
    session_id: "recovery-session",
    is_anonymous: false,
    amr: [{ method: "recovery", timestamp: now }],
    ...overrides,
  };
}
function _setClaims(overrides = {}) {
  auth.getClaims.mockResolvedValue({
    data: { claims: _claims(overrides) },
    error: null,
  });
}

describe("server password recovery", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.spyOn(Date, "now").mockReturnValue(now * 1000);
    vi.mocked(createSupabaseServerClient).mockResolvedValue({
      auth,
      rpc,
    } as never);
    auth.getUser.mockResolvedValue({ data: { user }, error: null });
    _setClaims();
    rpc.mockResolvedValue({ data: true, error: null });
    auth.updateUser.mockResolvedValue({ error: null });
    auth.signOut.mockResolvedValue({ error: null });
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(["password", "email/signup", "magiclink", "otp", "token_refresh"])(
    "rejects %s sessions at both page and mutation boundaries",
    async (method) => {
      _setClaims({ amr: [{ method, timestamp: now }] });
      expect(await getPasswordRecoveryUser()).toBeNull();
      expect(await resetPassword(input)).toEqual({
        error: expect.stringContaining("reset session has expired"),
      });
      expect(auth.updateUser).not.toHaveBeenCalled();
      expect(rpc).not.toHaveBeenCalled();
    },
  );
  it.each([
    { amr: [] },
    { amr: undefined },
    { amr: ["recovery"] },
    { amr: [{ method: "recovery", timestamp: now - 900 }] },
    { amr: [{ method: "recovery", timestamp: now + 60 }] },
    { amr: [{ method: "recovery", timestamp: "1800000000" }] },
    { session_id: "" },
    { sub: "another-user" },
    { is_anonymous: true },
  ])(
    "fails closed for invalid or stale recovery claims: %j",
    async (claims) => {
      _setClaims(claims);
      expect(await getPasswordRecoveryUser()).toBeNull();
      expect(await resetPassword(input)).toHaveProperty("error");
      expect(auth.updateUser).not.toHaveBeenCalled();
    },
  );
  it("does not trust claims that failed signature verification", async () => {
    auth.getClaims.mockResolvedValue({
      data: null,
      error: new Error("bad signature"),
    });
    expect(await resetPassword(input)).toHaveProperty("error");
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([
    null,
    { ...user, is_anonymous: true },
    { ...user, email: undefined },
  ])("rejects missing or ineligible users", async (value) => {
    auth.getUser.mockResolvedValue({ data: { user: value }, error: null });
    expect(await resetPassword(input)).toHaveProperty("error");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("rejects revoked sessions even if the claims would still verify", async () => {
    auth.getUser.mockResolvedValue({
      data: { user: null },
      error: new AuthApiError("revoked", 400, "session_not_found"),
    });
    expect(await resetPassword(input)).toHaveProperty("error");
    expect(auth.getClaims).not.toHaveBeenCalled();
  });
  it("returns safe feedback on outages", async () => {
    auth.getUser.mockRejectedValue(new Error("sensitive provider details"));
    expect(await resetPassword(input)).toEqual({
      error: expect.stringContaining("Unable to process"),
    });
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("rejects an account switch before consuming authorization", async () => {
    expect(await resetPassword({ ...input, userId: "other-account" })).toEqual({
      error: expect.stringContaining("account has changed"),
    });
    expect(rpc).not.toHaveBeenCalled();
  });
  it.each([
    { password: "short", confirmation: "short" },
    { confirmation: "mismatch" },
  ])("validates inputs before consuming authorization", async (values) => {
    expect(await resetPassword({ ...input, ...values })).toHaveProperty(
      "error",
    );
    expect(rpc).not.toHaveBeenCalled();
    expect(auth.getUser).not.toHaveBeenCalled();
  });
  it("consumes authorization before updating and requests global sign-out", async () => {
    expect(await updateRecoveredPassword(input)).toEqual({ signedOut: true });
    expect(rpc).toHaveBeenCalledWith("consume_password_recovery");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: input.password });
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "global" });
    expect(rpc.mock.invocationCallOrder[0]).toBeLessThan(
      auth.updateUser.mock.invocationCallOrder[0],
    );
    expect(auth.updateUser.mock.invocationCallOrder[0]).toBeLessThan(
      auth.signOut.mock.invocationCallOrder[0],
    );
  });
  it.each([
    { data: false, error: null },
    { data: null, error: { message: "missing migration" } },
  ])("rejects consumed sessions and database failures", async (result) => {
    rpc.mockResolvedValue(result);
    expect(await resetPassword(input)).toHaveProperty("error");
    expect(auth.updateUser).not.toHaveBeenCalled();
  });
  it("allows only one of two submissions to update the password", async () => {
    rpc
      .mockResolvedValueOnce({ data: true, error: null })
      .mockResolvedValueOnce({ data: false, error: null });
    const results = await Promise.all([
      resetPassword(input),
      resetPassword(input),
    ]);
    expect(results.filter((result) => !result.error)).toHaveLength(1);
    expect(auth.updateUser).toHaveBeenCalledOnce();
  });
  it.each(["same_password", "weak_password"] as const)(
    "requires a new email after provider rejection: %s",
    async (code) => {
      auth.updateUser.mockResolvedValue({
        error: new AuthApiError("secret", 422, code),
      });
      expect(await resetPassword(input)).toEqual({
        error: expect.stringContaining("Request a new reset email"),
      });
      expect(auth.signOut).not.toHaveBeenCalled();
    },
  );
  it("explains an uncertain update without claiming failure or repeating it", async () => {
    auth.updateUser.mockRejectedValue(new Error("network"));
    expect(await resetPassword(input)).toEqual({
      error: expect.stringContaining("Try signing in"),
    });
  });
  it.each(["returned", "thrown"])(
    "preserves success when sign-out fails (%s)",
    async (kind) => {
      if (kind === "returned")
        auth.signOut.mockResolvedValue({ error: new Error("offline") });
      else auth.signOut.mockRejectedValue(new Error("offline"));
      expect(await resetPassword(input)).toEqual({ signedOut: false });
    },
  );
});
