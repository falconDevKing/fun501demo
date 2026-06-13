create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  fallback_name text;
begin
  fallback_name := split_part(new.email, '@', 1);

  insert into public.players (auth_user_id, display_name, photo_url)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'display_name'), ''), fallback_name, 'Player'),
    nullif(btrim(new.raw_user_meta_data ->> 'photo_url'), '')
  )
  on conflict (auth_user_id) do update
  set
    display_name = excluded.display_name,
    photo_url = excluded.photo_url;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();
