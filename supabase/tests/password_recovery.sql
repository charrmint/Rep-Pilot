begin;
create extension if not exists pgtap with schema extensions;
select plan(9);

insert into auth.users (id, email)
values ('d76e363c-f845-4324-a7fa-ac0623b594e6', 'recovery-test@example.invalid');

select ok(not has_function_privilege('anon', 'public.consume_password_recovery()', 'execute'), 'anonymous callers cannot consume');
select ok(not has_table_privilege('authenticated', 'private.consumed_password_recoveries', 'insert'), 'callers cannot insert proof directly');
select ok(not has_table_privilege('authenticated', 'private.consumed_password_recoveries', 'delete'), 'callers cannot remove consumed proof');

select set_config('request.jwt.claims', jsonb_build_object(
  'sub', 'd76e363c-f845-4324-a7fa-ac0623b594e6',
  'session_id', '73b6525d-963d-43b2-9f11-2d302903024a',
  'is_anonymous', false,
  'amr', jsonb_build_array(jsonb_build_object('method', 'password', 'timestamp', extract(epoch from now())))
)::text, true);
set local role authenticated;
select is(public.consume_password_recovery(), false, 'ordinary login cannot authorize password change');
select set_config('request.jwt.claims', jsonb_set(current_setting('request.jwt.claims')::jsonb, '{amr,0,method}', '"recovery"')::text, true);
select is(public.consume_password_recovery(), true, 'fresh recovery is accepted');
select is(public.consume_password_recovery(), false, 'same recovery cannot be reused');
select set_config('request.jwt.claims', jsonb_set(current_setting('request.jwt.claims')::jsonb, '{session_id}', '"259f8a2d-2931-43fb-9927-1e53557985c9"')::text, true);
select set_config('request.jwt.claims', jsonb_set(current_setting('request.jwt.claims')::jsonb, '{amr,0,timestamp}', to_jsonb(extract(epoch from now()) - 900))::text, true);
select is(public.consume_password_recovery(), false, '15-minute-old recovery expires');
select set_config('request.jwt.claims', jsonb_set(current_setting('request.jwt.claims')::jsonb, '{amr,0,timestamp}', to_jsonb(extract(epoch from now()) + 60))::text, true);
select is(public.consume_password_recovery(), false, 'future recovery fails closed');
select set_config('request.jwt.claims', jsonb_set(current_setting('request.jwt.claims')::jsonb, '{amr,0,timestamp}', to_jsonb(extract(epoch from now())))::text, true);
select set_config('request.jwt.claims', jsonb_set(current_setting('request.jwt.claims')::jsonb, '{is_anonymous}', 'true')::text, true);
select is(public.consume_password_recovery(), false, 'anonymous sessions fail closed');
reset role;
select * from finish();
rollback;
