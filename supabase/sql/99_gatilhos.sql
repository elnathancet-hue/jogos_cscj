/*
 * ===========================================================================
 * GATILHOS
 * ===========================================================================
 *  1. timestamps          — mantém created_at/updated_at em cada tabela.
 *  2. handle_new_user      — cria public.profiles quando alguém se cadastra.
 *  3. handle_new_organization — torna quem cria a org o primeiro org_admin.
 * Rodam por último, quando todas as tabelas e funções já existem.
 * ===========================================================================
 */

-- ---------------------------------------------------------------------------
-- 1. Manutenção de updated_at
-- ---------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'organizations', 'organization_members', 'invitations'
  ]
  loop
    execute format('drop trigger if exists set_timestamps on public.%I;', t);
    execute format(
      'create trigger set_timestamps before insert or update on public.%I
         for each row execute function public.trigger_set_timestamps();', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Cria um perfil para cada novo usuário do auth e, se o cadastro trouxer
--    'org_name' nos metadados, já cria a organização (o gatilho
--    handle_new_organization torna o usuário org_admin automaticamente).
--    Roda como SECURITY DEFINER, então funciona mesmo com confirmação de
--    e-mail ligada (sem depender de sessão).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_name text := nullif(trim(new.raw_user_meta_data ->> 'org_name'), '');
  v_org_type public.organization_type;
  v_slug     text;
begin
  -- Perfil (1:1 com auth.users).
  insert into public.profiles (id, full_name, email, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.email,
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;

  -- Organização (opcional, vinda do cadastro).
  if v_org_name is not null then
    v_org_type := case
      when (new.raw_user_meta_data ->> 'org_type')
           in ('school', 'museum', 'company', 'cultural_project', 'other')
      then (new.raw_user_meta_data ->> 'org_type')::public.organization_type
      else 'other'
    end;

    -- slug a partir do nome + sufixo do id para garantir unicidade.
    v_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    if v_slug = '' then v_slug := 'org'; end if;
    v_slug := v_slug || '-' || substr(new.id::text, 1, 8);

    insert into public.organizations (name, slug, organization_type, created_by)
    values (v_org_name, v_slug, v_org_type, new.id);
    -- handle_new_organization adiciona o vínculo org_admin automaticamente.
  end if;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 3. Quem cria a organização vira o primeiro org_admin.
--    SECURITY DEFINER para o insert do membro ignorar a política de RLS
--    (que exigiria o usuário JÁ ser admin).
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_organization()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.organization_members
      (organization_id, user_id, role, status, joined_at)
    values
      (new.id, new.created_by, 'org_admin', 'active', now())
    on conflict (organization_id, user_id) do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_organization_created on public.organizations;
create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_organization();
