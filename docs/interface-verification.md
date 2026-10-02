# Interface verification

Automated tests cover navigation destinations, form behavior, ownership checks,
mutation feedback, and recovery paths using mocked services. A production build
checks route compilation. Neither establishes visual quality or persistence
against a live Supabase instance; complete the checks below before release.

## Account and entry

- From `/`, start a fresh demo and resume an existing demo. Both open Today at
  `/v2` with usable plans. A regular signed-in account retains its own data.
- Sign in and create an account. An immediate session opens Today; signup that
  requires confirmation shows instructions, then the email callback opens Today.
- Sign out, then check protected pages. Follow the password recovery checks in
  [Authentication](authentication.md), including expired and reused links.

## Training journey

- With an empty account, create a plan, add exercises, change settings, and save.
  Leave with unsaved changes and check the warning. Reload to verify persistence.
- Create a custom exercise, archive and restore it. Archive and restore a plan.
  Check filtering, search, empty results, and the exercise-management link from
  the plan editor. Existing workout snapshots must retain their original settings.
- Start a workout, log and edit sets, leave and resume it, then complete it.
  Confirm saved results in History. Repeat with an abandoned workout.
- Browse History by session, plan, and exercise. Check month groups and Previous/
  Next pagination, including first/last-page disabled states.
- Open classic from the sidebar or Profile, make an exercise change, then use
  **Open current app**. Check that v2 reflects the saved change after navigation.
- Open a missing workout URL. Check the unavailable message and Back to Today
  link. If a page request fails, check retry feedback without exposed error details.

## Layout and accessibility

- Check a narrow phone viewport and a desktop viewport, including long plan and
  exercise names. Look for clipping, horizontal scroll, and controls hidden by
  bottom navigation or the on-screen keyboard.
- Navigate using only the keyboard: skip links, navigation, search choices,
  dialogs, and forms. Check visible focus, Escape behavior, focus return after
  dialogs, and clear field labels and validation feedback.
- Check zoomed text and reduced motion. Confirm pending, empty, error, success,
  and archived states remain distinguishable without relying only on color.

Manual visual and live-service acceptance must be recorded separately from
automated test results.
