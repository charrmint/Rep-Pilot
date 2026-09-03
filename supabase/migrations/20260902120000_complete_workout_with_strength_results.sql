create unique index if not exists strength_records_session_exercise_record_type_unique_idx
  on public.strength_records (workout_session_exercise_id, record_type);

alter table public.strength_records
  drop constraint if exists strength_records_record_type_value_unit_valid;

alter table public.strength_records
  add constraint strength_records_record_type_value_unit_valid check (
    (
      record_type in (
        'highest_weight',
        'highest_estimated_one_rep_max'
      )
      and value_unit = 'lb'
    )
    or (
      record_type = 'highest_volume'
      and value_unit = 'lb_reps'
    )
  );

create or replace function public.validate_strength_record_previous_record()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_exercise_id uuid;
  previous_record record;
begin
  select session_exercise.exercise_id
  into current_exercise_id
  from public.workout_session_exercises as session_exercise
  where session_exercise.id = new.workout_session_exercise_id
    and session_exercise.user_id = new.user_id;

  if not found then
    raise exception 'Strength record source does not belong to this user.'
      using errcode = '23503';
  end if;

  if new.previous_record_id is null then
    if exists (
      select 1
      from public.strength_records as existing_record
      join public.workout_session_exercises as existing_source
        on existing_source.id = existing_record.workout_session_exercise_id
      where existing_record.user_id = new.user_id
        and existing_source.exercise_id = current_exercise_id
        and existing_record.record_type = new.record_type
        and existing_record.id <> new.id
    ) then
      raise exception 'An existing strength record requires a previous record link.'
        using errcode = '23514';
    end if;

    return new;
  end if;

  select
    strength_record.user_id,
    strength_record.record_type,
    strength_record.value,
    strength_record.value_unit,
    strength_record.performed_at,
    session_exercise.exercise_id
  into previous_record
  from public.strength_records as strength_record
  join public.workout_session_exercises as session_exercise
    on session_exercise.id = strength_record.workout_session_exercise_id
  where strength_record.id = new.previous_record_id;

  if not found then
    raise exception 'Previous strength record not found.'
      using errcode = '23503';
  end if;

  if previous_record.user_id <> new.user_id then
    raise exception 'Previous strength record belongs to another user.'
      using errcode = '23503';
  end if;

  if previous_record.exercise_id <> current_exercise_id then
    raise exception 'Previous strength record must be for the same exercise.'
      using errcode = '23514';
  end if;

  if previous_record.record_type <> new.record_type then
    raise exception 'Previous strength record must have the same record type.'
      using errcode = '23514';
  end if;

  if previous_record.value_unit <> new.value_unit then
    raise exception 'Previous strength record must have the same value unit.'
      using errcode = '23514';
  end if;

  if previous_record.value >= new.value then
    raise exception 'Previous strength record value must be lower than the new value.'
      using errcode = '23514';
  end if;

  if previous_record.performed_at > new.performed_at then
    raise exception 'Previous strength record cannot occur after the new record.'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.strength_records as later_record
    join public.workout_session_exercises as later_source
      on later_source.id = later_record.workout_session_exercise_id
    where later_record.user_id = new.user_id
      and later_source.exercise_id = current_exercise_id
      and later_record.record_type = new.record_type
      and later_record.value > previous_record.value
      and later_record.id <> new.id
  ) then
    raise exception 'Previous strength record must reference the current record.'
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists validate_strength_record_previous_record on public.strength_records;

create trigger validate_strength_record_previous_record
  before insert or update of
    user_id,
    workout_session_exercise_id,
    record_type,
    value,
    value_unit,
    previous_record_id,
    performed_at
  on public.strength_records
  for each row execute function public.validate_strength_record_previous_record();

create or replace function public._insert_strength_record_baselines(p_user_id uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  with valid_working_sets as (
    select
      workout_set.user_id,
      workout_set.workout_session_exercise_id,
      workout_set.reps,
      workout_set.normalized_weight_lbs,
      coalesce(workout_session.completed_at, workout_set.performed_at)
        as performed_at,
      session_exercise.exercise_id
    from public.workout_sets as workout_set
    join public.workout_session_exercises as session_exercise
      on session_exercise.id = workout_set.workout_session_exercise_id
      and session_exercise.user_id = workout_set.user_id
    join public.workout_sessions as workout_session
      on workout_session.id = session_exercise.workout_session_id
      and workout_session.user_id = workout_set.user_id
    where workout_set.user_id = p_user_id
      and workout_session.status = 'completed'
      and workout_set.kind = 'working'
      and workout_set.normalized_weight_lbs > 0
      and workout_set.reps > 0
  ),
  volume_candidates as (
    select
      valid_working_sets.user_id,
      valid_working_sets.exercise_id,
      valid_working_sets.workout_session_exercise_id,
      'highest_volume'::public.strength_record_type as record_type,
      round(
        sum(
          valid_working_sets.normalized_weight_lbs * valid_working_sets.reps
        ),
        2
      ) as value,
      'lb_reps'::public.strength_record_value_unit as value_unit,
      max(valid_working_sets.performed_at) as performed_at
    from valid_working_sets
    group by
      valid_working_sets.user_id,
      valid_working_sets.exercise_id,
      valid_working_sets.workout_session_exercise_id
  ),
  record_candidates as (
    select
      valid_working_sets.user_id,
      valid_working_sets.exercise_id,
      valid_working_sets.workout_session_exercise_id,
      'highest_weight'::public.strength_record_type as record_type,
      round(valid_working_sets.normalized_weight_lbs, 2) as value,
      'lb'::public.strength_record_value_unit as value_unit,
      valid_working_sets.performed_at
    from valid_working_sets

    union all

    select
      valid_working_sets.user_id,
      valid_working_sets.exercise_id,
      valid_working_sets.workout_session_exercise_id,
      'highest_estimated_one_rep_max'::public.strength_record_type as record_type,
      round(
        case
          when valid_working_sets.reps = 1 then
            valid_working_sets.normalized_weight_lbs
          else
            valid_working_sets.normalized_weight_lbs
              * (1 + valid_working_sets.reps::numeric / 30)
        end,
        2
      ) as value,
      'lb'::public.strength_record_value_unit as value_unit,
      valid_working_sets.performed_at
    from valid_working_sets
    where valid_working_sets.reps between 1 and 12

    union all

    select
      volume_candidates.user_id,
      volume_candidates.exercise_id,
      volume_candidates.workout_session_exercise_id,
      volume_candidates.record_type,
      volume_candidates.value,
      volume_candidates.value_unit,
      volume_candidates.performed_at
    from volume_candidates
  ),
  ranked_records as (
    select
      record_candidates.user_id,
      record_candidates.exercise_id,
      record_candidates.workout_session_exercise_id,
      record_candidates.record_type,
      record_candidates.value,
      record_candidates.value_unit,
      record_candidates.performed_at,
      row_number() over (
        partition by
          record_candidates.user_id,
          record_candidates.exercise_id,
          record_candidates.record_type
        order by
          record_candidates.value desc,
          record_candidates.performed_at asc,
          record_candidates.workout_session_exercise_id asc
      ) as record_rank
    from record_candidates
  )
  insert into public.strength_records (
    user_id,
    workout_session_exercise_id,
    record_type,
    value,
    value_unit,
    previous_record_id,
    performed_at
  )
  select
    ranked_records.user_id,
    ranked_records.workout_session_exercise_id,
    ranked_records.record_type,
    ranked_records.value,
    ranked_records.value_unit,
    null,
    ranked_records.performed_at
  from ranked_records
  where ranked_records.record_rank = 1
    and not exists (
      select 1
      from public.strength_records as existing_record
      join public.workout_session_exercises as existing_source
        on existing_source.id = existing_record.workout_session_exercise_id
      where existing_record.user_id = ranked_records.user_id
        and existing_record.record_type = ranked_records.record_type
        and existing_source.exercise_id = ranked_records.exercise_id
    )
  on conflict (workout_session_exercise_id, record_type) do nothing;
$$;

do $$
declare
  completed_user record;
begin
  for completed_user in
    select distinct workout_session.user_id
    from public.workout_sessions as workout_session
    where workout_session.status = 'completed'
  loop
    perform public._insert_strength_record_baselines(completed_user.user_id);
  end loop;
end;
$$;

create or replace function public.complete_workout_with_results(
  p_session_id uuid,
  p_completed_at timestamp with time zone,
  p_recommendations jsonb default '[]'::jsonb,
  p_strength_records jsonb default '[]'::jsonb
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
      and workout_sets.kind = 'working'
      and workout_sets.normalized_weight_lbs > 0
      and workout_sets.reps > 0
  ) then
    raise exception 'Log at least one valid working set before finishing the workout.'
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
      and workout_sets.normalized_weight_lbs > 0
      and workout_sets.reps > 0
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
          and normalized_weight_lbs > 0
          and reps > 0
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

  if jsonb_typeof(coalesce(p_strength_records, '[]'::jsonb)) <> 'array' then
    raise exception 'Strength records must be a JSON array.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_strength_records, '[]'::jsonb))
      as strength_record
    where jsonb_typeof(strength_record) <> 'object'
      or strength_record ->> 'workout_session_exercise_id' is null
      or strength_record ->> 'record_type' is null
      or strength_record ->> 'value_unit' is null
      or strength_record ->> 'performed_at' is null
      or strength_record -> 'value' is null
      or jsonb_typeof(strength_record -> 'value') <> 'number'
  ) then
    raise exception 'Strength record payload is invalid.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_strength_records, '[]'::jsonb))
      as strength_record
    where (strength_record ->> 'workout_session_exercise_id')
        !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      or (
        strength_record ->> 'previous_record_id' is not null
        and (strength_record ->> 'previous_record_id')
          !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      )
  ) then
    raise exception 'Strength record UUID is invalid.'
      using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_strength_records, '[]'::jsonb))
      as strength_record
    where strength_record ->> 'record_type' not in (
        'highest_weight',
        'highest_estimated_one_rep_max',
        'highest_volume'
      )
      or strength_record ->> 'value_unit' not in ('lb', 'lb_reps')
      or (strength_record ->> 'value')::numeric <= 0
  ) then
    raise exception 'Strength record value is invalid.'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_strength_records, '[]'::jsonb))
      as strength_record
    where not (
      (
        strength_record ->> 'record_type' in (
          'highest_weight',
          'highest_estimated_one_rep_max'
        )
        and strength_record ->> 'value_unit' = 'lb'
      )
      or (
        strength_record ->> 'record_type' = 'highest_volume'
        and strength_record ->> 'value_unit' = 'lb_reps'
      )
    )
  ) then
    raise exception 'Strength record unit does not match record type.'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from (
      select
        strength_record ->> 'workout_session_exercise_id'
          as workout_session_exercise_id,
        strength_record ->> 'record_type' as record_type
      from jsonb_array_elements(coalesce(p_strength_records, '[]'::jsonb))
        as strength_record
      group by
        strength_record ->> 'workout_session_exercise_id',
        strength_record ->> 'record_type'
      having count(*) > 1
    ) as duplicate_strength_record
  ) then
    raise exception 'Strength records contain a duplicate source and type.'
      using errcode = '23505';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_strength_records, '[]'::jsonb))
      as strength_record
    where not exists (
      select 1
      from public.workout_session_exercises as session_exercise
      where session_exercise.id =
          (strength_record ->> 'workout_session_exercise_id')::uuid
        and session_exercise.workout_session_id = p_session_id
        and session_exercise.user_id = current_user_id
        and exists (
          select 1
          from public.workout_sets as workout_set
          where workout_set.workout_session_exercise_id = session_exercise.id
            and workout_set.user_id = current_user_id
            and workout_set.kind = 'working'
            and workout_set.normalized_weight_lbs > 0
            and workout_set.reps > 0
        )
    )
  ) then
    raise exception 'Strength record source does not belong to a performed exercise.'
      using errcode = '23503';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_strength_records, '[]'::jsonb))
      as strength_record
    where (strength_record ->> 'performed_at')::timestamp with time zone
      <> p_completed_at
  ) then
    raise exception 'Strength record time must match workout completion time.'
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

  insert into public.strength_records (
    user_id,
    workout_session_exercise_id,
    record_type,
    value,
    value_unit,
    previous_record_id,
    performed_at
  )
  select
    current_user_id,
    strength_record.workout_session_exercise_id,
    strength_record.record_type::public.strength_record_type,
    strength_record.value,
    strength_record.value_unit::public.strength_record_value_unit,
    strength_record.previous_record_id,
    strength_record.performed_at
  from jsonb_to_recordset(coalesce(p_strength_records, '[]'::jsonb))
    as strength_record(
      workout_session_exercise_id uuid,
      record_type text,
      value numeric(12, 2),
      value_unit text,
      previous_record_id uuid,
      performed_at timestamp with time zone
    )
  on conflict (workout_session_exercise_id, record_type) do nothing;

  update public.workout_sessions
  set
    status = 'completed',
    completed_at = p_completed_at
  where id = p_session_id
    and user_id = current_user_id;
end;
$$;

create or replace function public.provision_demo_strength_record_baselines()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Demo strength record baselines are only available to anonymous users.'
      using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text, 0)
  );

  perform public._insert_strength_record_baselines(current_user_id);
end;
$$;

revoke all on function public.validate_strength_record_previous_record()
  from public;

revoke all on function public._insert_strength_record_baselines(uuid)
  from public;

revoke all on function public.complete_workout_with_results(
  uuid,
  timestamp with time zone,
  jsonb,
  jsonb
) from public;

grant execute on function public.complete_workout_with_results(
  uuid,
  timestamp with time zone,
  jsonb,
  jsonb
) to authenticated;

revoke all on function public.provision_demo_strength_record_baselines()
  from public;

grant execute on function public.provision_demo_strength_record_baselines()
  to authenticated;
