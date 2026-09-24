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

| Route                   | Purpose                                                  |
| ----------------------- | -------------------------------------------------------- |
| `/v2`                   | Training entry screen and resume action                  |
| `/v2/library`           | Search active/archived plans and inspect their exercises |
| `/v2/library/exercises` | Search active/archived exercises and open history        |
| `/v2/history`           | Entry points to session, plan, and exercise history      |
| `/v2/profile`           | Account identity, password recovery link, and sign-out   |

The library uses live account data. Plan creation/editing, archive management,
exercise management, workout logging, and detailed history currently open the
existing routes. Login and demo entry also use the existing routes and keep their
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

## Screen composition for subsequent work

- **Today:** resume/start hero, quick-start plans, then contextual progression and
  last-session cards. Empty accounts should lead to plan creation. Never substitute
  sample metrics for missing data.
- **Workout:** compact header, exercise navigation, prescription and previous
  performance, saved sets, one current set editor, and sticky finish controls.
  Editing/deleting sets and extra sets must remain available. Preserve drafts on
  exercise navigation, exact RIR values, configured increments, and save errors.
- **Plan editor:** name and primary save action, ordered exercise cards, exercise
  picker, then archive management. Each exercise card groups sets, rep range,
  load/unit, and increment. Keep reorder/remove actions near their exercise.
- **History:** session/plan/exercise navigation above compact result cards, with
  pagination. Detail views expand sets and retain records and recommendation
  explanations. Completed and abandoned sessions remain distinguishable.
- **Profile:** account section followed by unit preferences when implemented.
  Do not show nonfunctional preference toggles.
- **Authentication:** a centered form card using the same labeled fields and
  buttons, with inline validation and recovery links.

Keep new view contracts in module-local `types.ts`; reuse existing feature types
for domain objects. Future mutations should call shared actions or services and
refresh the relevant v2 routes as well as existing destinations.
