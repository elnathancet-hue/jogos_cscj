/*
 * ===========================================================================
 * BASE — Funções de Autorização
 * ===========================================================================
 * Funções usadas pelas políticas RLS de várias tabelas. Por isso são criadas
 * AQUI, antes das tabelas: 'set check_function_bodies = off' permite criá-las
 * sem que as tabelas ainda existam. Em tempo de execução as tabelas já estarão
 * presentes.
 *
 * Todas são SECURITY DEFINER com search_path fixo — é isso que evita recursão
 * de RLS: uma política em organization_members pode chamar is_org_member(),
 * que lê organization_members SEM reentrar na política.
 * São STABLE (não escrevem) para poderem ser inlinadas nas políticas.
 * ===========================================================================
 */

set check_function_bodies = off;

-- O usuário atual é super admin da plataforma?
create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_super_admin = true
  );
$$;

-- O usuário atual é membro ATIVO da organização informada?
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

-- Papel do usuário atual na organização (null se não for membro).
create or replace function public.get_org_role(org_id uuid)
returns public.member_role
language sql
stable
security definer
set search_path = public
as $$
  select m.role
  from public.organization_members m
  where m.organization_id = org_id
    and m.user_id = auth.uid()
    and m.status = 'active'
  limit 1;
$$;

-- O usuário atual é admin da organização informada?
create or replace function public.is_org_admin(org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.get_org_role(org_id) = 'org_admin';
$$;

-- O usuário atual tem uma permissão específica na organização?
-- Super admins têm todas as permissões implicitamente.
create or replace function public.has_org_permission(
  org_id uuid,
  permission public.app_permission
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    public.is_super_admin()
    or exists (
      select 1
      from public.organization_members m
      join public.role_permissions rp on rp.role_key = m.role
      where m.organization_id = org_id
        and m.user_id = auth.uid()
        and m.status = 'active'
        and rp.permission_key = permission
    );
$$;

-- O usuário atual e o target_user compartilham alguma organização?
-- Usada para colegas de organização poderem ver o perfil um do outro.
create or replace function public.shares_org_with(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_members me
    join public.organization_members them
      on them.organization_id = me.organization_id
    where me.user_id = auth.uid()
      and me.status = 'active'
      and them.user_id = target_user
      and them.status = 'active'
  );
$$;

reset check_function_bodies;

comment on function public.is_super_admin() is 'Usuário atual é super admin da plataforma.';
comment on function public.is_org_member(uuid) is 'Usuário atual é membro ativo da organização.';
comment on function public.get_org_role(uuid) is 'Papel do usuário atual na organização, ou null.';
comment on function public.is_org_admin(uuid) is 'Usuário atual é org_admin da organização.';
comment on function public.has_org_permission(uuid, public.app_permission) is
  'Usuário atual tem a permissão na organização (super admin sempre verdadeiro).';
comment on function public.shares_org_with(uuid) is
  'Usuário atual compartilha um vínculo ativo com o target_user.';

-- ---------------------------------------------------------------------------
-- Permissões de execução (RLS atua por cima dos GRANTs).
-- ---------------------------------------------------------------------------
grant usage on schema public to authenticated;

grant execute on function
  public.is_super_admin(),
  public.is_org_member(uuid),
  public.get_org_role(uuid),
  public.is_org_admin(uuid),
  public.has_org_permission(uuid, public.app_permission),
  public.shares_org_with(uuid)
to authenticated;
