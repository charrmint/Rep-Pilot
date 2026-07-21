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

RepPilot should keep domain logic separate from framework code:

- `src/app`: routes and page composition.
- `src/features`: product feature modules such as workouts, exercises, progression, and analytics.
- `src/lib`: shared infrastructure such as Supabase clients, unit conversion, and metrics.
- `docs`: architecture notes, progression rules, and ADRs.

The progression engine should be implemented as a pure TypeScript module. It should accept explicit inputs and return structured recommendations with human-readable explanations. This makes it testable before the UI depends on it.

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
