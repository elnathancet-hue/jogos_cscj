/*
 * ===========================================================================
 * ENTIDADE — perfis (public.profiles)
 * ===========================================================================
 * 1 linha por usuário do auth.users (relação 1:1). Criada automaticamente no
 * cadastro pelo gatilho handle_new_user (ver 99_gatilhos.sql).
 * Arquivo autocontido: tabela + índices + RLS + grants.
 * ===========================================================================
 */

create table if not exists public.profiles (
  id             uuid primary key references auth.users(id) on delete cascade,
  full_name      varchar(255),
  email          varchar(320),
  avatar_url     varchar(1000),
  phone          varchar(30),
  status         public.user_status not null default 'active',
  -- Super admin da plataforma (você / equipe dona). NÃO é papel de organização.
  is_super_admin boolean not null default false,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

comment on table public.profiles is
  'Perfil público espelhando auth.users. Criado pelo gatilho handle_new_user.';
comment on column public.profiles.is_super_admin is
  'Administrador da plataforma. Ignora o isolamento de organização via is_super_admin().';

alter table public.profiles enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Vê: o próprio / super admin / colega de organização.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_super_admin()
    or public.shares_org_with(id)
  );

-- Insere: apenas o próprio registro (normalmente via gatilho).
drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

-- Atualiza: o próprio ou super admin.
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_super_admin())
  with check (id = (select auth.uid()) or public.is_super_admin());

-- Sem política de delete: perfis só somem via cascade do auth.users.

-- --- Grants ----------------------------------------------------------------
grant select, insert, update, delete on public.profiles to authenticated;
