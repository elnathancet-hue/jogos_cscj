/*
 * ===========================================================================
 * RPC — Ranking / Leaderboard (público / anônimo)
 * ===========================================================================
 * get_result_rank(result_id): posição (rank) e total de sessões do jogo para
 *   um resultado recém-enviado.
 * get_game_leaderboard(game_id, limit): top jogadores de um jogo publicado.
 * Ambas SECURITY DEFINER — ignoram a RLS de game_results para leitura pública.
 * Critério: maior pontuação; empate desempata por menor tempo.
 * ===========================================================================
 */

create or replace function public.get_result_rank(p_result_id uuid)
returns table (rank int, total int)
language sql
stable
security definer
set search_path = public
as $$
  with me as (
    select game_id, score, duration_seconds
    from public.game_results
    where id = p_result_id
  )
  select
    (
      select count(*) + 1
      from public.game_results r, me
      where r.game_id = me.game_id
        and (
          r.score > me.score
          or (
            r.score = me.score
            and coalesce(r.duration_seconds, 2147483647) < coalesce(me.duration_seconds, 2147483647)
          )
        )
    )::int as rank,
    (select count(*) from public.game_results r, me where r.game_id = me.game_id)::int as total;
$$;

comment on function public.get_result_rank(uuid) is
  'Posição e total de sessões de um resultado (maior score, desempate por tempo).';

create or replace function public.get_game_leaderboard(p_game_id uuid, p_limit int default 5)
returns table (player_name text, score int, duration_seconds int)
language sql
stable
security definer
set search_path = public
as $$
  select gr.player_name, gr.score, gr.duration_seconds
  from public.game_results gr
  join public.games g on g.id = gr.game_id and g.status = 'published'
  where gr.game_id = p_game_id
  order by gr.score desc, coalesce(gr.duration_seconds, 2147483647) asc
  limit greatest(1, least(coalesce(p_limit, 5), 20));
$$;

comment on function public.get_game_leaderboard(uuid, int) is
  'Top jogadores de um jogo publicado (para o ranking público).';

grant execute on function public.get_result_rank(uuid) to anon, authenticated;
grant execute on function public.get_game_leaderboard(uuid, int) to anon, authenticated;
