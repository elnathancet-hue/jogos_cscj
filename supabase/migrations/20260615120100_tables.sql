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
