# Progression Engine

The progression engine is RepPilot's main differentiator. It should produce recommendations that are deterministic, conservative, explainable, and easy to test.

The MVP will implement double progression for weighted strength exercises.

## Inputs

A recommendation should be based on:

- exercise configuration
- target working sets
- target rep range
- actual working-set weights, normalized to pounds
- configured weight increment
- current session working sets
- recent session history for the same exercise
- optional per-set RIR, difficulty, pain, and notes

Warm-up, drop, and back-off sets may be stored, but V1 only evaluates the first
configured number of working sets. Extra working sets do not change the
recommendation. An exercise with no working sets does not receive a
recommendation. Mixed and ramping working weights are valid inputs and do not,
by themselves, require review.

## Recommendation Actions

The first version should return one of:

- `increase`
- `maintain`
- `reduce`
- `review`

Every recommendation must include a short explanation.

An actionable recommendation also contains a complete next-session
prescription:

- recommended normalized weight
- the existing configured working-set count
- recommended minimum and maximum reps
- a target of approximately two repetitions in reserve

## Double Progression V1

Given target sets `3`, rep range `8-10`, and increment `5 lb`:

1. If any working set records pain, return `review`.
2. Evaluate the first configured number of working sets in their logged order.
   Use the highest load that reached the minimum reps as the current candidate;
   if none did, use the highest performed load.
3. Convert each set's weight, reps, and optional RIR into an estimated capacity,
   then project that set at the current candidate and one configured increment
   above it. Missing RIR is treated conservatively and never invents unused
   reserve.
4. Consider the next increment sustainable only when both the average projected
   reps and the final set's projected reps remain at or above the minimum. The
   final-set check retains the workout's fatigue/order signal.
5. If every actual set reached the top of the range, effort was acceptable, and
   the next increment is sustainable, return `increase`. If the configured
   jump is too large, return `maintain` instead.
6. Recorded RIR can support an increase before every set reaches the top when
   the same candidate test remains sustainable.
7. Otherwise, classify the current candidate from all projected sets. Maintain
   for an in-range performance or a single miss.
8. If multiple sets remain below range and the two previous comparable sessions
   show the same pattern at the same candidate weight, return `reduce` by one
   configured increment. Otherwise, return `maintain`.

This is deliberately conservative. RepPilot should recommend progress, not pressure the user into unsafe jumps.

## Presentation

The pure engine returns a recommendation action, optional normalized weight,
recommended rep range, target RIR, machine-readable reason, and reason-only
explanation. The UI converts the weight into the session's display unit and
composes the action heading. This keeps unit conversion and presentation text
out of the progression rules.

V1 uses a transparent RIR-adjusted Epley calculation for every evaluated set.
It inverts each estimate at a candidate weight and, when RIR is available,
subtracts the target RIR. Candidate selection uses the average of those
normalized rep projections plus the final set as a fatigue guard; it does not
average raw weights or select a weight by frequency. The recommended rep range
is centered on average projected reps with a one-rep margin and clamped to the
configured range. If no RIR was recorded, an increase falls back to the lower
half of the configured range. The result is a target range, not a promise of
exact repetition capacity; repetitions at a given relative load vary by person
and exercise.

## Example User-Facing Results

Increase:

```text
Increase to 40 lb next session. Perform 3 working sets of 8-9 reps at approximately 2 RIR. You completed all 3 working sets at the top of your 8-10 rep range.
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
- mixed and ramping working weights
- an increment projected below the minimum rep target
- RIR-supported progression before all sets reach the top
- repeated decline across recent sessions

The engine should not depend on React, Supabase, dates from the runtime clock, or browser APIs.
