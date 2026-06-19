/*
 * ===========================================================================
 * ENTIDADE — jogos (public.games)
 * ===========================================================================
 * Todo jogo nasce vinculado a uma organização (organization_id) e a um
 * criador (created_by). RBAC via has_org_permission().
 * Depende de: organizations + funções de autorização.
 * Arquivo autocontido: enum + tabela + índices + RLS + grants + timestamps.
 * ===========================================================================
 */

-- Situação de um jogo.
do $$ begin
  create type public.game_status as enum ('draft', 'published', 'archived');
exception when duplicate_object then null; end $$;

create table if not exists public.games (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by      uuid references auth.users(id) on delete set null,
  title           varchar(200) not null,
  description     text,
  status          public.game_status not null default 'draft',
  cover_image_url varchar(1000),
  settings        jsonb not null default '{}'::jsonb,
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.games is
  'Jogos da organização. Sempre vinculados a organization_id + created_by.';

create index if not exists games_org_idx
  on public.games (organization_id, created_at desc);
create index if not exists games_creator_idx
  on public.games (created_by);

alter table public.games enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Vê: qualquer membro da organização (ou super admin).
drop policy if exists games_select on public.games;
create policy games_select on public.games
  for select to authenticated
  using (public.is_org_member(organization_id) or public.is_super_admin());

-- Cria: quem tem games.create, e só como ele mesmo (created_by = próprio).
drop policy if exists games_insert on public.games;
create policy games_insert on public.games
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (public.has_org_permission(organization_id, 'games.create') or public.is_super_admin())
  );

-- Edita: admin (qualquer jogo), colaborador (qualquer jogo) ou o criador
-- (apenas os próprios) — todos precisam de games.update.
drop policy if exists games_update on public.games;
create policy games_update on public.games
  for update to authenticated
  using (
    public.is_super_admin()
    or public.is_org_admin(organization_id)
    or (
      public.has_org_permission(organization_id, 'games.update')
      and (
        created_by = (select auth.uid())
        or public.get_org_role(organization_id) = 'collaborator'
      )
    )
  )
  with check (
    public.is_super_admin()
    or public.is_org_admin(organization_id)
    or (
      public.has_org_permission(organization_id, 'games.update')
      and (
        created_by = (select auth.uid())
        or public.get_org_role(organization_id) = 'collaborator'
      )
    )
  );

-- Exclui: admin/super admin, ou o criador com games.delete.
drop policy if exists games_delete on public.games;
create policy games_delete on public.games
  for delete to authenticated
  using (
    public.is_super_admin()
    or public.is_org_admin(organization_id)
    or (created_by = (select auth.uid()) and public.has_org_permission(organization_id, 'games.delete'))
  );

-- --- Grants ----------------------------------------------------------------
grant select, insert, update, delete on public.games to authenticated;

-- --- Timestamps ------------------------------------------------------------
drop trigger if exists set_timestamps on public.games;
create trigger set_timestamps before insert or update on public.games
  for each row execute function public.trigger_set_timestamps();
