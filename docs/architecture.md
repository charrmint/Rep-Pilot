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
- `src/features`: product feature modules such as workouts, exercises, progression, records, and analytics.
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

Expected modules:

- `src/features/exercises`: exercise library behavior.
- `src/features/templates`: workout template behavior.
- `src/features/workouts`: active workout and workout history behavior.
- `src/features/progression`: recommendation engine and related types.
- `src/features/records`: personal-record detection.
- `src/features/analytics`: progress summaries and chart-ready data.

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

### Local Client State

Local browser state should be used for short-lived workout resilience, not as the source of truth for completed history.

The first version should use local storage or a similarly simple mechanism to protect an active workout from refreshes and poor gym Wi-Fi. Completed workouts should be saved to Supabase.

### Tests

Tests should match the architecture:

- domain tests for progression, metrics, units, and personal records
- component tests for important UI states
- later integration or E2E tests for the full workout flow

The progression engine should have the densest test coverage because it is the core differentiator.

## Data Flow

The intended workout flow is:

1. A route in `src/app` renders the active workout screen.
2. Workout feature code loads the template, current session, and previous exercise history.
3. The user logs sets through mobile-first UI components.
4. Workout data access code saves set data to Supabase and keeps active workout state recoverable locally.
5. The progression feature receives the current sets and relevant recent history.
6. The progression engine returns a recommendation.
7. The app displays the explanation and persists the recommendation with enough input context to audit it later.

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
