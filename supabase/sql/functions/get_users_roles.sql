create or replace function public.get_users_roles()
returns table (user_id uuid, email text, username text, roles public.app_role[])
language plpgsql stable security definer set search_path = public, auth as $$ begin
  if (auth.jwt() ->> 'user_role') is distinct from 'admin' then raise exception 'forbidden: admin only'; end if;
  return query
  select u.id, (au.email)::text, u.username,
         coalesce(array_agg(ur.role) filter (where ur.role is not null), '{}'::public.app_role[])
  from public.users u
  join auth.users au on au.id = u.id
  left join public.user_roles ur on ur.user_id = u.id
  group by u.id, au.email, u.username
  order by au.email; end; $$;

grant execute on function public.get_users_roles() to authenticated;


