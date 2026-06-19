/*
 * ---------------------------------------------------------------------------
 * Migration: triggers
 * ---------------------------------------------------------------------------
 *  1. timestamps  — maintain created_at/updated_at on every domain table.
 *  2. handle_new_user — create a public.profiles row when someone signs up.
 *  3. handle_new_organization — make the creator the first org_admin.
 * ---------------------------------------------------------------------------
 */

-- ---------------------------------------------------------------------------
-- 1. updated_at maintenance
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'organization_members', 'invitations'
  ]
  loop
    execute format('drop trigger if exists set_timestamps on public.%I;', t);
    execute format(
      'create trigger set_timestamps before insert or update on public.%I
         for each row execute function public.trigger_set_timestamps();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Auto-create a profile for every new auth user.
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. The user who creates an organization becomes its first org_admin.
--    SECURITY DEFINER so the membership insert bypasses the RLS insert policy
--    (which would otherwise require the user to ALREADY be an admin).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.organization_members
      (organization_id, user_id, role, status, joined_at)
    values
      (new.id, new.created_by, 'org_admin', 'active', now())
    on conflict (organization_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();
