create or replace function public.set_user_role(target_email text, target_role public.app_role, grant_role boolean)
returns void language plpgsql security definer set search_path = public, auth as $$
declare target_id uuid; caller_id uuid; caller_role text; begin
  caller_role := (auth.jwt() ->> 'user_role');
  caller_id := auth.uid();
  if caller_role is distinct from 'admin' then raise exception 'forbidden: admin only'; end if;
  select id into target_id from auth.users where email = target_email;
  if target_id is null then raise exception 'user_not_found'; end if;
  if target_id = caller_id then raise exception 'cannot_modify_self'; end if;
  if grant_role then
    insert into public.user_roles (user_id, role) values (target_id, target_role) on conflict do nothing;
  else
    delete from public.user_roles where user_id = target_id and role = target_role;
  end if; end; $$;

grant execute on function public.set_user_role(text, public.app_role, boolean) to authenticated;


