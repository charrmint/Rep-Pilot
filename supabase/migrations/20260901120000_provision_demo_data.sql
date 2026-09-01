create function public.provision_demo_data()
returns void
language plpgsql
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  squat_id uuid;
  bench_press_id uuid;
  bent_over_row_id uuid;
  incline_press_id uuid;
  lat_pulldown_id uuid;
  lateral_raise_id uuid;
  full_body_template_id uuid := extensions.gen_random_uuid();
  upper_body_template_id uuid := extensions.gen_random_uuid();
  full_body_session_one_id uuid := extensions.gen_random_uuid();
  full_body_session_two_id uuid := extensions.gen_random_uuid();
  full_body_session_three_id uuid := extensions.gen_random_uuid();
  upper_body_session_id uuid := extensions.gen_random_uuid();
begin
  if current_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false) then
    raise exception 'Demo data is only available to anonymous users.'
      using errcode = '42501';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(current_user_id::text, 0)
  );

  if exists (
    select 1
    from public.workout_templates
    where user_id = current_user_id
  ) then
    return;
  end if;

  select id into squat_id
  from public.exercises
  where user_id is null and name = 'Back Squat'
  limit 1;

  select id into bench_press_id
  from public.exercises
  where user_id is null and name = 'Bench Press'
  limit 1;

  select id into bent_over_row_id
  from public.exercises
  where user_id is null and name = 'Bent-Over Row'
  limit 1;

  select id into incline_press_id
  from public.exercises
  where user_id is null and name = 'Incline Dumbbell Press'
  limit 1;

  select id into lat_pulldown_id
  from public.exercises
  where user_id is null and name = 'Lat Pulldown'
  limit 1;

  select id into lateral_raise_id
  from public.exercises
  where user_id is null and name = 'Lateral Raise'
  limit 1;

  if squat_id is null
    or bench_press_id is null
    or bent_over_row_id is null
    or incline_press_id is null
    or lat_pulldown_id is null
    or lateral_raise_id is null
  then
    raise exception 'Required system exercises are missing.'
      using errcode = 'P0002';
  end if;

  insert into public.workout_templates (id, user_id, name)
  values
    (full_body_template_id, current_user_id, 'Full Body A'),
    (upper_body_template_id, current_user_id, 'Upper Body B');

  insert into public.workout_template_exercises (
    user_id,
    template_id,
    exercise_id,
    position,
    target_sets,
    min_reps,
    max_reps,
    default_weight_value,
    default_weight_unit,
    default_normalized_weight_lbs,
    weight_increment_lbs
  )
  values
    (current_user_id, full_body_template_id, squat_id, 1, 3, 8, 10, 185, 'lb', 185, 5),
    (current_user_id, full_body_template_id, bench_press_id, 2, 3, 8, 10, 135, 'lb', 135, 5),
    (current_user_id, full_body_template_id, bent_over_row_id, 3, 3, 8, 12, 95, 'lb', 95, 5),
    (current_user_id, upper_body_template_id, incline_press_id, 1, 3, 8, 12, 50, 'lb', 50, 5),
    (current_user_id, upper_body_template_id, lat_pulldown_id, 2, 3, 8, 12, 100, 'lb', 100, 5),
    (current_user_id, upper_body_template_id, lateral_raise_id, 3, 3, 10, 15, 15, 'lb', 15, 2.5);

  insert into public.workout_sessions (
    id,
    user_id,
    template_id,
    status,
    started_at,
    completed_at,
    notes,
    created_at,
    updated_at
  )
  values
    (
      full_body_session_one_id,
      current_user_id,
      full_body_template_id,
      'completed',
      current_timestamp - interval '21 days',
      current_timestamp - interval '21 days' + interval '58 minutes',
      'Steady first week back.',
      current_timestamp - interval '21 days',
      current_timestamp - interval '21 days' + interval '58 minutes'
    ),
    (
      full_body_session_two_id,
      current_user_id,
      full_body_template_id,
      'completed',
      current_timestamp - interval '14 days',
      current_timestamp - interval '14 days' + interval '61 minutes',
      'Added weight while keeping reps controlled.',
      current_timestamp - interval '14 days',
      current_timestamp - interval '14 days' + interval '61 minutes'
    ),
    (
      full_body_session_three_id,
      current_user_id,
      full_body_template_id,
      'completed',
      current_timestamp - interval '7 days',
      current_timestamp - interval '7 days' + interval '64 minutes',
      'Strong session across all three lifts.',
      current_timestamp - interval '7 days',
      current_timestamp - interval '7 days' + interval '64 minutes'
    ),
    (
      upper_body_session_id,
      current_user_id,
      upper_body_template_id,
      'completed',
      current_timestamp - interval '4 days',
      current_timestamp - interval '4 days' + interval '47 minutes',
      'Good upper-body volume.',
      current_timestamp - interval '4 days',
      current_timestamp - interval '4 days' + interval '47 minutes'
    );

  insert into public.workout_session_exercises (
    user_id,
    workout_session_id,
    exercise_id,
    exercise_name_snapshot,
    position,
    target_sets,
    min_reps,
    max_reps,
    planned_weight_value,
    planned_weight_unit,
    planned_normalized_weight_lbs,
    weight_increment_lbs,
    created_at,
    updated_at
  )
  select
    current_user_id,
    demo_session.session_id,
    template_exercise.exercise_id,
    exercise.name,
    template_exercise.position,
    template_exercise.target_sets,
    template_exercise.min_reps,
    template_exercise.max_reps,
    template_exercise.default_weight_value,
    template_exercise.default_weight_unit,
    template_exercise.default_normalized_weight_lbs,
    template_exercise.weight_increment_lbs,
    workout_session.started_at,
    workout_session.completed_at
  from (
    values
      (full_body_session_one_id, full_body_template_id),
      (full_body_session_two_id, full_body_template_id),
      (full_body_session_three_id, full_body_template_id),
      (upper_body_session_id, upper_body_template_id)
  ) as demo_session(session_id, template_id)
  join public.workout_sessions as workout_session
    on workout_session.id = demo_session.session_id
  join public.workout_template_exercises as template_exercise
    on template_exercise.template_id = demo_session.template_id
  join public.exercises as exercise
    on exercise.id = template_exercise.exercise_id;

  insert into public.workout_sets (
    user_id,
    workout_session_exercise_id,
    position,
    kind,
    reps,
    weight_value,
    weight_unit,
    normalized_weight_lbs,
    performed_at,
    created_at,
    updated_at
  )
  select
    current_user_id,
    session_exercise.id,
    demo_set.position,
    'working',
    demo_set.reps,
    demo_set.weight_value,
    'lb',
    demo_set.weight_value,
    workout_session.started_at
      + (session_exercise.position * interval '15 minutes')
      + (demo_set.position * interval '3 minutes'),
    workout_session.started_at
      + (session_exercise.position * interval '15 minutes')
      + (demo_set.position * interval '3 minutes'),
    workout_session.started_at
      + (session_exercise.position * interval '15 minutes')
      + (demo_set.position * interval '3 minutes')
  from (
    values
      (full_body_session_one_id, squat_id, 1, 9, 175::numeric),
      (full_body_session_one_id, squat_id, 2, 9, 175::numeric),
      (full_body_session_one_id, squat_id, 3, 8, 175::numeric),
      (full_body_session_one_id, bench_press_id, 1, 10, 125::numeric),
      (full_body_session_one_id, bench_press_id, 2, 9, 125::numeric),
      (full_body_session_one_id, bench_press_id, 3, 8, 125::numeric),
      (full_body_session_one_id, bent_over_row_id, 1, 12, 85::numeric),
      (full_body_session_one_id, bent_over_row_id, 2, 11, 85::numeric),
      (full_body_session_one_id, bent_over_row_id, 3, 10, 85::numeric),
      (full_body_session_two_id, squat_id, 1, 10, 180::numeric),
      (full_body_session_two_id, squat_id, 2, 9, 180::numeric),
      (full_body_session_two_id, squat_id, 3, 8, 180::numeric),
      (full_body_session_two_id, bench_press_id, 1, 10, 130::numeric),
      (full_body_session_two_id, bench_press_id, 2, 10, 130::numeric),
      (full_body_session_two_id, bench_press_id, 3, 9, 130::numeric),
      (full_body_session_two_id, bent_over_row_id, 1, 12, 90::numeric),
      (full_body_session_two_id, bent_over_row_id, 2, 12, 90::numeric),
      (full_body_session_two_id, bent_over_row_id, 3, 11, 90::numeric),
      (full_body_session_three_id, squat_id, 1, 10, 185::numeric),
      (full_body_session_three_id, squat_id, 2, 10, 185::numeric),
      (full_body_session_three_id, squat_id, 3, 10, 185::numeric),
      (full_body_session_three_id, bench_press_id, 1, 10, 135::numeric),
      (full_body_session_three_id, bench_press_id, 2, 10, 135::numeric),
      (full_body_session_three_id, bench_press_id, 3, 9, 135::numeric),
      (full_body_session_three_id, bent_over_row_id, 1, 12, 95::numeric),
      (full_body_session_three_id, bent_over_row_id, 2, 12, 95::numeric),
      (full_body_session_three_id, bent_over_row_id, 3, 12, 95::numeric),
      (upper_body_session_id, incline_press_id, 1, 12, 50::numeric),
      (upper_body_session_id, incline_press_id, 2, 11, 50::numeric),
      (upper_body_session_id, incline_press_id, 3, 10, 50::numeric),
      (upper_body_session_id, lat_pulldown_id, 1, 12, 100::numeric),
      (upper_body_session_id, lat_pulldown_id, 2, 11, 100::numeric),
      (upper_body_session_id, lat_pulldown_id, 3, 10, 100::numeric),
      (upper_body_session_id, lateral_raise_id, 1, 15, 15::numeric),
      (upper_body_session_id, lateral_raise_id, 2, 14, 15::numeric),
      (upper_body_session_id, lateral_raise_id, 3, 13, 15::numeric)
  ) as demo_set(session_id, exercise_id, position, reps, weight_value)
  join public.workout_session_exercises as session_exercise
    on session_exercise.workout_session_id = demo_set.session_id
    and session_exercise.exercise_id = demo_set.exercise_id
  join public.workout_sessions as workout_session
    on workout_session.id = demo_set.session_id;
end;
$$;

revoke all on function public.provision_demo_data() from public;
grant execute on function public.provision_demo_data() to authenticated;
