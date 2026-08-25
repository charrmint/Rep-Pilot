insert into public.exercises (user_id, name)
values
  (null, 'Back Squat'),
  (null, 'Bench Press'),
  (null, 'Bent-Over Row'),
  (null, 'Biceps Curl'),
  (null, 'Low Cable Row'),
  (null, 'Deadlift'),
  (null, 'Incline Dumbbell Press'),
  (null, 'Lat Pulldown'),
  (null, 'Lateral Raise'),
  (null, 'Seated Shoulder Press'),
  (null, 'Bulgarian Squat'),
  (null, 'Triceps Pushdown'),
  (null, 'Sit-up')
on conflict do nothing;
