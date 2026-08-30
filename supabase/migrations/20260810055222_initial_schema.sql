create extension if not exists pgcrypto with schema extensions;

create type public.weight_unit as enum (
  'lb',
  'kg'
);

create type public.set_kind as enum (
  'warmup',
  'working',
  'backoff',
  'drop'
);

create type public.workout_session_status as enum (
  'in_progress',
  'completed',
  'cancelled'
);

create type public.progression_action as enum (
  'increase',
  'maintain',
  'reduce',
  'review'
);

create type public.progression_reason as enum (
  'pain_recorded',
  'incomplete_target_sets',
  'top_of_rep_range',
  'high_effort',
  'within_rep_range',
  'single_set_below_range',
  'repeated_underperformance',
  'default_maintain'
);

create type public.strength_record_type as enum (
  'highest_weight',
  'highest_estimated_one_rep_max',
  'highest_volume'
);

create type public.strength_record_value_unit as enum (
  'lb',
  'lb_reps'
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  preferred_weight_unit public.weight_unit not null default 'lb',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table public.exercises (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  is_archived boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint exercises_name_not_blank check (length(btrim(name)) > 0)
);

create table public.workout_templates (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  is_archived boolean not null default false,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint workout_templates_user_id_id_unique unique (user_id, id),
  constraint workout_templates_name_not_blank check (length(btrim(name)) > 0)
);

create table public.workout_template_exercises (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid not null references public.workout_templates(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  position integer not null,
  target_sets integer not null,
  min_reps integer not null,
  max_reps integer not null,
  default_weight_value numeric(8, 2) not null,
  default_weight_unit public.weight_unit not null,
  default_normalized_weight_lbs numeric(8, 2) not null,
  weight_increment_lbs numeric(8, 2) not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint workout_template_exercises_user_id_id_unique unique (user_id, id),
  constraint workout_template_exercises_user_template_fk
    foreign key (user_id, template_id)
    references public.workout_templates(user_id, id)
    on delete cascade,
  constraint workout_template_exercises_position_unique unique (template_id, position),
  constraint workout_template_exercises_position_positive check (position > 0),
  constraint workout_template_exercises_target_sets_positive check (target_sets > 0),
  constraint workout_template_exercises_min_reps_positive check (min_reps > 0),
  constraint workout_template_exercises_rep_range_valid check (max_reps >= min_reps),
  constraint workout_template_exercises_default_weight_non_negative check (default_weight_value >= 0),
  constraint workout_template_exercises_default_normalized_weight_non_negative check (default_normalized_weight_lbs >= 0),
  constraint workout_template_exercises_weight_increment_positive check (weight_increment_lbs > 0)
);

create table public.workout_sessions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template_id uuid references public.workout_templates(id) on delete set null,
  status public.workout_session_status not null default 'in_progress',
  started_at timestamp with time zone not null default now(),
  completed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint workout_sessions_user_id_id_unique unique (user_id, id),
  constraint workout_sessions_completed_status_check
    check (status <> 'completed' or completed_at is not null),
  constraint workout_sessions_completed_after_started_check
    check (completed_at is null or completed_at >= started_at)
);

create table public.workout_session_exercises (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_session_id uuid not null references public.workout_sessions(id) on delete cascade,
  exercise_id uuid not null references public.exercises(id),
  exercise_name_snapshot text not null,
  position integer not null,
  target_sets integer not null,
  min_reps integer not null,
  max_reps integer not null,
  planned_weight_value numeric(8, 2) not null,
  planned_weight_unit public.weight_unit not null,
  planned_normalized_weight_lbs numeric(8, 2) not null,
  weight_increment_lbs numeric(8, 2) not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint workout_session_exercises_user_id_id_unique unique (user_id, id),
  constraint workout_session_exercises_user_session_fk
    foreign key (user_id, workout_session_id)
    references public.workout_sessions(user_id, id)
    on delete cascade,
  constraint workout_session_exercises_position_unique unique (workout_session_id, position),
  constraint workout_session_exercises_name_not_blank check (length(btrim(exercise_name_snapshot)) > 0),
  constraint workout_session_exercises_position_positive check (position > 0),
  constraint workout_session_exercises_target_sets_positive check (target_sets > 0),
  constraint workout_session_exercises_min_reps_positive check (min_reps > 0),
  constraint workout_session_exercises_rep_range_valid check (max_reps >= min_reps),
  constraint workout_session_exercises_planned_weight_non_negative check (planned_weight_value >= 0),
  constraint workout_session_exercises_planned_normalized_weight_non_negative check (planned_normalized_weight_lbs >= 0),
  constraint workout_session_exercises_weight_increment_positive check (weight_increment_lbs > 0)
);

create table public.workout_sets (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_session_exercise_id uuid not null references public.workout_session_exercises(id) on delete cascade,
  position integer not null,
  kind public.set_kind not null default 'working',
  reps integer not null,
  weight_value numeric(8, 2) not null,
  weight_unit public.weight_unit not null,
  normalized_weight_lbs numeric(8, 2) not null,
  rir integer,
  difficulty integer,
  pain boolean not null default false,
  performed_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint workout_sets_user_session_exercise_fk
    foreign key (user_id, workout_session_exercise_id)
    references public.workout_session_exercises(user_id, id)
    on delete cascade,
  constraint workout_sets_position_unique unique (workout_session_exercise_id, position),
  constraint workout_sets_position_positive check (position > 0),
  constraint workout_sets_reps_non_negative check (reps >= 0),
  constraint workout_sets_weight_non_negative check (weight_value >= 0),
  constraint workout_sets_normalized_weight_non_negative check (normalized_weight_lbs >= 0),
  constraint workout_sets_rir_range check (rir is null or rir between 0 and 10),
  constraint workout_sets_difficulty_range check (difficulty is null or difficulty between 1 and 10)
);

create table public.progression_recommendations (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_session_exercise_id uuid not null references public.workout_session_exercises(id) on delete cascade,
  action public.progression_action not null,
  reason public.progression_reason not null,
  recommended_weight_lbs numeric(8, 2) not null,
  explanation text not null,
  engine_version text not null,
  input_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now(),
  constraint progression_recommendations_user_session_exercise_fk
    foreign key (user_id, workout_session_exercise_id)
    references public.workout_session_exercises(user_id, id)
    on delete cascade,
  constraint progression_recommendations_session_exercise_unique unique (workout_session_exercise_id),
  constraint progression_recommendations_recommended_weight_non_negative check (recommended_weight_lbs >= 0),
  constraint progression_recommendations_explanation_not_blank check (length(btrim(explanation)) > 0),
  constraint progression_recommendations_engine_version_not_blank check (length(btrim(engine_version)) > 0)
);

create table public.strength_records (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  workout_session_exercise_id uuid not null references public.workout_session_exercises(id) on delete cascade,
  record_type public.strength_record_type not null,
  value numeric(12, 2) not null,
  value_unit public.strength_record_value_unit not null,
  previous_record_id uuid,
  performed_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  constraint strength_records_user_id_id_unique unique (user_id, id),
  constraint strength_records_user_session_exercise_fk
    foreign key (user_id, workout_session_exercise_id)
    references public.workout_session_exercises(user_id, id)
    on delete cascade,
  constraint strength_records_previous_record_fk
    foreign key (user_id, previous_record_id)
    references public.strength_records(user_id, id),
  constraint strength_records_previous_record_not_self check (previous_record_id is null or previous_record_id <> id),
  constraint strength_records_value_non_negative check (value >= 0)
);

create unique index exercises_system_name_unique_idx
  on public.exercises (lower(btrim(name)))
  where user_id is null;

create unique index exercises_user_name_unique_idx
  on public.exercises (user_id, lower(btrim(name)))
  where user_id is not null;

create index exercises_user_id_idx on public.exercises (user_id);
create index workout_templates_user_id_idx on public.workout_templates (user_id);
create index workout_template_exercises_user_id_idx on public.workout_template_exercises (user_id);
create index workout_template_exercises_template_id_idx on public.workout_template_exercises (template_id);
create index workout_template_exercises_exercise_id_idx on public.workout_template_exercises (exercise_id);
create index workout_sessions_user_started_at_idx on public.workout_sessions (user_id, started_at desc);
create index workout_sessions_template_id_idx on public.workout_sessions (template_id);

create unique index workout_sessions_one_in_progress_per_user_idx
  on public.workout_sessions (user_id)
  where status = 'in_progress';

create index workout_session_exercises_workout_session_id_idx on public.workout_session_exercises (workout_session_id);
create index workout_session_exercises_exercise_id_idx on public.workout_session_exercises (exercise_id);
create index workout_sets_session_exercise_id_idx on public.workout_sets (workout_session_exercise_id);
create index workout_sets_user_performed_at_idx on public.workout_sets (user_id, performed_at desc);
create index progression_recommendations_user_id_idx on public.progression_recommendations (user_id);
create index strength_records_session_exercise_id_idx on public.strength_records (workout_session_exercise_id);
create index strength_records_user_record_type_performed_at_idx on public.strength_records (user_id, record_type, performed_at desc);

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger set_exercises_updated_at
  before update on public.exercises
  for each row execute function public.set_updated_at();

create trigger set_workout_templates_updated_at
  before update on public.workout_templates
  for each row execute function public.set_updated_at();

create trigger set_workout_template_exercises_updated_at
  before update on public.workout_template_exercises
  for each row execute function public.set_updated_at();

create trigger set_workout_sessions_updated_at
  before update on public.workout_sessions
  for each row execute function public.set_updated_at();

create trigger set_workout_session_exercises_updated_at
  before update on public.workout_session_exercises
  for each row execute function public.set_updated_at();

create trigger set_workout_sets_updated_at
  before update on public.workout_sets
  for each row execute function public.set_updated_at();

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id)
  values (new.id)
  on conflict (id) do nothing;

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create function public.ensure_template_available_to_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.template_id is not null and not exists (
    select 1
    from public.workout_templates
    where workout_templates.id = new.template_id
      and workout_templates.user_id = new.user_id
  ) then
    raise exception 'Template is not available to this user.'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

create trigger ensure_workout_session_template_available
  before insert or update of user_id, template_id on public.workout_sessions
  for each row execute function public.ensure_template_available_to_user();

create function public.ensure_exercise_available_to_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.exercises
    where exercises.id = new.exercise_id
      and (exercises.user_id is null or exercises.user_id = new.user_id)
  ) then
    raise exception 'Exercise is not available to this user.'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

create trigger ensure_workout_template_exercise_available
  before insert or update of user_id, exercise_id on public.workout_template_exercises
  for each row execute function public.ensure_exercise_available_to_user();

create trigger ensure_workout_session_exercise_available
  before insert or update of user_id, exercise_id on public.workout_session_exercises
  for each row execute function public.ensure_exercise_available_to_user();

alter table public.profiles enable row level security;
alter table public.exercises enable row level security;
alter table public.workout_templates enable row level security;
alter table public.workout_template_exercises enable row level security;
alter table public.workout_sessions enable row level security;
alter table public.workout_session_exercises enable row level security;
alter table public.workout_sets enable row level security;
alter table public.progression_recommendations enable row level security;
alter table public.strength_records enable row level security;

create policy "profiles_select_own"
  on public.profiles
  for select
  to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_insert_own"
  on public.profiles
  for insert
  to authenticated
  with check ((select auth.uid()) = id);

create policy "profiles_update_own"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "exercises_select_available"
  on public.exercises
  for select
  to authenticated
  using (user_id is null or (select auth.uid()) = user_id);

create policy "exercises_insert_own"
  on public.exercises
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "exercises_update_own"
  on public.exercises
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "workout_templates_manage_own"
  on public.workout_templates
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "workout_template_exercises_manage_own"
  on public.workout_template_exercises
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "workout_sessions_manage_own"
  on public.workout_sessions
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "workout_session_exercises_manage_own"
  on public.workout_session_exercises
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "workout_sets_manage_own"
  on public.workout_sets
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "progression_recommendations_select_own"
  on public.progression_recommendations
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "progression_recommendations_insert_own"
  on public.progression_recommendations
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "progression_recommendations_update_own"
  on public.progression_recommendations
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "strength_records_select_own"
  on public.strength_records
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "strength_records_insert_own"
  on public.strength_records
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

grant usage on schema public to authenticated;
grant usage on schema extensions to authenticated;
grant execute on function extensions.gen_random_uuid() to authenticated;

grant usage on type public.weight_unit to authenticated;
grant usage on type public.set_kind to authenticated;
grant usage on type public.workout_session_status to authenticated;
grant usage on type public.progression_action to authenticated;
grant usage on type public.progression_reason to authenticated;
grant usage on type public.strength_record_type to authenticated;
grant usage on type public.strength_record_value_unit to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update on public.exercises to authenticated;
grant select, insert, update on public.workout_templates to authenticated;
grant select, insert, update, delete on public.workout_template_exercises to authenticated;
grant select, insert, update on public.workout_sessions to authenticated;
grant select, insert, update, delete on public.workout_session_exercises to authenticated;
grant select, insert, update, delete on public.workout_sets to authenticated;
grant select, insert, update on public.progression_recommendations to authenticated;
grant select, insert on public.strength_records to authenticated;
