/*
 * ===========================================================================
 * ENTIDADE — convites (public.invitations)
 * ===========================================================================
 * Convites pendentes para entrar numa organização. A aceitação acontece no
 * servidor via token assinado (service role / edge function), não pela RLS.
 * Depende de: organizations.
 * ===========================================================================
 */

create table if not exists public.invitations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email           varchar(320) not null,
  role            public.member_role not null default 'viewer',
  token           uuid not null default gen_random_uuid() unique,
  status          public.invitation_status not null default 'pending',
  invited_by      uuid references auth.users(id) on delete set null,
  expires_at      timestamptz not null default (now() + interval '7 days'),
  accepted_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  constraint invitations_email_format
    check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
);

comment on table public.invitations is
  'Convites pendentes da organização. Aceitos via token assinado, não por RLS.';

-- Só um convite *pendente* por (organização, e-mail); reenviar revoga/substitui.
create unique index if not exists invitations_pending_unique
  on public.invitations (organization_id, lower(email))
  where status = 'pending';
create index if not exists invitations_org_idx
  on public.invitations (organization_id);

alter table public.invitations enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Visível/gerenciável só por admin da organização ou super admin.
drop policy if exists invitations_select on public.invitations;
create policy invitations_select on public.invitations
  for select to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists invitations_insert on public.invitations;
create policy invitations_insert on public.invitations
  for insert to authenticated
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists invitations_update on public.invitations;
create policy invitations_update on public.invitations
  for update to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin())
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists invitations_delete on public.invitations;
create policy invitations_delete on public.invitations
  for delete to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin());

-- --- Grants ----------------------------------------------------------------
grant select, insert, update, delete on public.invitations to authenticated;
