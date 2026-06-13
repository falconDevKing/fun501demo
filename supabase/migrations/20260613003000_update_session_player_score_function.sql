create or replace function public.update_session_player_score(
  p_session_id uuid,
  p_player_id uuid,
  p_delta integer
)
returns table (
  success boolean,
  score integer,
  error_code text
)
language plpgsql
as $$
declare
  v_current_score integer;
  v_next_score integer;
begin
  select session_players.score
  into v_current_score
  from public.session_players
  where session_id = p_session_id
    and player_id = p_player_id
  for update;

  if not found then
    return query select false, 0, 'not_found'::text;
    return;
  end if;

  v_next_score := v_current_score + p_delta;

  if v_next_score < 0 then
    return query select false, v_current_score, 'negative_score'::text;
    return;
  end if;

  update public.session_players
  set score = v_next_score
  where session_id = p_session_id
    and player_id = p_player_id;

  return query select true, v_next_score, null::text;
end;
$$;
