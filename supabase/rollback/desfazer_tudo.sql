/*
 * ===========================================================================
 * ROLLBACK — Área de Usuários / Organizações
 * ===========================================================================
 * NÃO roda automaticamente. Cole no SQL Editor para desfazer TUDO que o
 * aplicar_tudo.sql criou. Remove na ordem de dependência.
 * ATENÇÃO: apaga todos os dados dessas tabelas.
 * ===========================================================================
 */

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_organization_created on public.organizations;

drop table if exists public.audit_logs cascade;
drop table if exists public.role_permissions cascade;
drop table if exists public.roles cascade;
drop table if exists public.invitations cascade;
drop table if exists public.organization_members cascade;
drop table if exists public.organizations cascade;
drop table if exists public.profiles cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_new_organization() cascade;
drop function if exists public.shares_org_with(uuid) cascade;
drop function if exists public.has_org_permission(uuid, public.app_permission) cascade;
drop function if exists public.is_org_admin(uuid) cascade;
drop function if exists public.get_org_role(uuid) cascade;
drop function if exists public.is_org_member(uuid) cascade;
drop function if exists public.is_super_admin() cascade;
drop function if exists public.trigger_set_timestamps() cascade;

drop type if exists public.app_permission;
drop type if exists public.invitation_status;
drop type if exists public.member_status;
drop type if exists public.member_role;
drop type if exists public.organization_plan;
drop type if exists public.organization_status;
drop type if exists public.organization_type;
drop type if exists public.user_status;
