# RepPilot v2 interface

The new interface lives at `/v2`, alongside the existing application. Routes in
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
| `/v2/library/exercises`    | Search active/archived exercises and open history        |
| `/v2/history`              | Entry points to session, plan, and exercise history      |
| `/v2/profile`              | Account identity, password recovery link, and sign-out   |
| `/v2/workouts/[sessionId]` | Workout logging, completion, and read-only results       |

The library uses live account data. Plan creation and renaming stay in v2 and
reuse existing name validation, duplicate checks (including archived plans), and
owner-scoped services. Successful creation opens the new plan; renaming retains
its ID and exercises. Saves refresh v2 and related classic views. Failed saves
retain the entered name; uncertain responses prompt checking the library before
retrying. Name drafts stay in memory; app links warn before discarding them and
refresh/close uses the browser warning. Browser history navigation is not intercepted.
Archive management, exercise management, and history browsing
currently open the existing routes. Login and demo entry also use the existing routes and keep their
existing redirects; after signing in, visit `/v2` to use the new interface.

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
