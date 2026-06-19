-- ============================================================
-- jogos_cscj :: área de Usuários/Organizações
-- Bundle de todas as migrations na ordem correta.
-- Cole no SQL Editor do Supabase e clique Run. Idempotente.
-- ============================================================

-- >>> 20260615120000_enums_and_extensions.sql >>>
/*
 * ---------------------------------------------------------------------------
 * Migration: enums and extensions
 * Area: Users / Organizations (SaaS core)
 * ---------------------------------------------------------------------------
 * Defines every enum used by the user/organization domain plus the generic
 * `updated_at` timestamp trigger function. Idempotent: safe to re-run.
 * ---------------------------------------------------------------------------
 */

-- pgcrypto provides gen_random_uuid() (available by default on Supabase).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Account lifecycle for a person on the platform.
do $$ begin
  create type public.user_status as enum ('active', 'inactive', 'blocked');
exception when duplicate_object then null; end $$;

-- What kind of institution an organization is.
do $$ begin
  create type public.organization_type as enum (
    'school', 'museum', 'company', 'cultural_project', 'other'
  );
exception when duplicate_object then null; end $$;

-- Organization lifecycle.
do $$ begin
  create type public.organization_status as enum ('active', 'inactive', 'suspended');
exception when duplicate_object then null; end $$;

-- Commercial plan attached to an organization.
do $$ begin
  create type public.organization_plan as enum ('free', 'starter', 'pro', 'enterprise');
exception when duplicate_object then null; end $$;

-- Roles a person can hold WITHIN an organization.
-- NOTE: platform super_admin is intentionally NOT here; it lives on
-- public.profiles.is_super_admin because it is platform-wide, not org-scoped.
do $$ begin
  create type public.member_role as enum (
    'org_admin', 'creator', 'collaborator', 'viewer'
  );
exception when duplicate_object then null; end $$;

-- Membership lifecycle within an organization.
do $$ begin
  create type public.member_status as enum ('active', 'invited', 'removed');
exception when duplicate_object then null; end $$;

-- Invitation lifecycle.
do $$ begin
  create type public.invitation_status as enum (
    'pending', 'accepted', 'expired', 'revoked'
  );
exception when duplicate_object then null; end $$;

-- Granular permissions. Extend by adding values (enums are append-only).
do $$ begin
  create type public.app_permission as enum (
    'users.view',
    'users.invite',
    'users.update',
    'users.remove',
    'games.create',
    'games.view',
    'games.update',
    'games.delete',
    'games.publish',
    'results.view',
    'organization.update',
    'billing.view'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Generic trigger: keep updated_at in sync on every UPDATE.
-- ---------------------------------------------------------------------------
create or replace function public.trigger_set_timestamps()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, now());
  else
    new.updated_at := now();
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

comment on function public.trigger_set_timestamps() is
  'Generic BEFORE INSERT/UPDATE trigger that maintains created_at/updated_at.';

-- >>> 20260615120100_tables.sql >>>
/*
 * ---------------------------------------------------------------------------
 * Migration: core tables (Users / Organizations)
 * ---------------------------------------------------------------------------
 * profiles, organizations, organization_members, invitations,
 * roles, role_permissions, audit_logs.
 * RLS is ENABLED here but policies are added in a later migration so the
 * tables are never readable without an explicit policy in between.
 * ---------------------------------------------------------------------------
 */

-- ---------------------------------------------------------------------------
-- profiles — one row per auth.users record (1:1).
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     varchar(255),
  email         varchar(320),
  avatar_url    varchar(1000),
  phone         varchar(30),
  status        public.user_status not null default 'active',
  -- Platform-wide super admin (you / the platform team). NOT an org role.
  is_super_admin boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table public.profiles is
  'Public profile mirroring auth.users. Auto-created by handle_new_user trigger.';
comment on column public.profiles.is_super_admin is
  'Platform-wide administrator. Bypasses org isolation via is_super_admin().';

alter table public.profiles enable row level security;

-- ---------------------------------------------------------------------------
-- organizations — the tenant (school / museum / company / project).
-- ---------------------------------------------------------------------------
create table if not exists public.organizations (
  id                uuid primary key default gen_random_uuid(),
  name              varchar(255) not null,
  slug              varchar(120) not null unique,
  logo_url          varchar(1000),
  primary_color     varchar(7),
  organization_type public.organization_type not null default 'other',
  plan              public.organization_plan not null default 'free',
  status            public.organization_status not null default 'active',
  created_by        uuid references auth.users(id) on delete set null,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint organizations_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint organizations_primary_color_format
    check (primary_color is null or primary_color ~* '^#[0-9a-f]{6}$')
);

comment on table public.organizations is
  'Tenant root. Every game/team/result hangs off an organization.';

alter table public.organizations enable row level security;

-- ---------------------------------------------------------------------------
-- organization_members — who belongs to an organization and with what role.
-- ---------------------------------------------------------------------------
create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.member_role not null default 'viewer',
  status          public.member_status not null default 'active',
  invited_by      uuid references auth.users(id) on delete set null,
  joined_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  -- A user can appear at most once per organization.
  constraint organization_members_unique unique (organization_id, user_id)
);

comment on table public.organization_members is
  'Junction of profiles <-> organizations carrying the org-scoped role.';

create index if not exists organization_members_org_idx
  on public.organization_members (organization_id);
create index if not exists organization_members_user_idx
  on public.organization_members (user_id);

alter table public.organization_members enable row level security;

-- ---------------------------------------------------------------------------
-- invitations — pending invites to join an organization.
-- ---------------------------------------------------------------------------
create table if not exists public.invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           varchar(320) not null,
  role            public.member_role not null default 'viewer',
  token           uuid not null default gen_random_uuid() unique,
  status          public.invitation_status not null default 'pending',
  invited_by      uuid references auth.users(id) on delete set null,
  expires_at      timestamptz not null default (now() + interval '7 days'),
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint invitations_email_format
    check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

comment on table public.invitations is
  'Outstanding org invitations. Accepted via signed token, not RLS.';

-- Only one *pending* invite per (org, email); resending revokes/replaces.
create unique index if not exists invitations_pending_unique
  on public.invitations (organization_id, lower(email))
  where status = 'pending';
create index if not exists invitations_org_idx
  on public.invitations (organization_id);

alter table public.invitations enable row level security;

-- ---------------------------------------------------------------------------
-- roles + role_permissions — reference data driving hasPermission().
-- Global (not per-org) for the MVP. Seeded in a later migration.
-- ---------------------------------------------------------------------------
create table if not exists public.roles (
  key         public.member_role primary key,
  name        varchar(80) not null,
  description text,
  created_at  timestamptz not null default now()
);

comment on table public.roles is 'Human-readable metadata for each member_role.';

alter table public.roles enable row level security;

create table if not exists public.role_permissions (
  id             uuid primary key default gen_random_uuid(),
  role_key       public.member_role not null references public.roles(key) on delete cascade,
  permission_key public.app_permission not null,
  created_at     timestamptz not null default now(),

  constraint role_permissions_unique unique (role_key, permission_key)
);

comment on table public.role_permissions is
  'Maps each role to the permissions it grants. Source of truth for has_org_permission().';

create index if not exists role_permissions_role_idx
  on public.role_permissions (role_key);

alter table public.role_permissions enable row level security;

-- ---------------------------------------------------------------------------
-- audit_logs — immutable record of important actions.
-- ---------------------------------------------------------------------------
create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id         uuid references auth.users(id) on delete set null,
  action          varchar(120) not null,
  entity_type     varchar(80),
  entity_id       uuid,
  metadata        jsonb not null default '{}'::jsonb,
  ip_address      inet,
  created_at      timestamptz not null default now()
);

comment on table public.audit_logs is
  'Append-only activity log. No UPDATE/DELETE policies by design.';

create index if not exists audit_logs_org_idx
  on public.audit_logs (organization_id, created_at desc);
create index if not exists audit_logs_user_idx
  on public.audit_logs (user_id, created_at desc);

alter table public.audit_logs enable row level security;

-- >>> 20260615120200_helper_functions.sql >>>
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

-- >>> 20260615120300_rls_policies.sql >>>
/*
 * ---------------------------------------------------------------------------
 * Migration: Row Level Security policies
 * ---------------------------------------------------------------------------
 * Every table has RLS enabled (previous migration). With no policy, a table
 * is deny-all. These policies open precisely the needed access paths and
 * nothing more. All multi-tenant checks go through the SECURITY DEFINER
 * helpers so there is no policy recursion.
 *
 * Policies are split per command (select/insert/update/delete) for clarity
 * and dropped-then-created so this migration is idempotent.
 * ---------------------------------------------------------------------------
 */

-- ===========================================================================
-- profiles
-- ===========================================================================
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_super_admin()
    or public.shares_org_with(id)
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_super_admin())
  with check (id = (select auth.uid()) or public.is_super_admin());

-- No delete policy: profiles are removed only via auth.users cascade.

-- ===========================================================================
-- organizations
-- ===========================================================================
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (public.is_org_member(id) or public.is_super_admin());

-- Any authenticated user can create an organization, but only as themselves.
-- A trigger immediately adds them as org_admin (see triggers migration).
drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update to authenticated
  using (public.is_org_admin(id) or public.is_super_admin())
  with check (public.is_org_admin(id) or public.is_super_admin());

drop policy if exists organizations_delete on public.organizations;
create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.is_org_admin(id) or public.is_super_admin());

-- ===========================================================================
-- organization_members
-- ===========================================================================
drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_org_member(organization_id)
    or public.is_super_admin()
  );

drop policy if exists organization_members_insert on public.organization_members;
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists organization_members_update on public.organization_members;
create policy organization_members_update on public.organization_members
  for update to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin())
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

-- Admins manage anyone; a member may remove themselves (leave the org).
drop policy if exists organization_members_delete on public.organization_members;
create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (
    public.is_org_admin(organization_id)
    or public.is_super_admin()
    or user_id = (select auth.uid())
  );

-- ===========================================================================
-- invitations
-- Visible/manageable only by org admins. Acceptance happens server-side via
-- the signed token (service role / edge function), not through these policies.
-- ===========================================================================
drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations
  for select to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists invitations_insert on public.invitations;
create policy invitations_insert on public.invitations
  for insert to authenticated
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists invitations_update on public.invitations;
create policy invitations_update on public.invitations
  for update to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin())
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists invitations_delete on public.invitations;
create policy invitations_delete on public.invitations
  for delete to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin());

-- ===========================================================================
-- roles + role_permissions — read-only reference data for everyone signed in.
-- Only super admins may change them.
-- ===========================================================================
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select to authenticated using (true);

drop policy if exists roles_write on public.roles;
create policy roles_write on public.roles
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
  for select to authenticated using (true);

drop policy if exists role_permissions_write on public.role_permissions;
create policy role_permissions_write on public.role_permissions
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ===========================================================================
-- audit_logs — admins read their org's logs; members append their own.
-- No update/delete policies: the log is immutable.
-- ===========================================================================
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (organization_id is null or public.is_org_member(organization_id))
  );

-- >>> 20260615120350_grants.sql >>>
/*
 * ---------------------------------------------------------------------------
 * Migration: table & function grants
 * ---------------------------------------------------------------------------
 * RLS only narrows what a role can see AMONG rows it is already granted access
 * to. Without these table-level GRANTs the policies are moot. We grant broadly
 * to `authenticated` and let RLS do the row filtering. `anon` gets nothing
 * here — anonymous players will be handled by a dedicated future table.
 * ---------------------------------------------------------------------------
 */

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.organizations,
  public.organization_members,
  public.invitations,
  public.audit_logs
to authenticated;

-- Reference data is read-only for normal users (writes blocked by RLS anyway).
grant select on public.roles, public.role_permissions to authenticated;

-- Authorization helpers must be callable by authenticated users.
grant execute on function
  public.is_super_admin(),
  public.is_org_member(uuid),
  public.get_org_role(uuid),
  public.is_org_admin(uuid),
  public.has_org_permission(uuid, public.app_permission),
  public.shares_org_with(uuid)
to authenticated;

-- >>> 20260615120400_triggers.sql >>>
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

-- >>> 20260615120500_seed_roles_permissions.sql >>>
/*
 * ---------------------------------------------------------------------------
 * Migration: seed roles + role_permissions (reference data)
 * ---------------------------------------------------------------------------
 * Mirrors the ROLE_PERMISSIONS map from the spec. Idempotent via ON CONFLICT.
 * super_admin is NOT seeded here: it is the platform-wide profiles.is_super_admin
 * flag and is granted every permission directly by has_org_permission().
 * ---------------------------------------------------------------------------
 */

insert into public.roles (key, name, description) values
  ('org_admin',    'Administrador da Organização', 'Gerencia a organização, membros, jogos e relatórios.'),
  ('creator',      'Criador / Professor / Curador', 'Cria e edita os próprios jogos e vê seus resultados.'),
  ('collaborator', 'Colaborador',                   'Edita conteúdos permitidos; não exclui nem gerencia usuários.'),
  ('viewer',       'Leitor / Observador',           'Apenas visualiza jogos e relatórios.')
on conflict (key) do update
  set name = excluded.name,
      description = excluded.description;

-- org_admin: everything except platform-only concerns.
insert into public.role_permissions (role_key, permission_key)
select 'org_admin', perm
from unnest(array[
  'users.view', 'users.invite', 'users.update', 'users.remove',
  'games.create', 'games.view', 'games.update', 'games.delete', 'games.publish',
  'results.view', 'organization.update', 'billing.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- creator: create/edit/publish own games + view results.
insert into public.role_permissions (role_key, permission_key)
select 'creator', perm
from unnest(array[
  'games.create', 'games.view', 'games.update', 'games.publish', 'results.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- collaborator: view + edit games only.
insert into public.role_permissions (role_key, permission_key)
select 'collaborator', perm
from unnest(array[
  'games.view', 'games.update'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- viewer: read-only.
insert into public.role_permissions (role_key, permission_key)
select 'viewer', perm
from unnest(array[
  'games.view', 'results.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

