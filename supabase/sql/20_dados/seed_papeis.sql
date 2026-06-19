/*
 * ===========================================================================
 * DADOS INICIAIS — papéis e permissões
 * ===========================================================================
 * Espelha o mapa ROLE_PERMISSIONS da especificação. Idempotente (ON CONFLICT).
 * super_admin NÃO é semeado aqui: é a flag profiles.is_super_admin e recebe
 * todas as permissões direto no has_org_permission().
 * ===========================================================================
 */

insert into public.roles (key, name, description) values
  ('org_admin',    'Administrador da Organização', 'Gerencia a organização, membros, jogos e relatórios.'),
  ('creator',      'Criador / Professor / Curador', 'Cria e edita os próprios jogos e vê seus resultados.'),
  ('collaborator', 'Colaborador',                   'Edita conteúdos permitidos; não exclui nem gerencia usuários.'),
  ('viewer',       'Leitor / Observador',           'Apenas visualiza jogos e relatórios.')
on conflict (key) do update
  set name = excluded.name,
      description = excluded.description;

-- org_admin: tudo, menos o que é exclusivo da plataforma.
insert into public.role_permissions (role_key, permission_key)
select 'org_admin', perm
from unnest(array[
  'users.view', 'users.invite', 'users.update', 'users.remove',
  'games.create', 'games.view', 'games.update', 'games.delete', 'games.publish',
  'results.view', 'organization.update', 'billing.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- creator: cria/edita/publica os próprios jogos + vê resultados.
insert into public.role_permissions (role_key, permission_key)
select 'creator', perm
from unnest(array[
  'games.create', 'games.view', 'games.update', 'games.publish', 'results.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- collaborator: só ver + editar jogos.
insert into public.role_permissions (role_key, permission_key)
select 'collaborator', perm
from unnest(array[
  'games.view', 'games.update'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;

-- viewer: somente leitura.
insert into public.role_permissions (role_key, permission_key)
select 'viewer', perm
from unnest(array[
  'games.view', 'results.view'
]::public.app_permission[]) as perm
on conflict (role_key, permission_key) do nothing;
