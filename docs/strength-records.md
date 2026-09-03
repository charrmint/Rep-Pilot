# Strength Records

RepPilot tracks strength records as explicit workout results. Records are
persisted facts tied to a completed `workout_session_exercise`, not rolling
snapshots hidden inside exercise or template rows.

## Record Definitions

The MVP records three values per exercise:

- `highest_weight`: the highest valid working-set load.
- `highest_estimated_one_rep_max`: the highest Epley estimated one-rep max from
  a valid working set.
- `highest_volume`: the total volume across valid working sets.

Only working sets are eligible. Warm-up, backoff, and drop sets are ignored for
record detection. A working set must have finite positive normalized weight and
a positive integer rep count. Sets that do not satisfy those conditions are not
included in weight, volume, or one-rep-max calculations.

RIR remains part of progression guidance, but it does not change an observed
record value: records describe the weight and reps that were actually logged.

## Estimated One-Rep Max

Estimated one-rep max uses the Epley formula for sets of 1 to 12 reps:

```text
weight * (1 + reps / 30)
```

A one-rep set is exact: its estimated one-rep max is the performed weight.
Sets above 12 reps are excluded from estimated-one-rep-max records, even though
they can still contribute to heaviest-weight and volume records when otherwise
valid.

## Units And Comparison

Record values are stored in canonical units:

- `lb` for `highest_weight` and `highest_estimated_one_rep_max`.
- `lb_reps` for `highest_volume`.

The UI converts record display into the completed session exercise's planned
weight unit. For volume, only the weight component is converted, so a kilogram
display is labeled `kg·reps`. Stored values are never mutated for display.

Record comparisons round candidate values to two decimal places. A candidate
must be greater than the previous rounded record value to create a new record;
ties at the rounded value do not create duplicate records.

## Previous Records

Every persisted record can link to the previous record it surpassed through
`previous_record_id`. A missing previous record means the workout established a
baseline. It should be presented as "Baseline established", not as an invented
improvement.

The previous-record relationship is intentionally explicit so record events can
be audited and explained later without reconstructing history from convenience
snapshots.

## Completion And Backfill

Workout completion is atomic: the completion operation persists progression
recommendations, inserts any strength records, and marks the workout completed
in one transaction. If record input is invalid, the workout should not be
silently marked complete with partial result data.

Historical workouts can be backfilled with baseline records. Backfill creates
the best existing record per exercise and type without linking an earlier
record. Demo setup runs the main demo seed first, then provisions demo strength
record baselines for the same signed-in anonymous user. If either step fails,
the demo is not ready.
