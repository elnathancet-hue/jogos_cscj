/*
 * ===========================================================================
 * ENTIDADE — turmas / públicos (public.classes)
 * ===========================================================================
 * Agrupa jogadores (turma de escola, grupo de museu, público de evento).
 * Tem um "code" curto para a entrada identificada do jogador.
 * Depende de: organizations + funções de autorização.
 * ===========================================================================
 */

create table if not exists public.classes (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            varchar(120) not null,
  description     text,
  code            varchar(12) not null unique
                    default upper(substr(md5(gen_random_uuid()::text), 1, 6)),
  created_by      uuid references auth.users(id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.classes is
  'Turmas/públicos da organização. code = entrada identificada do jogador.';

create index if not exists classes_org_idx
  on public.classes (organization_id, created_at desc);

alter table public.classes enable row level security;

-- --- Políticas RLS ---------------------------------------------------------
-- Vê: qualquer membro da organização.
drop policy if exists classes_select on public.classes;
create policy classes_select on public.classes
  for select to authenticated
  using (public.is_org_member(organization_id) or public.is_super_admin());

-- Cria: admin ou criador, como ele mesmo.
drop policy if exists classes_insert on public.classes;
create policy classes_insert on public.classes
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (
      public.get_org_role(organization_id) in ('org_admin', 'creator')
      or public.is_super_admin()
    )
  );

-- Edita/exclui: admin (qualquer) ou o criador (próprias).
drop policy if exists classes_update on public.classes;
create policy classes_update on public.classes
  for update to authenticated
  using (
    public.is_super_admin()
    or public.is_org_admin(organization_id)
    or created_by = (select auth.uid())
  )
  with check (
    public.is_super_admin()
    or public.is_org_admin(organization_id)
    or created_by = (select auth.uid())
  );

drop policy if exists classes_delete on public.classes;
create policy classes_delete on public.classes
  for delete to authenticated
  using (
    public.is_super_admin()
    or public.is_org_admin(organization_id)
    or created_by = (select auth.uid())
  );

-- --- Grants ----------------------------------------------------------------
grant select, insert, update, delete on public.classes to authenticated;

-- --- Timestamps ------------------------------------------------------------
drop trigger if exists set_timestamps on public.classes;
create trigger set_timestamps before insert or update on public.classes
  for each row execute function public.trigger_set_timestamps();
