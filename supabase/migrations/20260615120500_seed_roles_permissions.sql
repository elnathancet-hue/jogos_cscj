/*
 * ---------------------------------------------------------------------------
 * Migration: seed roles + role_permissions (reference data)
 * ---------------------------------------------------------------------------
 * Mirrors the ROLE_PERMISSIONS map from the spec. Idempotent via ON CONFLICT.
 * super_admin is NOT seeded here: it is the platform-wide profiles.is_super_admin
 * flag and is granted every permission directly by has_org_permission().
 * ---------------------------------------------------------------------------
 */

insert into public.roles (key, name, description) values
  ('org_admin',    'Administrador da Organização', 'Gerencia a organização, membros, jogos e relatórios.'),
  ('creator',      'Criador / Professor / Curador', 'Cria e edita os próprios jogos e vê seus resultados.'),
  ('collaborator', 'Colaborador',                   'Edita conteúdos permitidos; não exclui nem gerencia usuários.'),
  ('viewer',       'Leitor / Observador',           'Apenas visualiza jogos e relatórios.')
on conflict (key) do update
  set name = excluded.name,
      description = excluded.description;

-- org_admin: everything except platform-only concerns.
insert into public.role_permissions (role_key, permission_key)
select 'org_admin', perm
from unnest(array[
  'users.view', 'users.invite', 'users.update', 'users.remove',
  'games.create', 'games.view', 'games.update', 'games.delete', 'games.publish',
  'results.view', 'organization.update', 'billing.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- creator: create/edit/publish own games + view results.
insert into public.role_permissions (role_key, permission_key)
select 'creator', perm
from unnest(array[
  'games.create', 'games.view', 'games.update', 'games.publish', 'results.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- collaborator: view + edit games only.
insert into public.role_permissions (role_key, permission_key)
select 'collaborator', perm
from unnest(array[
  'games.view', 'games.update'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- viewer: read-only.
insert into public.role_permissions (role_key, permission_key)
select 'viewer', perm
from unnest(array[
  'games.view', 'results.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;
