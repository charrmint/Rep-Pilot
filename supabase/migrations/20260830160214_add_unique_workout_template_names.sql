create unique index workout_templates_user_name_unique_idx
  on public.workout_templates (user_id, lower(btrim(name)));
