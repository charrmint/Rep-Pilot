create function public.start_workout_from_template(
  p_template_id uuid,
  p_active_session_id_to_cancel uuid default null
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  inserted_exercise_count integer;
  new_session_id uuid;
begin
  if current_user_id is null then
    raise exception 'Authentication is required.' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.workout_templates
    where id = p_template_id
      and user_id = current_user_id
      and is_archived = false
  ) then
    raise exception 'Workout template not found.' using errcode = 'P0002';
  end if;

  if not exists (
    select 1
    from public.workout_template_exercises
    where template_id = p_template_id
      and user_id = current_user_id
  ) then
    raise exception 'Add at least one exercise before starting this workout.'
      using errcode = '23514';
  end if;

  if p_active_session_id_to_cancel is not null then
    update public.workout_sessions
    set status = 'cancelled'
    where id = p_active_session_id_to_cancel
      and user_id = current_user_id
      and status = 'in_progress';

    if not found then
      raise exception 'Active workout not found.' using errcode = 'P0002';
    end if;
  end if;

  insert into public.workout_sessions (user_id, template_id)
  values (current_user_id, p_template_id)
  returning id into new_session_id;

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
    weight_increment_lbs
  )
  select
    current_user_id,
    new_session_id,
    template_exercise.exercise_id,
    exercise.name,
    template_exercise.position,
    template_exercise.target_sets,
    template_exercise.min_reps,
    template_exercise.max_reps,
    template_exercise.default_weight_value,
    template_exercise.default_weight_unit,
    template_exercise.default_normalized_weight_lbs,
    template_exercise.weight_increment_lbs
  from public.workout_template_exercises as template_exercise
  join public.exercises as exercise
    on exercise.id = template_exercise.exercise_id
  where template_exercise.template_id = p_template_id
    and template_exercise.user_id = current_user_id
  order by template_exercise.position;

  get diagnostics inserted_exercise_count = row_count;

  if inserted_exercise_count = 0 then
    raise exception 'Add at least one exercise before starting this workout.'
      using errcode = '23514';
  end if;

  return new_session_id;
end;
$$;

grant execute on function public.start_workout_from_template(uuid, uuid)
  to authenticated;
