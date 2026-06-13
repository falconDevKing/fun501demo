alter table public.players
add column if not exists photo_public_id text;

alter table public.sessions
add column if not exists video_public_id text,
add column if not exists video_source text not null default 'provided';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'sessions_video_source_check'
      and conrelid = 'public.sessions'::regclass
  ) then
    alter table public.sessions
    add constraint sessions_video_source_check
    check (video_source in ('uploaded', 'provided'));
  end if;
end;
$$;
