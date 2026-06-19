-- ============================================================
-- jogos_cscj :: Área de Usuários / Organizações
-- Bundle de TODO o SQL, na ordem correta de dependência.
-- Cole no SQL Editor do Supabase e clique Run. Idempotente.
-- (Gerado a partir de supabase/sql/ — não edite à mão.)
-- ============================================================

-- ===== sql/00_base/01_extensoes_e_tipos.sql =====
/*
 * ===========================================================================
 * BASE — Extensões e Tipos
 * ===========================================================================
 * Define as extensões necessárias, todos os tipos (enums) do domínio de
 * Usuários/Organizações e o gatilho genérico de timestamps.
 * Idempotente: pode rodar quantas vezes quiser.
 * ===========================================================================
 */

-- gen_random_uuid() vem do pgcrypto (já disponível no Supabase).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos (enums)
-- ---------------------------------------------------------------------------

-- Situação de uma pessoa na plataforma.
do $$ begin
  create type public.user_status as enum ('active', 'inactive', 'blocked');
exception when duplicate_object then null; end $$;

-- Tipo de instituição que a organização representa.
do $$ begin
  create type public.organization_type as enum (
    'school', 'museum', 'company', 'cultural_project', 'other'
  );
exception when duplicate_object then null; end $$;

-- Situação da organização.
do $$ begin
  create type public.organization_status as enum ('active', 'inactive', 'suspended');
exception when duplicate_object then null; end $$;

-- Plano comercial da organização.
do $$ begin
  create type public.organization_plan as enum ('free', 'starter', 'pro', 'enterprise');
exception when duplicate_object then null; end $$;

-- Papéis que uma pessoa pode ter DENTRO de uma organização.
-- OBS: o super admin da plataforma NÃO entra aqui — ele é a flag
-- public.profiles.is_super_admin, porque é global, não escopado por organização.
do $$ begin
  create type public.member_role as enum (
    'org_admin', 'creator', 'collaborator', 'viewer'
  );
exception when duplicate_object then null; end $$;

-- Situação do vínculo de um membro com a organização.
do $$ begin
  create type public.member_status as enum ('active', 'invited', 'removed');
exception when duplicate_object then null; end $$;

-- Situação de um convite.
do $$ begin
  create type public.invitation_status as enum (
    'pending', 'accepted', 'expired', 'revoked'
  );
exception when duplicate_object then null; end $$;

-- Permissões granulares. Para estender, basta adicionar valores (enums só crescem).
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
-- Gatilho genérico: mantém created_at / updated_at automaticamente.
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
  'Gatilho genérico BEFORE INSERT/UPDATE que mantém created_at/updated_at.';


-- ===== sql/00_base/02_funcoes_autorizacao.sql =====
/*
 * ===========================================================================
 * BASE — Funções de Autorização
 * ===========================================================================
 * Funções usadas pelas políticas RLS de várias tabelas. Por isso são criadas
 * AQUI, antes das tabelas: 'set check_function_bodies = off' permite criá-las
 * sem que as tabelas ainda existam. Em tempo de execução as tabelas já estarão
 * presentes.
 *
 * Todas são SECURITY DEFINER com search_path fixo — é isso que evita recursão
 * de RLS: uma política em organization_members pode chamar is_org_member(),
 * que lê organization_members SEM reentrar na política.
 * São STABLE (não escrevem) para poderem ser inlinadas nas políticas.
 * ===========================================================================
 */

set check_function_bodies = off;

-- O usuário atual é super admin da plataforma?
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_super_admin = true
  );
$$;

-- O usuário atual é membro ATIVO da organização informada?
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- Papel do usuário atual na organização (null se não for membro).
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

-- O usuário atual é admin da organização informada?
create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_org_role(org_id) = 'org_admin';
$$;

-- O usuário atual tem uma permissão específica na organização?
-- Super admins têm todas as permissões implicitamente.
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

-- O usuário atual e o target_user compartilham alguma organização?
-- Usada para colegas de organização poderem ver o perfil um do outro.
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

reset check_function_bodies;

comment on function public.is_super_admin() is 'Usuário atual é super admin da plataforma.';
comment on function public.is_org_member(uuid) is 'Usuário atual é membro ativo da organização.';
comment on function public.get_org_role(uuid) is 'Papel do usuário atual na organização, ou null.';
comment on function public.is_org_admin(uuid) is 'Usuário atual é org_admin da organização.';
comment on function public.has_org_permission(uuid, public.app_permission) is
  'Usuário atual tem a permissão na organização (super admin sempre verdadeiro).';
comment on function public.shares_org_with(uuid) is
  'Usuário atual compartilha um vínculo ativo com o target_user.';

-- ---------------------------------------------------------------------------
-- Permissões de execução (RLS atua por cima dos GRANTs).
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;

grant execute on function
  public.is_super_admin(),
  public.is_org_member(uuid),
  public.get_org_role(uuid),
  public.is_org_admin(uuid),
  public.has_org_permission(uuid, public.app_permission),
  public.shares_org_with(uuid)
to authenticated;


-- ===== sql/10_entidades/perfis.sql =====
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


-- ===== sql/10_entidades/organizacoes.sql =====
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


-- ===== sql/10_entidades/papeis_permissoes.sql =====
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


-- ===== sql/10_entidades/membros.sql =====
/*
 * ===========================================================================
 * ENTIDADE — membros (public.organization_members)
 * ===========================================================================
 * Vínculo usuário ⇄ organização carregando o papel (role) dentro da org.
 * Um usuário aparece no máximo uma vez por organização.
 * Depende de: organizations.
 * ===========================================================================
 */

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

  constraint organization_members_unique unique (organization_id, user_id)
);

comment on table public.organization_members is
  'Junção profiles <-> organizations com o papel escopado por organização.';

create index if not exists organization_members_org_idx
  on public.organization_members (organization_id);
create index if not exists organization_members_user_idx
  on public.organization_members (user_id);

alter table public.organization_members enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Vê: o próprio vínculo / membros da mesma organização / super admin.
drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_org_member(organization_id)
    or public.is_super_admin()
  );

-- Insere / atualiza: admin da organização ou super admin.
drop policy if exists organization_members_insert on public.organization_members;
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists organization_members_update on public.organization_members;
create policy organization_members_update on public.organization_members
  for update to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin())
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

-- Exclui: admin / super admin / o próprio (sair da organização).
drop policy if exists organization_members_delete on public.organization_members;
create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (
    public.is_org_admin(organization_id)
    or public.is_super_admin()
    or user_id = (select auth.uid())
  );

-- --- Grants ----------------------------------------------------------------
grant select, insert, update, delete on public.organization_members to authenticated;


-- ===== sql/10_entidades/convites.sql =====
/*
 * ===========================================================================
 * ENTIDADE — convites (public.invitations)
 * ===========================================================================
 * Convites pendentes para entrar numa organização. A aceitação acontece no
 * servidor via token assinado (service role / edge function), não pela RLS.
 * Depende de: organizations.
 * ===========================================================================
 */

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
  'Convites pendentes da organização. Aceitos via token assinado, não por RLS.';

-- Só um convite *pendente* por (organização, e-mail); reenviar revoga/substitui.
create unique index if not exists invitations_pending_unique
  on public.invitations (organization_id, lower(email))
  where status = 'pending';
create index if not exists invitations_org_idx
  on public.invitations (organization_id);

alter table public.invitations enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Visível/gerenciável só por admin da organização ou super admin.
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

-- --- Grants ----------------------------------------------------------------
grant select, insert, update, delete on public.invitations to authenticated;


-- ===== sql/10_entidades/logs_auditoria.sql =====
/*
 * ===========================================================================
 * ENTIDADE — logs de auditoria (public.audit_logs)
 * ===========================================================================
 * Registro append-only de ações importantes. Sem políticas de UPDATE/DELETE
 * de propósito: o log é imutável.
 * Depende de: organizations.
 * ===========================================================================
 */

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
  'Log de atividade append-only. Sem políticas de update/delete por design.';

create index if not exists audit_logs_org_idx
  on public.audit_logs (organization_id, created_at desc);
create index if not exists audit_logs_user_idx
  on public.audit_logs (user_id, created_at desc);

alter table public.audit_logs enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Lê: admin da organização ou super admin.
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin());

-- Insere: o próprio usuário, dentro de uma organização da qual é membro.
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (organization_id is null or public.is_org_member(organization_id))
  );

-- --- Grants ----------------------------------------------------------------
-- Sem delete/update: o log é imutável.
grant select, insert on public.audit_logs to authenticated;


-- ===== sql/20_dados/seed_papeis.sql =====
/*
 * ===========================================================================
 * DADOS INICIAIS — papéis e permissões
 * ===========================================================================
 * Espelha o mapa ROLE_PERMISSIONS da especificação. Idempotente (ON CONFLICT).
 * super_admin NÃO é semeado aqui: é a flag profiles.is_super_admin e recebe
 * todas as permissões direto no has_org_permission().
 * ===========================================================================
 */

insert into public.roles (key, name, description) values
  ('org_admin',    'Administrador da Organização', 'Gerencia a organização, membros, jogos e relatórios.'),
  ('creator',      'Criador / Professor / Curador', 'Cria e edita os próprios jogos e vê seus resultados.'),
  ('collaborator', 'Colaborador',                   'Edita conteúdos permitidos; não exclui nem gerencia usuários.'),
  ('viewer',       'Leitor / Observador',           'Apenas visualiza jogos e relatórios.')
on conflict (key) do update
  set name = excluded.name,
      description = excluded.description;

-- org_admin: tudo, menos o que é exclusivo da plataforma.
insert into public.role_permissions (role_key, permission_key)
select 'org_admin', perm
from unnest(array[
  'users.view', 'users.invite', 'users.update', 'users.remove',
  'games.create', 'games.view', 'games.update', 'games.delete', 'games.publish',
  'results.view', 'organization.update', 'billing.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- creator: cria/edita/publica os próprios jogos + vê resultados.
insert into public.role_permissions (role_key, permission_key)
select 'creator', perm
from unnest(array[
  'games.create', 'games.view', 'games.update', 'games.publish', 'results.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- collaborator: só ver + editar jogos.
insert into public.role_permissions (role_key, permission_key)
select 'collaborator', perm
from unnest(array[
  'games.view', 'games.update'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- viewer: somente leitura.
insert into public.role_permissions (role_key, permission_key)
select 'viewer', perm
from unnest(array[
  'games.view', 'results.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;


-- ===== sql/99_gatilhos.sql =====
/*
 * ===========================================================================
 * GATILHOS
 * ===========================================================================
 *  1. timestamps          — mantém created_at/updated_at em cada tabela.
 *  2. handle_new_user      — cria public.profiles quando alguém se cadastra.
 *  3. handle_new_organization — torna quem cria a org o primeiro org_admin.
 * Rodam por último, quando todas as tabelas e funções já existem.
 * ===========================================================================
 */

-- ---------------------------------------------------------------------------
-- 1. Manutenção de updated_at
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
-- 2. Cria um perfil para cada novo usuário do auth.
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
-- 3. Quem cria a organização vira o primeiro org_admin.
--    SECURITY DEFINER para o insert do membro ignorar a política de RLS
--    (que exigiria o usuário JÁ ser admin).
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

