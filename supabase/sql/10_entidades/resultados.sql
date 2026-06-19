/*
 * ===========================================================================
 * ENTIDADE — resultados / sessões de jogo (public.game_results)
 * ===========================================================================
 * Guarda cada conclusão de jogo: nome informado, turma (opcional), pontuação,
 * tempo e data. Jogadores podem ser anônimos — por isso a inserção acontece
 * APENAS pela função submit_game_result (SECURITY DEFINER, ver 30_rpc).
 * Não há política de INSERT direta: ninguém escreve aqui sem passar pela RPC.
 * Depende de: games, classes, organizations.
 * ===========================================================================
 */

create table if not exists public.game_results (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  game_id          uuid not null references public.games(id) on delete cascade,
  class_id         uuid references public.classes(id) on delete set null,
  player_name      varchar(120) not null,
  score            integer not null default 0,
  duration_seconds integer,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now()
);

comment on table public.game_results is
  'Resultados de sessões de jogo. Inseridos só via submit_game_result().';

create index if not exists game_results_game_idx
  on public.game_results (game_id, created_at desc);
create index if not exists game_results_org_idx
  on public.game_results (organization_id, created_at desc);
create index if not exists game_results_class_idx
  on public.game_results (class_id);

alter table public.game_results enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Vê: quem tem results.view na organização (admin/criador/observador) ou super admin.
drop policy if exists game_results_select on public.game_results;
create policy game_results_select on public.game_results
  for select to authenticated
  using (
    public.has_org_permission(organization_id, 'results.view')
    or public.is_super_admin()
  );

-- Exclui: admin/super admin (limpeza). Sem update; inserção só via RPC.
drop policy if exists game_results_delete on public.game_results;
create policy game_results_delete on public.game_results
  for delete to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin());

-- --- Grants ----------------------------------------------------------------
grant select, delete on public.game_results to authenticated;
