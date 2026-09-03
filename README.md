# RepPilot

**Deployed:** [rep-pilot.vercel.app](https://rep-pilot.vercel.app/)

RepPilot is a mobile-first strength-training log built around reusable workout templates, set-level performance data, and deterministic double-progression prescriptions.

## Stack

- Next.js 16 / React 19 / TypeScript
- Supabase Auth, Postgres, Row Level Security, and RPC functions
- Tailwind CSS 4
- Vitest and Testing Library

## Architecture

The App Router is kept thin. Pages render feature components and invoke server actions; business rules, data access, mapping, and validation stay in `src/features/<feature>`.

```text
src/app                  Next.js routes, server actions, page composition
src/features/auth        Session and anonymous-demo authentication
src/features/exercises   Exercise library and archive operations
src/features/templates   Template configuration and validation
src/features/workouts    Workout lifecycle, set logging, and history
src/features/progression Pure recommendation engine and persistence mapping
src/features/records     Strength-record detection
src/lib                  Supabase clients, units, and metric helpers
supabase/migrations      Schema, RLS, constraints, and transactional RPCs
```

```text
Template + exercise configuration
            |
            | start_workout_from_template()
            v
Workout session + immutable exercise configuration snapshot
            |
            | set logging (weight, reps, RIR, pain)
            v
Progression evaluation + completion transaction
            |
            v
Persisted prescription and historical workout data
```

Workout sessions snapshot template exercise configuration at start time. Later template edits therefore do not rewrite historical plans or completed performance. Completion writes the session state and its per-exercise recommendations through one database RPC.

## Data model and access control

Postgres stores templates, session snapshots, sets, recommendations, and strength records. Template and session child tables carry `user_id` and use composite foreign keys where ownership needs to be enforced across a relationship. Constraints cover rep ranges, positions, weight values, session transitions, and a single active session per user.

All application tables use Row Level Security. Records are scoped to the authenticated user; the exercise library additionally supports system exercises (`user_id IS NULL`) alongside user-owned entries. Database RPCs validate the authenticated caller before creating sessions or completing workouts.

## Progression

`src/features/progression/double-progression.ts` is a pure, tested rules engine. It evaluates working sets against the configured target-set count, rep range, increment, RIR, pain signals, and recent exercise sessions. Its result is one of `increase`, `maintain`, `reduce`, or `review`, with an explicit reason and recommended load/rep prescription.

Weights are normalized to pounds for comparison and storage of prescriptions while preserving the entered unit for display. Strength records are derived from completed set data: highest weight, highest estimated 1RM (Epley), and highest volume.

## Local development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set the following in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<supabase-publishable-key>
```

Apply the migrations in `supabase/migrations` to the target Supabase project. The checked-in Supabase configuration supports local development. Enable Anonymous Sign-Ins in the hosted project's Supabase Auth settings to use demo mode.

## Verification

```bash
npm run lint
npm test
npm run build
```
