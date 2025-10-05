create or replace function public.custom_access_token_hook(event jsonb)
returns jsonb language plpgsql stable as $$
  declare claims jsonb; user_role public.app_role; begin
    select role into user_role from public.user_roles
    where user_id = (event->>'user_id')::uuid
    order by case role when 'admin' then 1 when 'moderator' then 2 when 'user' then 3 else 99 end limit 1;
    claims := event->'claims';
    if user_role is not null then
      claims := jsonb_set(claims, '{user_role}', to_jsonb(user_role));
    else
      claims := jsonb_set(claims, '{user_role}', 'null');
    end if;
    event := jsonb_set(event, '{claims}', claims);
    return event;
  end; $$;


