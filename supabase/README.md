# Banco de Dados — Área de Usuários / Organizações (jogos_cscj)

Esquema multi-tenant em Supabase/PostgreSQL para a área de usuários do SaaS de jogos.
Estrutura conceitual: **Usuário → Organização → Membros → (futuro: Jogos → Turmas → Resultados)**.

## Como aplicar

```bash
# 1. Inicializar o Supabase no projeto (uma vez)
supabase init

# 2. Subir o stack local
supabase start

# 3. Aplicar as migrations
supabase db reset        # local: recria + roda todas as migrations + seed
# ou, contra um projeto remoto:
supabase db push

# 4. Rodar os testes de isolamento (PgTAP)
supabase test db
```

> Pré-requisito: [Supabase CLI](https://supabase.com/docs/guides/cli). Como o projeto
> ainda não tem `config.toml`, rode `supabase init` antes do primeiro `start`.

## Migrations (ordem de execução)

| Arquivo | O que faz |
|---|---|
| `20260615120000_enums_and_extensions.sql` | Enums (status, tipos, papéis, permissões) + trigger genérico de `updated_at`. |
| `20260615120100_tables.sql` | 7 tabelas com RLS habilitado, índices e constraints. |
| `20260615120200_helper_functions.sql` | Funções `SECURITY DEFINER` de autorização (evitam recursão de RLS). |
| `20260615120300_rls_policies.sql` | Políticas RLS por comando, por tabela. |
| `20260615120400_triggers.sql` | `handle_new_user`, `handle_new_organization`, timestamps. |
| `20260615120500_seed_roles_permissions.sql` | Seed de `roles` + `role_permissions` (espelha o `ROLE_PERMISSIONS` da spec). |

Rollback completo (destrói dados): `rollback/20260615_user_org_area_down.sql`.

## Tabelas

- **profiles** — 1:1 com `auth.users`, criada automaticamente no signup. Tem `is_super_admin`.
- **organizations** — o tenant (escola / museu / empresa / projeto cultural).
- **organization_members** — vínculo usuário ⇄ organização com `role` (papel da org).
- **invitations** — convites pendentes (aceitos por token assinado no servidor).
- **roles** / **role_permissions** — dados de referência que alimentam `has_org_permission()`.
- **audit_logs** — log append-only (sem políticas de update/delete).

## Decisões de arquitetura (divergências propositais da spec)

1. **`super_admin` não é um `member_role`.** Super admin é da plataforma, não de uma
   organização. Virou a flag `profiles.is_super_admin` + função `is_super_admin()`.
   Os papéis de organização são: `org_admin`, `creator`, `collaborator`, `viewer`.
2. **Permissões via tabela, não hardcoded.** `role_permissions` é a fonte da verdade —
   dá para ajustar o que cada papel pode fazer sem deploy. A função
   `has_org_permission(org_id, permission)` consulta essa tabela.
3. **Funções `SECURITY DEFINER` com `search_path` fixo.** É o que impede recursão de RLS:
   uma política em `organization_members` chama `is_org_member()`, que lê
   `organization_members` sem reentrar na política.
4. **Bootstrap do criador via trigger.** Quem cria a organização vira `org_admin`
   automaticamente — resolve o paradoxo "precisa ser admin para inserir membro".

## Mapa permissão → política RLS (resumo)

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | próprio / super admin / colega de org | próprio | próprio / super admin | — (cascade) |
| organizations | membro / super admin | qualquer autenticado (como si mesmo) | admin / super admin | admin / super admin |
| organization_members | próprio / membro da org / super admin | admin / super admin | admin / super admin | admin / super admin / próprio (sair) |
| invitations | admin / super admin | admin / super admin | admin / super admin | admin / super admin |
| roles, role_permissions | qualquer autenticado | super admin | super admin | super admin |
| audit_logs | admin / super admin | próprio (na sua org) | — | — |

## Próximos passos (fora desta entrega)

`games`, `classes`/`audiences`, `game_sessions`/`results` — cada um já nascerá com
`organization_id` e RLS reaproveitando os helpers acima. Frontend (auth, telas de
equipe, perfil, organização) ainda não foi tocado, conforme combinado.
