/*
 * ===========================================================================
 * RPC — Jogar / Resultados (acesso público / anônimo)
 * ===========================================================================
 * get_public_game(id): dados mínimos de um jogo PUBLICADO (anon pode ler).
 * submit_game_result(...): registra uma sessão (anon pode chamar). Valida que
 *   o jogo está publicado e resolve a turma pelo código, se houver.
 * Ambas SECURITY DEFINER — ignoram a RLS de games/classes/game_results.
 * ===========================================================================
 */

-- drop necessário: o tipo de retorno mudou (inclui settings + marca da org).
drop function if exists public.get_public_game(uuid);
create or replace function public.get_public_game(p_game_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  organization_id uuid,
  settings jsonb,
  cover_image_url text,
  org_name text,
  primary_color text,
  logo_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id, g.title, g.description, g.organization_id, g.settings,
    g.cover_image_url, o.name as org_name, o.primary_color, o.logo_url
  from public.games g
  join public.organizations o on o.id = g.organization_id
  where g.id = p_game_id and g.status = 'published';
$$;

comment on function public.get_public_game(uuid) is
  'Dados públicos de um jogo publicado (para a página de jogar).';

create or replace function public.submit_game_result(
  p_game_id          uuid,
  p_player_name      text,
  p_score            integer default 0,
  p_duration_seconds integer default null,
  p_class_code       text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game      public.games%rowtype;
  v_class_id  uuid;
  v_result_id uuid;
  v_name      text := nullif(trim(p_player_name), '');
begin
  if v_name is null then
    raise exception 'Informe um nome para começar.';
  end if;

  select * into v_game from public.games where id = p_game_id;
  if not found then
    raise exception 'Jogo não encontrado.';
  end if;
  if v_game.status <> 'published' then
    raise exception 'Este jogo não está disponível.';
  end if;

  -- Turma opcional pelo código (código inválido = segue sem turma).
  if nullif(trim(p_class_code), '') is not null then
    select id into v_class_id
    from public.classes
    where organization_id = v_game.organization_id
      and upper(code) = upper(trim(p_class_code))
    limit 1;
  end if;

  insert into public.game_results
    (organization_id, game_id, class_id, player_name, score, duration_seconds)
  values
    (v_game.organization_id, p_game_id, v_class_id, left(v_name, 120),
     greatest(coalesce(p_score, 0), 0), p_duration_seconds)
  returning id into v_result_id;

  return v_result_id;
end;
$$;

comment on function public.submit_game_result(uuid, text, integer, integer, text) is
  'Registra uma sessão de jogo (jogador anônimo). Valida publicação e turma.';

grant execute on function public.get_public_game(uuid) to anon, authenticated;
grant execute on function public.submit_game_result(uuid, text, integer, integer, text)
  to anon, authenticated;

-- ---------------------------------------------------------------------------
-- get_org_public_games(org_id): todos os jogos PUBLICADOS de uma organização,
-- para o modo TV em playlist (anon pode ler).
-- ---------------------------------------------------------------------------
create or replace function public.get_org_public_games(p_org_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  organization_id uuid,
  settings jsonb,
  cover_image_url text,
  org_name text,
  primary_color text,
  logo_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    g.id, g.title, g.description, g.organization_id, g.settings,
    g.cover_image_url, o.name as org_name, o.primary_color, o.logo_url
  from public.games g
  join public.organizations o on o.id = g.organization_id
  where g.organization_id = p_org_id and g.status = 'published'
  order by g.created_at desc;
$$;

comment on function public.get_org_public_games(uuid) is
  'Jogos publicados de uma organização (para o Modo TV em playlist).';

grant execute on function public.get_org_public_games(uuid) to anon, authenticated;
