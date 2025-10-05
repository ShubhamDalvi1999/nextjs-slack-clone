create or replace function public.can_create_channel(uid uuid)
returns boolean language sql stable as $$
  select count(*) < 5 from public.channels where created_by = uid and inserted_at >= now() - interval '1 hour'
$$;


