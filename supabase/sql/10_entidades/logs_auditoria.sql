/*
 * ===========================================================================
 * ENTIDADE — logs de auditoria (public.audit_logs)
 * ===========================================================================
 * Registro append-only de ações importantes. Sem políticas de UPDATE/DELETE
 * de propósito: o log é imutável.
 * Depende de: organizations.
 * ===========================================================================
 */

create table if not exists public.audit_logs (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete set null,
  user_id         uuid references auth.users(id) on delete set null,
  action          varchar(120) not null,
  entity_type     varchar(80),
  entity_id       uuid,
  metadata        jsonb not null default '{}'::jsonb,
  ip_address      inet,
  created_at      timestamptz not null default now()
);

comment on table public.audit_logs is
  'Log de atividade append-only. Sem políticas de update/delete por design.';

create index if not exists audit_logs_org_idx
  on public.audit_logs (organization_id, created_at desc);
create index if not exists audit_logs_user_idx
  on public.audit_logs (user_id, created_at desc);

alter table public.audit_logs enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Lê: admin da organização ou super admin.
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin());

-- Insere: o próprio usuário, dentro de uma organização da qual é membro.
drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (organization_id is null or public.is_org_member(organization_id))
  );

-- --- Grants ----------------------------------------------------------------
-- Sem delete/update: o log é imutável.
grant select, insert on public.audit_logs to authenticated;
