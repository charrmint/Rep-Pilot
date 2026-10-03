# RepPilot v2 interface

The default training interface lives at `/v2`. The classic application remains
available at `/templates` through the sidebar or Profile. Routes in
`src/app/v2` compose screens from this module. All styling is scoped to `.v2-root`
so visiting v2 cannot change the appearance of existing routes.

## Shared implementation

- Authentication: `features/auth` services and the existing Supabase session.
- Plans: `features/templates/template-service` and its existing domain types.
- Exercises: `features/exercises/exercise-service` and its existing domain types.
- Active workouts: `features/workouts/workout-service`.
- No new database tables, parallel domain models, or copied query logic.

`server/context.ts` shares auth and active-workout reads within a server request.
Client modules receive presentation data, never a database client or credential.

## Routes and interaction boundaries

| Route                      | Purpose                                                  |
| -------------------------- | -------------------------------------------------------- |
| `/v2`                      | Training entry screen and resume action                  |
| `/v2/library`              | Search active/archived plans and inspect their exercises |
| `/v2/library/plans/new` | Create a plan |
| `/v2/library/plans/[templateId]` | Rename a plan and configure its exercises |
| `/v2/library/exercises`    | Create, archive, restore, and add exercises to plans        |
| `/v2/history`              | Completed/abandoned sessions grouped by local month      |
| `/v2/profile`              | Account identity, password recovery link, and sign-out   |
| `/v2/workouts/[sessionId]` | Workout logging, completion, and read-only results       |

The library uses live account data. Plan creation and renaming stay in v2 and
reuse existing name validation, duplicate checks (including archived plans), and
owner-scoped services. Successful creation opens the new plan; renaming retains
its ID and exercises. Saves refresh v2 and related classic views. Failed saves
retain the entered name; uncertain responses prompt checking the library before
retrying. Name drafts stay in memory; app links warn before discarding them and
refresh/close uses the browser warning. Browser history navigation is not intercepted.
History browsing stays in v2. Landing and authentication use v2 presentation at
the existing shared URLs. Successful login, signup with a session, email
confirmation, and demo entry open `/v2`. The public `/` remains the landing page.
Classic routes stay accessible, and their header links back to the current app.
Exercise changes in classic also invalidate v2 so both interfaces reflect saved data.

## Design foundations

Warm dark surfaces, bronze actions, green success feedback, and rose errors are
defined as semantic CSS variables in `styles.css`. Shared primitives cover
buttons, links, cards, labeled inputs, headings, and icons. Typography uses the
application's existing Geist font. Controls have visible keyboard focus; layouts
respect safe-area insets and reduced-motion preferences.

Below 980px, navigation sits at the bottom with a compact header. Wider layouts
use a 248px sidebar. Content remains centered and bounded, and cards use two
columns where space permits. Library archives are a filter, not a separate
account setting.

## Plan exercise editing

Plan pages add, remove, reorder, and configure exercises in v2. The searchable exercise picker displays matching results as you type, with
arrow-key navigation, Enter to select, Escape to dismiss, and a clear action.
Typing again clears the previous selection so only an explicitly chosen exercise
can be added. The picker includes active built-in and custom exercises and excludes exercises
already configured in the plan. Existing archived references remain editable.
Each exercise saves separately through the shared template services; there is
no whole-plan transaction. Removing an exercise requires confirmation and does
not delete its history or change existing workout snapshots.

Configuration retains sets, rep ranges, entered weight/unit, and increments in
pounds. Changing the unit keeps the entered number, matching the classic editor;
it does not convert the load. Existing unit normalization remains authoritative.
RIR is recorded on workout sets, not configured on plans.

Exercise drafts are keyed by template-exercise ID and survive other saves,
reordering, and name refreshes. The name and exercise forms share a leave warning
and block competing saves while a request is pending. Drafts are in memory;
refresh/close warns, and browser history navigation is not intercepted.

After mutation failures, the editor reloads persisted plan state and preserves
remaining drafts. If that read fails, mutations stay locked until “Check saved
plan” succeeds. A recovered add is removed from the picker, preventing an
accidental repeat. Existing reorder/removal services use multiple writes: a
failed operation can leave a partially changed order, which is shown after the
reload for review before another action. Successful changes refresh Library,
Today, and classic plan views. New settings apply to future sessions only.

## Plan archive and restore

Plans can be archived and restored from their v2 plan page. Archive requires
confirmation; save or discard pending name and exercise edits first. Archived
plans remain accessible through Library’s Archived filter and retain their
exercises. Restoring returns a plan to the active library; it appears in Today’s
quick starts only when it meets the existing eligibility and ordering rules.
Active workout snapshots and historical results remain unchanged.

Archive actions share the editor’s pending lock and saved-state recovery. An
uncertain response reloads the persisted plan before retrying; a failed recovery
locks mutations until “Check saved plan” succeeds. Library, Today, the plan page,
and classic plan views refresh after changes.

## Focused workout behavior

Active Library plans start sessions through the existing workout service. Today
and sidebar resume links open the same session in v2. The server checks ownership
before loading a workout; existing save/delete actions remain authoritative for
set validation and session status. No persistence or progression rules change.

The editor opens the first missing planned set and keeps separate drafts by
session exercise and set position. Switching exercises or editing a saved set
preserves other drafts. Successful saves advance to the next missing planned set;
exercise changes remain explicit. Extra sets do not count toward another missing
planned position. Deletion preserves the positions of remaining sets.

Drafts are in memory only. App links warn before discarding unlogged changes;
refresh/close uses the browser's leave warning. Browser history navigation is not
intercepted. Drafts do not survive a page unmount or reload, and no offline writes
are queued. Logged sets remain on the server.

After an uncertain mutation failure, the editor reloads the session before
allowing a retry. If that read also fails, mutation controls remain locked until
“Check saved sets” succeeds. Draft values are retained for review; a set found at
the draft's position is updated by its persisted ID instead of inserted again.

Weight and reps use inline decrement/input/increment controls. Weight steppers use
the session's configured increment and existing unit helpers; reps change by one.
Previous performance starts with a compact summary, with individual saved sets
and recommendation explanations available through disclosures. Mixed weights or
units remain explicit. Logged sets use aligned columns, with deletion available
when editing a saved set and confirmed before removal. Workout options contain
Abandon; the next-exercise card previews the session's saved prescription.
RIR uses 0, 1, 2, 3+, and Skip buttons, defaulting to Skip. The 3+ option
stores 3, matching the existing top option; Skip stores null. Existing saved
values above 3 are preserved unless the effort selection is changed. Suggestions apply only to the
current unsaved weight, preserving reps and RIR. Finished and abandoned sessions show
read-only results on the same v2 workout URL.

## Completion and results

Finish and Abandon open native modal dialogs with keyboard focus containment.
Finishing a partial workout shows the remaining planned-set count. Any dirty
exercise draft requires explicit acknowledgement before discarding it; dismissing
the dialog keeps the draft. Set mutations and lifecycle mutations share the same
pending lock, preventing completion while a set is still being saved.

Completion calls the existing `finishWorkout` service, including its atomic
persistence of recommendations and strength records. The UI uses the existing
strength-set validator to explain why a session needs at least one set with
positive weight and reps. Abandonment calls `cancelWorkout` and retains logged
sets without generating completion products.

Results load persisted sets, recommendations, and records. Shared recommendation
and record components keep explanations and units consistent with the classic
app, with scoped v2 presentation overrides. Duration uses the existing workout
history helper; abandoned sessions omit duration because no end timestamp is
stored. An empty or skipped exercise is shown explicitly.

After an uncertain lifecycle response, the screen reloads server state. A closed
session displays its actual results; an active session retains drafts and offers
a retry. If status cannot be checked, further mutations remain blocked until
recovery succeeds. Successful completion and recovery of closed sessions refresh
v2 navigation and invalidate the related classic workout/history views.

## Screen composition for subsequent work

- **Today:** the active session leads with elapsed time and saved planned-set
  progress; extra sets do not fill missing planned positions. Up to two active
  plans with exercises appear in recently-updated order, with ID breaking ties.
  Empty accounts lead to v2 plan creation; incomplete and archived plans
  lead to Library. Plans and progress stream independently so a slow or failed
  optional read does not remove Resume. Failed active-workout reads preserve
  account access but disable starts in Today and Library until a refresh succeeds.
  Set mutations invalidate Today; lifecycle mutations refresh v2 navigation.
  The latest completed workout is selected across all sessions by completion
  time, then start time and ID; undated legacy completions sort last and show no
  invented finish time or duration. Summary counts use saved sets (including
  extras) and exercises with saved sets, matching results rather than claiming
  every planned exercise was finished. The first exercise in session order with
  a saved recommendation and the first with saved records provide contextual
  previews. Shared result components preserve units, explanations, and baseline
  labels. These are saved outcomes of that workout, not prescriptions for an
  unrelated or edited plan. Insights load independently of start/resume, with
  explicit empty and retry states. No recommendations are recalculated on read.
  Never substitute sample metrics for missing data.
- **Plan editor:** name and primary save action, ordered exercise cards, exercise
  picker, then archive management. Each exercise card groups sets, rep range,
  load/unit, and increment. Keep reorder/remove actions near their exercise.
- **History:** session/plan/exercise navigation above compact result cards, with
  pagination. Detail views expand sets and retain records and recommendation
  explanations. Completed and abandoned sessions remain distinguishable.
- **Profile:** account identity followed by password recovery and sign-out.
  Reset password opens the existing email recovery flow; demo accounts do not
  show recovery controls. Sign-out uses the shared global sign-out service,
  prevents duplicate submissions, and retains retry feedback on failure.
  Classic access remains a secondary link. Unit preferences are not active;
  there are no nonfunctional preference toggles.
- **Authentication:** a centered form card using the same labeled fields and
  buttons, with inline validation and recovery links.

Keep new view contracts in module-local `types.ts`; reuse existing feature types
for domain objects. Future mutations should call shared actions or services and
refresh the relevant v2 routes as well as existing destinations.

## Exercise management

Library’s Exercises tab supports custom exercise creation, archive/restore, and
adding active exercises to active plans. Built-in exercises cannot be archived.
Creation reuses name validation and duplicate checks, including archived names.
Archiving hides a custom exercise from pickers without changing existing plan
entries or workout history. Restoring returns it to the active library.

An expandable “Add to plan” form uses the same searchable picker as exercise
selection in the plan editor. It lists only active plans that do not already
contain the exercise. Focus shows choices, typing filters them, and an explicit
selection is required before submitting. Assignments use the existing default prescription: 3 sets
of 8–12 reps, 0 lb, and a 5 lb increment. A success link opens the plan editor
for adjustment. History links open the corresponding v2 history views.

Mutations share a pending lock and reload the saved library and eligible plans.
If verification fails, changes remain disabled until “Check saved library”
succeeds. Failed creation preserves the entered name. Unsaved names use the
same app-link and browser-unload warning as plan forms; browser history
navigation is not intercepted. The forms and row actions extend the mock-up’s
Library placeholder using existing v2 tokens and controls.

Plan exercise cards start collapsed in workout order, showing saved sets, rep
range, and starting weight. Each header independently reveals its settings and
actions. Collapsing retains drafts and exposes an Unsaved changes label; save
requests keep panels open until feedback arrives. Sets and rep bounds share a
compact group, starting weight and unit share another, and increment stays
short. Groups wrap when available width or larger text requires it. New-exercise
settings appear after selection, with drafts retained while searching again.

## History browsing

History offers Sessions, Plans, and Exercises views. Sessions are grouped into
calendar months in the viewer’s local time; existing pagination is retained,
so a month can continue across pages. Completed and abandoned workouts remain
visible, with abandoned status explicitly labeled and no invented duration or
progression decision. Empty pages retain links to newer results when available.

Plan and exercise indexes link to `/v2/history/plans/[templateId]` and
`/v2/history/exercises/[exerciseId]`. Archived plans retain their history.
Session cards expand to show working sets and recorded progression decisions.
Decisions are loaded in one owner-scoped batch per page and are never recomputed
from the current plan. Missing legacy decisions are explicitly identified.

`/v2/history/sessions/[sessionId]` reuses the read-only workout results screen,
including saved prescriptions, logged sets, records, and recommendations. Active
sessions redirect to the workout logger. Library, plan-editor, and result links
stay within v2. The existing authentication, loading, and error boundaries remain
in effect; unavailable subjects have a history-specific return path.

The layout preserves the mock-up’s progression context, using month groups for
easier date scanning, existing v2 tokens, compact cards, and expandable exercise
details. Session dates show Today or Yesterday for recent workouts and a weekday
for older workouts, always alongside the month and day.

## Public entry and authentication

The public landing page and shared `/login`, `/forgot-password`, and
`/reset-password` pages use a standalone presentation shell with v2 colors,
typography, fields, and focus styles. They do not mount the signed-in navigation
or depend on active-workout reads. The landing preview is explicitly illustrative.
Demo entry is primary on the landing page and secondary below the account form.

Existing authentication services, demo provisioning, recovery checks, and
global sign-out behavior are preserved. Successful ordinary authentication and
demo entry open `/v2`; password recovery still
returns to `/login?status=password_reset`. No duplicate authentication URLs or
new provider configuration are introduced. See `docs/authentication.md` for
security behavior and live email-flow verification.

Account and recovery forms prevent duplicate submissions while pending, retain
failure feedback, and support browser password managers. Signup confirmation
and password-reset partial success remain distinct states; sign-out retry does
not repeat a successful password update.
