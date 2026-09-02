# RepPilot Architecture

RepPilot is a mobile-first adaptive workout tracker. The MVP should feel useful during an actual gym session.

The core workflow is:

1. Start a workout from a template.
2. See the previous session beside the current exercise.
3. Log sets quickly from a phone.
4. Receive a deterministic next-session recommendation.
5. Review workout history and useful progress signals.

## Product Boundary

The MVP focuses on strength training first.

Required for MVP:

- authentication and user-specific data
- exercise library
- workout templates
- active workout logging
- previous-session context
- deterministic progression recommendations
- basic workout history
- basic personal records
- active-workout persistence across refreshes

Deferred from MVP:

- native mobile app
- AI-generated plans
- social features
- meal and calorie tracking
- wearable integrations
- Apple Health or Google Fit integration
- complex periodization
- trainer marketplace

## Application Stack

- Next.js App Router for the web application.
- React and TypeScript for UI and domain logic.
- Tailwind CSS for fast mobile-first styling.
- Supabase Auth for identity.
- Supabase PostgreSQL for persistence.
- Supabase Row Level Security for user data isolation.
- Vitest and React Testing Library for unit and component tests.

## Architectural Shape

- `src/app`: routes, layouts, page composition, loading states, and navigation.
- `src/features`: product feature modules such as workouts, exercises,
  progression, and records.
- `src/lib`: shared infrastructure such as Supabase clients, unit conversion, and metrics.
- `docs`: public architecture notes and progression rules.

Framework code composes behavior, while domain code makes product decisions. For example, a page can ask for a recommendation, but the recommendation rule itself should live in the progression feature.

## Layer Responsibilities

### UI and Routes

`src/app` owns routes, layouts, page composition, loading states, and navigation.

This layer should answer:

- what screen is the user on?
- what data does this screen need?
- which feature components are composed together?
- what happens when the user navigates?

This layer should not contain progression rules, unit conversion formulas, personal-record logic, or direct database policy assumptions.

### Feature Modules

`src/features` owns product behavior grouped by domain.

Current modules:

- `src/features/exercises`: exercise library behavior.
- `src/features/templates`: workout template behavior.
- `src/features/workouts`: active workout and workout history behavior.
- `src/features/progression`: recommendation engine and related types.
- `src/features/records`: personal-record detection.

Progress summaries and chart-ready analytics can become a separate feature
module when the product needs them. They should not be introduced merely as a
generic abstraction over workout history.

Feature modules may contain components, hooks, validation schemas, mappers, and domain functions for that feature. The goal is to keep workout logic near workout code and progression logic near progression code instead of spreading it across generic folders.

### Domain Logic

Domain logic is plain TypeScript. It should not depend on React, Supabase, browser APIs, or the current route.

Examples:

- deciding whether to increase, maintain, reduce, or review an exercise
- calculating total volume
- calculating estimated one-rep max
- converting between display units and stored units
- detecting personal records

The progression engine belongs in this layer. It should receive structured input and return a structured recommendation. The app can attach database IDs before saving the result, but the engine itself should not need to know about database records.

### Data Access

Data access code is responsible for reading and writing Supabase data.

This layer should answer:

- how do we fetch exercises for the current user?
- how do we start a workout session?
- how do we save a completed set?
- how do we persist a generated recommendation?

Data access should map database rows into application/domain shapes where needed. UI components should not manually assemble complex Supabase queries.

The current application uses thin route files and Server Actions as entry
points. Feature services coordinate product operations, query modules own
Supabase calls, and mappers translate database rows into application types.
Starting a workout is the notable transactional operation: the
`start_workout_from_template` PostgreSQL function creates the session and its
session-exercise rows atomically.

### Database and Auth

Supabase owns authentication, PostgreSQL persistence, and Row Level Security.

The database should enforce user ownership. Application code may filter by user for convenience, but security should come from RLS policies.

The database stores facts:

- exercises
- workout templates
- workout sessions
- workout sets
- persisted recommendations
- personal records

The database should not be the place where progression decisions are hidden. Recommendation rules should remain in tested TypeScript code, with enough input context stored so results can be reviewed later.

The implemented table model, relationships, enum values, RLS shape, and domain
mapping are documented in [schema.md](./schema.md).

### Local Client State

Local browser state holds set values currently being edited and mirrors saved
sets for immediate UI updates. A set becomes durable when the user logs it.
The active session, session-exercise configuration, and logged sets live in
Supabase, so the active workout is reconstructed from the database after a
refresh or return visit.

Persisting unfinished input drafts or queueing mutations while offline is
deferred until the core logging flow has been tested in real gym sessions.

### Tests

Tests should match the architecture:

- domain tests for progression, metrics, units, and personal records
- component tests for important UI states
- later integration or E2E tests for the full workout flow

The progression engine should have the densest test coverage because it is the core differentiator.

## Current Routes

- `/login`: authentication.
- `/exercises`: searchable exercise library, custom-exercise management, and
  assignment of active exercises to active templates.
- `/templates`: template overview, previews, lifecycle controls, and workout
  start controls.
- `/templates/[templateId]/edit`: focused template builder.
- `/workouts/[sessionId]`: active workout logging or a read-only completed or
  cancelled session.
- `/workouts`: paginated recent workout history.
- `/workouts/templates`: history grouped by template.
- `/workouts/templates/[templateId]`: paginated workout performances for one
  template.
- `/workouts/exercises`: history grouped by exercise.
- `/workouts/exercises/[exerciseId]`: paginated performances for one exercise.

## Active Workout Data Flow

The implemented workout flow is:

1. A user starts an active template from `/templates`.
2. The `start_workout_from_template` database function validates ownership,
   optionally cancels the user's existing active session, creates a
   `workout_sessions` row, and snapshots the ordered template exercise
   configuration into `workout_session_exercises`.
3. `/workouts/[sessionId]` loads the persisted session exercises, logged sets,
   and latest completed working-set performance for each exercise.
4. Each log or update action persists one `workout_sets` row, including an
   optional per-set RIR value. Deleting a set removes that row. Draft field
   values remain local until the user logs them.
5. Finishing loads the two recent completed performances needed by the
   progression engine, generates recommendations for exercises with working
   sets, and sends the results to
   `complete_workout_with_recommendations`. The database function persists the
   recommendations and changes the session to `completed` atomically.
   Abandoning changes it to `cancelled`; already logged sets remain available
   in history.
6. History services expose recent sessions plus template-grouped and
   exercise-grouped views without putting query assembly in route components.

## Recommendation Data Flow

The implemented recommendation lifecycle builds on the persisted workout flow:

1. Feature mappers assemble a progression input from the session-exercise
   snapshot, current working sets, and up to two recent completed performances
   for the same exercise.
2. The pure double-progression engine normalizes every evaluated set into an
   RIR-adjusted capacity estimate, evaluates the current and next configured
   weight increment, and returns an action, machine-readable reason,
   recommended normalized weight, target rep range, target RIR, and
   human-readable explanation. The average projected capacity and the final
   set's projection prevent one unusually strong set from forcing an increase.
3. Application code attaches source identity, including the
   `workout_session_exercise_id`, engine version, and a typed, versioned input
   audit snapshot.
4. The completion database function validates recommendation coverage and
   persists the results in the same transaction that completes the workout.
   Its unique source constraint and completed-session guard make retries safe.
5. The completed workout UI displays a complete next-session prescription in
   the snapshotted exercise unit—weight, retained working sets, rep range, and
   target RIR—and includes the explanation so the decision remains
   inspectable.

The rules and test expectations are documented in
[progression-engine.md](./progression-engine.md). Recommendation rules and
application orchestration must remain outside route files and database
procedures. PostgreSQL stores the decision and audit context but does not hide
the rule that produced it.

## Data Ownership

All user-owned database tables should include `user_id` and enforce access with Supabase RLS. Client code should not rely on filtering alone for security.

Server-side code may be used for operations that need stronger validation or future service-role access, but the MVP should keep most data access simple and transparent.

## Mobile Usability Principles

The workout screen should prioritize:

- large tap targets
- minimal typing
- fast duplicate-last-set behavior
- previous session visible in context
- clear saved/unsaved state
- easy correction of mistaken entries
- dark mode
- protection against accidental active-workout loss

The interface should not become a desktop admin dashboard squeezed onto a phone.
