/*
 * ===========================================================================
 * ENTIDADE — organizações (public.organizations)
 * ===========================================================================
 * O tenant: escola, museu, empresa ou projeto cultural. Todo jogo / equipe /
 * resultado pendura numa organização.
 * Quem cria vira org_admin automaticamente (gatilho handle_new_organization).
 * ===========================================================================
 */

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

  -- slug em minúsculas, separado por hífens (ex.: colegio-sagrado-coracao).
  constraint organizations_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  -- cor em hexadecimal (ex.: #f59e0b).
  constraint organizations_primary_color_format
    check (primary_color is null or primary_color ~* '^#[0-9a-f]{6}$')
);

comment on table public.organizations is
  'Tenant raiz. Todo jogo/equipe/resultado pertence a uma organização.';

-- Tema visual da experiência de jogar/TV: { preset, accent, bgFrom, bgTo, font }.
alter table public.organizations add column if not exists theme jsonb;

alter table public.organizations enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Vê: membro da organização / super admin.
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (public.is_org_member(id) or public.is_super_admin());

-- Cria: qualquer autenticado, mas só como ele mesmo (created_by = próprio).
drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (created_by = (select auth.uid()));

-- Atualiza / exclui: admin da organização ou super admin.
drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update to authenticated
  using (public.is_org_admin(id) or public.is_super_admin())
  with check (public.is_org_admin(id) or public.is_super_admin());

drop policy if exists organizations_delete on public.organizations;
create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.is_org_admin(id) or public.is_super_admin());

-- --- Grants ----------------------------------------------------------------
grant select, insert, update, delete on public.organizations to authenticated;
