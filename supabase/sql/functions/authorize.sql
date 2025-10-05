create or replace function public.authorize(requested_permission public.app_permission)
returns boolean
language plpgsql security definer set search_path = public as $$
declare bind_permissions int; begin
  select count(*) into bind_permissions
  from public.role_permissions
  where permission = authorize.requested_permission
    and role = (auth.jwt() ->> 'user_role')::public.app_role;
  return bind_permissions > 0;
end; $$;


