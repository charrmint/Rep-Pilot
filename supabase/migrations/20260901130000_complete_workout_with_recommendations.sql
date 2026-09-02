alter type public.progression_reason
  add value if not exists 'capacity_supports_increase' after 'top_of_rep_range';

alter type public.progression_reason
  add value if not exists 'increment_exceeds_capacity' after 'capacity_supports_increase';

alter table public.progression_recommendations
  alter column recommended_weight_lbs drop not null,
  add column recommended_min_reps integer,
  add column recommended_max_reps integer,
  add column recommended_rir integer;

update public.progression_recommendations as recommendation
set
  recommended_min_reps = session_exercise.min_reps,
  recommended_max_reps = session_exercise.max_reps,
  recommended_rir = 2
from public.workout_session_exercises as session_exercise
where session_exercise.id = recommendation.workout_session_exercise_id
  and recommendation.action <> 'review';

update public.progression_recommendations
set
  recommended_weight_lbs = null,
  recommended_min_reps = null,
  recommended_max_reps = null,
  recommended_rir = null
where action = 'review';

alter table public.progression_recommendations
  add constraint progression_recommendations_rep_range_valid check (
    (recommended_min_reps is null and recommended_max_reps is null)
    or (
      recommended_min_reps > 0
      and recommended_max_reps >= recommended_min_reps
    )
  ),
  add constraint progression_recommendations_rir_valid check (
    recommended_rir is null or recommended_rir between 0 and 10
  ),
  add constraint progression_recommendations_prescription_complete check (
    (
      action = 'review'
      and recommended_weight_lbs is null
      and recommended_min_reps is null
      and recommended_max_reps is null
      and recommended_rir is null
    )
    or (
      action <> 'review'
      and recommended_weight_lbs is not null
      and recommended_min_reps is not null
      and recommended_max_reps is not null
      and recommended_rir is not null
    )
  );

create function public.complete_workout_with_recommendations(
  p_session_id uuid,
  p_completed_at timestamp with time zone,
  p_recommendations jsonb default '[]'::jsonb
)
returns void
language plpgsql
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_status public.workout_session_status;
  session_started_at timestamp with time zone;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  select status, started_at
  into current_status, session_started_at
  from public.workout_sessions
  where id = p_session_id
    and user_id = current_user_id
  for update;

  if not found then
    raise exception 'Workout session not found.' using errcode = 'P0002';
  end if;

  if current_status = 'completed' then
    return;
  end if;

  if current_status <> 'in_progress' then
    raise exception 'This workout is no longer active.' using errcode = '23514';
  end if;

  if p_completed_at is null or p_completed_at < session_started_at then
    raise exception 'Workout completion time is invalid.' using errcode = '23514';
  end if;

  if not exists (
    select 1
    from public.workout_sets
    join public.workout_session_exercises
      on workout_session_exercises.id = workout_sets.workout_session_exercise_id
    where workout_session_exercises.workout_session_id = p_session_id
      and workout_sets.user_id = current_user_id
  ) then
    raise exception 'Log at least one set before finishing the workout.'
      using errcode = '23514';
  end if;

  if jsonb_typeof(coalesce(p_recommendations, '[]'::jsonb)) <> 'array' then
    raise exception 'Recommendations must be a JSON array.'
      using errcode = '22023';
  end if;

  if jsonb_array_length(coalesce(p_recommendations, '[]'::jsonb)) <> (
    select count(distinct workout_session_exercises.id)
    from public.workout_session_exercises
    join public.workout_sets
      on workout_sets.workout_session_exercise_id = workout_session_exercises.id
    where workout_session_exercises.workout_session_id = p_session_id
      and workout_session_exercises.user_id = current_user_id
      and workout_sets.kind = 'working'
  ) then
    raise exception 'Each performed exercise requires one recommendation.'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_recommendations, '[]'::jsonb))
      as recommendation
    where not exists (
      select 1
      from public.workout_session_exercises
      where id = (recommendation ->> 'workout_session_exercise_id')::uuid
        and workout_session_id = p_session_id
        and user_id = current_user_id
    )
  ) then
    raise exception 'Recommendation source does not belong to this workout.'
      using errcode = '23503';
  end if;

  if exists (
    select 1
    from public.workout_session_exercises
    where workout_session_id = p_session_id
      and user_id = current_user_id
      and exists (
        select 1
        from public.workout_sets
        where workout_session_exercise_id = workout_session_exercises.id
          and kind = 'working'
      )
      and not exists (
        select 1
        from jsonb_array_elements(coalesce(p_recommendations, '[]'::jsonb))
          as recommendation
        where recommendation ->> 'workout_session_exercise_id' =
          workout_session_exercises.id::text
      )
  ) then
    raise exception 'Each performed exercise requires one recommendation.'
      using errcode = '23514';
  end if;

  insert into public.progression_recommendations (
    user_id,
    workout_session_exercise_id,
    action,
    reason,
    recommended_weight_lbs,
    recommended_min_reps,
    recommended_max_reps,
    recommended_rir,
    explanation,
    engine_version,
    input_snapshot
  )
  select
    current_user_id,
    recommendation.workout_session_exercise_id,
    recommendation.action::public.progression_action,
    recommendation.reason::public.progression_reason,
    recommendation.recommended_weight_lbs,
    recommendation.recommended_min_reps,
    recommendation.recommended_max_reps,
    recommendation.recommended_rir,
    recommendation.explanation,
    recommendation.engine_version,
    recommendation.input_snapshot
  from jsonb_to_recordset(coalesce(p_recommendations, '[]'::jsonb))
    as recommendation(
      workout_session_exercise_id uuid,
      action text,
      reason text,
      recommended_weight_lbs numeric(8, 2),
      recommended_min_reps integer,
      recommended_max_reps integer,
      recommended_rir integer,
      explanation text,
      engine_version text,
      input_snapshot jsonb
    )
  on conflict (workout_session_exercise_id) do nothing;

  update public.workout_sessions
  set
    status = 'completed',
    completed_at = p_completed_at
  where id = p_session_id
    and user_id = current_user_id;
end;
$$;

revoke all on function public.complete_workout_with_recommendations(
  uuid,
  timestamp with time zone,
  jsonb
) from public;

grant execute on function public.complete_workout_with_recommendations(
  uuid,
  timestamp with time zone,
  jsonb
) to authenticated;
