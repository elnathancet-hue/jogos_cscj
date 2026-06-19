/*
 * ---------------------------------------------------------------------------
 * Migration: authorization helper functions
 * ---------------------------------------------------------------------------
 * All functions are SECURITY DEFINER with a pinned search_path so they bypass
 * RLS internally. This is what prevents infinite recursion: an RLS policy on
 * organization_members can safely call is_org_member(), which itself reads
 * organization_members WITHOUT re-triggering the policy.
 *
 * They are STABLE (no writes) and marked so they can be inlined in policies.
 * ---------------------------------------------------------------------------
 */

-- Is the current user a platform super admin?
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_super_admin = true
  );
$$;

-- Is the current user an ACTIVE member of the given organization?
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- The current user's role in the given organization (null if not a member).
create or replace function public.get_org_role(org_id uuid)
returns public.member_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.organization_members m
  where m.organization_id = org_id
    and m.user_id = auth.uid()
    and m.status = 'active'
  limit 1;
$$;

-- Is the current user an admin of the given organization?
create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_org_role(org_id) = 'org_admin';
$$;

-- Does the current user have a specific permission in the given organization?
-- Super admins implicitly have every permission.
create or replace function public.has_org_permission(
  org_id uuid,
  permission public.app_permission
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.organization_members m
      join public.role_permissions rp on rp.role_key = m.role
      where m.organization_id = org_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and rp.permission_key = permission
    );
$$;

-- Do the current user and target_user share at least one organization?
-- Used so teammates can see each other's profiles without exposing everyone.
create or replace function public.shares_org_with(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members me
    join public.organization_members them
      on them.organization_id = me.organization_id
    where me.user_id = auth.uid()
      and me.status = 'active'
      and them.user_id = target_user
      and them.status = 'active'
  );
$$;

comment on function public.is_super_admin() is 'Current user is a platform super admin.';
comment on function public.is_org_member(uuid) is 'Current user is an active member of org_id.';
comment on function public.get_org_role(uuid) is 'Current user role in org_id, or null.';
comment on function public.is_org_admin(uuid) is 'Current user is org_admin of org_id.';
comment on function public.has_org_permission(uuid, public.app_permission) is
  'Current user holds permission in org_id (super admins always true).';
comment on function public.shares_org_with(uuid) is
  'Current user shares an active membership with target_user.';
