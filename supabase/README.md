# Banco de Dados — Área de Usuários / Organizações

Esquema multi-tenant (Supabase/PostgreSQL) da área de usuários do SaaS de jogos.
Modelo conceitual: **Usuário → Organização → Membros → (futuro: Jogos → Turmas → Resultados)**.

## Como aplicar (sem CLI)

1. Abra o **SQL Editor** do projeto no dashboard do Supabase.
2. Cole o conteúdo de **`aplicar_tudo.sql`** e clique **Run**.

É idempotente — pode rodar de novo sem quebrar. Para desfazer tudo, use
`rollback/desfazer_tudo.sql` (apaga os dados).

## Organização dos arquivos (por entidade)

```
supabase/
├── aplicar_tudo.sql          ← bundle pronto pra colar (GERADO, não editar)
├── _gerar_bundle.mjs         ← regenera o bundle:  node supabase/_gerar_bundle.mjs
├── sql/
│   ├── 00_base/
│   │   ├── 01_extensoes_e_tipos.sql     ← extensões + enums + timestamps
│   │   └── 02_funcoes_autorizacao.sql   ← is_org_member, has_org_permission, ...
│   ├── 10_entidades/                    ← 1 arquivo por tabela (tabela+RLS+índices+grants)
│   │   ├── perfis.sql
│   │   ├── organizacoes.sql
│   │   ├── papeis_permissoes.sql
│   │   ├── membros.sql
│   │   ├── convites.sql
│   │   └── logs_auditoria.sql
│   ├── 20_dados/
│   │   └── seed_papeis.sql              ← papéis + permissões iniciais
│   └── 99_gatilhos.sql                  ← handle_new_user, handle_new_organization
├── rollback/desfazer_tudo.sql
└── tests/user_org_area_test.sql         ← teste PgTAP de isolamento (supabase test db)
```

### Fluxo de manutenção

1. Edite o arquivo da entidade em `sql/` (ex.: mexer em organizações → `sql/10_entidades/organizacoes.sql`).
2. Rode `node supabase/_gerar_bundle.mjs` para regenerar `aplicar_tudo.sql`.
3. Cole o bundle atualizado no SQL Editor.

> **Por que a ordem importa:** as funções de autorização (`00_base/02`) são
> referenciadas pelas políticas RLS de várias tabelas, então são criadas antes
> das tabelas (com `check_function_bodies = off`). O gerador já cuida da ordem.

## Tabelas

| Tabela | Papel |
|---|---|
| `profiles` | 1:1 com `auth.users`, criada no cadastro. Tem `is_super_admin`. |
| `organizations` | O tenant (escola / museu / empresa / projeto cultural). |
| `organization_members` | Vínculo usuário ⇄ organização com o papel (`role`). |
| `invitations` | Convites pendentes (aceitos por token no servidor). |
| `roles` / `role_permissions` | Dados de referência que alimentam `has_org_permission()`. |
| `audit_logs` | Log append-only (sem update/delete). |

## Decisões de arquitetura (divergências propositais da spec)

1. **`super_admin` não é um `member_role`.** É da plataforma, não de uma
   organização → virou a flag `profiles.is_super_admin` + função `is_super_admin()`.
   Papéis de organização: `org_admin`, `creator`, `collaborator`, `viewer`.
2. **Permissões via tabela `role_permissions`**, não hardcoded — dá pra ajustar
   o que cada papel pode sem deploy.
3. **Funções `SECURITY DEFINER` com `search_path` fixo** — evita recursão de RLS.
4. **Gatilho de bootstrap** — quem cria a organização já entra como `org_admin`.

## Mapa permissão → política RLS (resumo)

| Tabela | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| profiles | próprio / super admin / colega de org | próprio | próprio / super admin | — (cascade) |
| organizations | membro / super admin | autenticado (como si mesmo) | admin / super admin | admin / super admin |
| organization_members | próprio / membro / super admin | admin / super admin | admin / super admin | admin / super admin / próprio (sair) |
| invitations | admin / super admin | admin / super admin | admin / super admin | admin / super admin |
| roles, role_permissions | autenticado | super admin | super admin | super admin |
| audit_logs | admin / super admin | próprio (na sua org) | — | — |
