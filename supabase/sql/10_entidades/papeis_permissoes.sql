/*
 * ===========================================================================
 * ENTIDADE — papéis e permissões (public.roles, public.role_permissions)
 * ===========================================================================
 * Dados de referência que alimentam has_org_permission(). Globais (não por
 * organização) no MVP. Os valores iniciais são inseridos em
 * 20_dados/seed_papeis.sql.
 * ===========================================================================
 */

-- --- roles -----------------------------------------------------------------
create table if not exists public.roles (
  key         public.member_role primary key,
  name        varchar(80) not null,
  description text,
  created_at  timestamptz not null default now()
);

comment on table public.roles is 'Metadados legíveis de cada member_role.';

alter table public.roles enable row level security;

-- Leitura liberada para autenticados; escrita só super admin.
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select to authenticated using (true);

drop policy if exists roles_write on public.roles;
create policy roles_write on public.roles
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select on public.roles to authenticated;

-- --- role_permissions ------------------------------------------------------
create table if not exists public.role_permissions (
  id             uuid primary key default gen_random_uuid(),
  role_key       public.member_role not null references public.roles(key) on delete cascade,
  permission_key public.app_permission not null,
  created_at     timestamptz not null default now(),

  constraint role_permissions_unique unique (role_key, permission_key)
);

comment on table public.role_permissions is
  'Mapeia cada papel às permissões que ele concede. Fonte da verdade do has_org_permission().';

create index if not exists role_permissions_role_idx
  on public.role_permissions (role_key);

alter table public.role_permissions enable row level security;

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
  for select to authenticated using (true);

drop policy if exists role_permissions_write on public.role_permissions;
create policy role_permissions_write on public.role_permissions
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

grant select on public.role_permissions to authenticated;
