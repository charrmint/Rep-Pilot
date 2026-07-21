# Progression Engine

The progression engine is RepPilot's main differentiator. It should produce recommendations that are deterministic, conservative, explainable, and easy to test.

The MVP will implement double progression for weighted strength exercises.

## Inputs

A recommendation should be based on:

- exercise configuration
- target working sets
- target rep range
- current working weight
- configured weight increment
- current session working sets
- recent session history for the same exercise
- optional RIR, difficulty, pain, and notes

Warm-up, drop, and back-off sets may be stored, but the initial recommendation should only evaluate working sets unless explicitly configured otherwise.

## Recommendation Actions

The first version should return one of:

- `increase`
- `maintain`
- `reduce`
- `review`

Every recommendation must include a short explanation.

## Double Progression V1

Given target sets `3`, rep range `8-10`, and increment `5 lb`:

1. If any working set records pain, return `review`.
2. If fewer than the target working sets were completed, return `maintain`.
3. If every working set reaches the top of the rep range and difficulty signals are acceptable, return `increase`.
4. If every working set reaches at least the bottom of the rep range, return `maintain`.
5. If exactly one working set falls below the bottom of the range, return `maintain`.
6. If multiple working sets fall below the range and recent history shows repeated decline, return `reduce`.
7. Otherwise, return `maintain`.

This is deliberately conservative. RepPilot should recommend progress, not pressure the user into unsafe jumps.

## Example Explanations

Increase:

```text
Increase to 40 lb next session. You completed all 3 working sets at the top of your 8-10 rep range.
```

Maintain:

```text
Stay at 35 lb. You completed 10, 8, and 7 reps. Complete at least 8 reps in every working set before increasing.
```

Reduce:

```text
Consider reducing to 30 lb. Performance has declined across recent sessions.
```

Review:

```text
Review this exercise before progressing. You recorded pain during the session.
```

## Testing Expectations

The progression engine should be covered with table-driven tests.

Test cases should include:

- all sets at the top of the range
- all sets inside the range
- one missed set
- multiple missed sets
- fewer than target sets completed
- high difficulty or zero RIR
- pain recorded
- repeated decline across recent sessions

The engine should not depend on React, Supabase, dates from the runtime clock, or browser APIs.
