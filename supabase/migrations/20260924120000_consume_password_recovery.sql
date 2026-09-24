-- App-level single-use recovery authorization. Supabase Auth's direct user API
-- has its own policy and does not consult this table.
create schema if not exists private;

create table private.consumed_password_recoveries (
  session_id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  consumed_at timestamptz not null default now()
);
alter table private.consumed_password_recoveries enable row level security;
revoke all on private.consumed_password_recoveries from public, anon, authenticated;

create function public.consume_password_recovery()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  claims jsonb := auth.jwt();
  recovery_session uuid;
  inserted_count integer;
begin
  if auth.uid() is null or coalesce((claims ->> 'is_anonymous')::boolean, true) then
    return false;
  end if;
  recovery_session := nullif(claims ->> 'session_id', '')::uuid;
  if recovery_session is null or jsonb_typeof(claims -> 'amr') is distinct from 'array' then
    return false;
  end if;
  if not exists (
    select 1 from jsonb_array_elements(claims -> 'amr') as entry
    where entry ->> 'method' = 'recovery'
      and (entry ->> 'timestamp')::numeric <= extract(epoch from now())
      and (entry ->> 'timestamp')::numeric > extract(epoch from now()) - 900
  ) then
    return false;
  end if;

  insert into private.consumed_password_recoveries (session_id, user_id)
  values (recovery_session, auth.uid())
  on conflict (session_id) do nothing;
  get diagnostics inserted_count = row_count;
  return inserted_count = 1;
end;
$$;

revoke all on function public.consume_password_recovery() from public, anon;
grant execute on function public.consume_password_recovery() to authenticated;
