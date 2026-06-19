/*
 * ===========================================================================
 * ENTIDADE — membros (public.organization_members)
 * ===========================================================================
 * Vínculo usuário ⇄ organização carregando o papel (role) dentro da org.
 * Um usuário aparece no máximo uma vez por organização.
 * Depende de: organizations.
 * ===========================================================================
 */

create table if not exists public.organization_members (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.member_role not null default 'viewer',
  status          public.member_status not null default 'active',
  invited_by      uuid references auth.users(id) on delete set null,
  joined_at       timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint organization_members_unique unique (organization_id, user_id)
);

comment on table public.organization_members is
  'Junção profiles <-> organizations com o papel escopado por organização.';

create index if not exists organization_members_org_idx
  on public.organization_members (organization_id);
create index if not exists organization_members_user_idx
  on public.organization_members (user_id);

alter table public.organization_members enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Vê: o próprio vínculo / membros da mesma organização / super admin.
drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_org_member(organization_id)
    or public.is_super_admin()
  );

-- Insere / atualiza: admin da organização ou super admin.
drop policy if exists organization_members_insert on public.organization_members;
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists organization_members_update on public.organization_members;
create policy organization_members_update on public.organization_members
  for update to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin())
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

-- Exclui: admin / super admin / o próprio (sair da organização).
drop policy if exists organization_members_delete on public.organization_members;
create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (
    public.is_org_admin(organization_id)
    or public.is_super_admin()
    or user_id = (select auth.uid())
  );

-- --- Grants ----------------------------------------------------------------
grant select, insert, update, delete on public.organization_members to authenticated;
