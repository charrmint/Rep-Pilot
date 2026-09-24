# Authentication

RepPilot uses Supabase Auth with cookie-backed sessions through `@supabase/ssr`.
Protected pages and mutations validate the user with `getUser()`. Missing,
expired, or revoked credentials are treated as signed out; service failures
remain distinct from an absent session. Middleware refreshes credentials and
forwards Supabase's cookie and cache-protection headers.

## Email confirmation and password recovery

- Signup requests redirect to `/auth/callback` for PKCE code exchange, then to
  `/templates`.
- `/forgot-password` accepts an account email and requests a recovery email.
  The success message does not disclose whether the account exists.
- Recovery requests redirect to `/auth/callback?next=/reset-password`. The
  callback exchanges the code and redirects to `/reset-password`. It accepts
  only fixed application destinations and never forwards provider error text.
- Signed-in users select **Change password**; signed-out users select **Forgot
  password**. Both request and open a recovery email before choosing a password.
- The callback, new-password page, and Server Action require a non-anonymous
  user from `getUser()` and verified `getClaims()` containing a `recovery` AMR
  entry from the last 15 minutes. A normal session or signup confirmation does
  not qualify; a query parameter alone cannot authorize recovery. Submission
  rejects an account switch since the form loaded.
- Before calling Supabase to update the password, the Server Action atomically
  consumes the recovery session through `consume_password_recovery()`. Only one
  concurrent submission succeeds. Refreshing the JWT does not renew recovery
  authorization or make a consumed session reusable.
- Password length and confirmation checks happen before consumption. Once the
  provider update is attempted, even a rejected password or uncertain network
  outcome requires a new email. This prevents retries from reusing authorization
  after a password may have changed.
- After updating the password, the app requests global sign-out and returns to
  sign-in. If sign-out fails, it reports that the password was updated and offers
  a sign-out retry without repeating the password change.
- Missing, expired, reused, or unverifiable recovery links lead back to the reset
  request screen with instructions for obtaining a new email.

The default PKCE flow requires opening the email link in the **same browser and
device** that requested it. A new request can supersede the previous verifier;
use the latest email. Custom email-template/token-hash flows for cross-device
verification are not implemented. Ordinary authenticated sessions cannot access
RepPilot's password form without recent recovery-email verification.

### Enforcement boundary

These checks protect RepPilot's routes and Server Action. They do **not** change
Supabase Auth's direct `/auth/v1/user` endpoint: a caller with a session token may
still update a password there under the provider's own policy. Supabase's secure
password change setting exempts sessions created within the last 24 hours. This
implementation does not claim email verification on every provider API request.

### Database prerequisite

Apply `supabase/migrations/20260924120000_consume_password_recovery.sql` before
releasing this application change. It adds a private, RLS-protected consumption
table and a restricted RPC that checks the calling JWT's recovery method,
timestamp, user, and session. No service-role key is used. Consumption rows
contain no passwords or tokens and are deleted when the account is deleted.
Without the migration, password updates fail closed.

Run `supabase test db` against a local instance for the database authorization
checks in `supabase/tests/password_recovery.sql`. Unit tests mock the database;
they do not establish that a deployed migration or hosted Auth flow works.

## Supabase configuration

For the hosted project, configure the Site URL as the canonical deployed origin
and allow these exact redirect URLs:

```text
https://rep-pilot.vercel.app/auth/callback
https://rep-pilot.vercel.app/auth/callback?next=/reset-password
```

Use equivalent URLs for another deployment origin. The checked-in local
configuration allows these callbacks on both `http://localhost:3000` and
`http://127.0.0.1:3000`. Use one hostname consistently throughout an email flow,
because its verifier is stored in that browser's cookies for that hostname.

Keep email templates using Supabase's `{{ .ConfirmationURL }}` link for this
implementation. Configure a production SMTP provider for real email delivery;
the default service is restricted and is not a production delivery guarantee.
Local Supabase captures email in Mailpit. Enable email confirmations locally
when specifically testing signup confirmation; the checked-in local default
has them disabled.

Changes to `supabase/config.toml` configure local Supabase; they do not update a
hosted project's Auth settings. Hosted redirect allow-lists, email templates,
SMTP delivery, and password policy must be checked before release.

## Session lifetime

The local access-token lifetime remains 3,600 seconds, with refresh-token
rotation enabled. Email OTP expiry also remains unchanged at 3,600 seconds.
No inactivity timeout or maximum session lifetime is introduced here. Cookie
retention is not a session inactivity policy: Supabase controls whether a stored
refresh token can renew a session.

Global sign-out revokes refresh sessions. Already issued access JWTs can remain
usable until expiry by services that validate only the JWT, such as database
requests governed by RLS. Do not describe password recovery as instantaneous
revocation of every issued access token.

## Verification

Unit/component tests cover code-exchange routing, safe destinations, invalid
sessions, account switches, password validation, partial success when sign-out
fails, recovery feedback, and refreshed cookie/cache headers. These tests mock
Supabase and do not verify hosted email delivery or provider configuration.

On a local instance or an explicitly approved test environment:

1. Create an email account with confirmation enabled. Open its latest email in
   the same browser, confirm that the callback establishes a session, then sign out.
2. Request a password reset from sign-in. Check the neutral success message and
   follow the email to the new-password page.
3. Submit mismatched passwords, then matching passwords. Confirm success returns
   to sign-in, the old password fails, and the new password succeeds.
4. Reopen a used link and try an expired link or another browser. Each should
   offer a new reset request without rendering provider errors or credentials.
5. Open the new-password page without a session, in anonymous demo mode, and
   after an ordinary password login. All should return to the reset request
   screen. Relabeling a signup callback with `next=/reset-password` must fail.
   From a signed-in account, use Change password and follow the new email.
6. Wait 15 minutes after recovery verification; submission must require a new
   email, even if the access token has refreshed. Submit twice concurrently;
   only one provider update should be attempted.
7. Expire/revoke the session while the form is open; verify submission cannot
   update a password. Switch accounts in another tab and verify the same guard.
8. Exercise sign-out failure and password-update success followed by sign-out
   failure. Recovery must distinguish those outcomes and permit retry.
9. Confirm session refresh preserves cookies and sends no-store headers. Verify
   protected pages and workout mutations redirect to sign-in after session loss.

References: [Supabase password auth](https://supabase.com/docs/guides/auth/passwords),
[PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), and
[session behavior](https://supabase.com/docs/guides/auth/sessions).
