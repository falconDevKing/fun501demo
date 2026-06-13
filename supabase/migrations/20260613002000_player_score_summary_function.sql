create or replace function public.get_player_score_summary(p_player_id uuid)
returns table (
  high_score integer,
  lifetime_score integer
)
language sql
stable
as $$
  select
    coalesce(max(score), 0)::integer as high_score,
    coalesce(sum(score), 0)::integer as lifetime_score
  from public.session_players
  where player_id = p_player_id;
$$;
