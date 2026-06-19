/*
 * ===========================================================================
 * BASE — Extensões e Tipos
 * ===========================================================================
 * Define as extensões necessárias, todos os tipos (enums) do domínio de
 * Usuários/Organizações e o gatilho genérico de timestamps.
 * Idempotente: pode rodar quantas vezes quiser.
 * ===========================================================================
 */

-- gen_random_uuid() vem do pgcrypto (já disponível no Supabase).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Tipos (enums)
-- ---------------------------------------------------------------------------

-- Situação de uma pessoa na plataforma.
do $$ begin
  create type public.user_status as enum ('active', 'inactive', 'blocked');
exception when duplicate_object then null; end $$;

-- Tipo de instituição que a organização representa.
do $$ begin
  create type public.organization_type as enum (
    'school', 'museum', 'company', 'cultural_project', 'other'
  );
exception when duplicate_object then null; end $$;

-- Situação da organização.
do $$ begin
  create type public.organization_status as enum ('active', 'inactive', 'suspended');
exception when duplicate_object then null; end $$;

-- Plano comercial da organização.
do $$ begin
  create type public.organization_plan as enum ('free', 'starter', 'pro', 'enterprise');
exception when duplicate_object then null; end $$;

-- Papéis que uma pessoa pode ter DENTRO de uma organização.
-- OBS: o super admin da plataforma NÃO entra aqui — ele é a flag
-- public.profiles.is_super_admin, porque é global, não escopado por organização.
do $$ begin
  create type public.member_role as enum (
    'org_admin', 'creator', 'collaborator', 'viewer'
  );
exception when duplicate_object then null; end $$;

-- Situação do vínculo de um membro com a organização.
do $$ begin
  create type public.member_status as enum ('active', 'invited', 'removed');
exception when duplicate_object then null; end $$;

-- Situação de um convite.
do $$ begin
  create type public.invitation_status as enum (
    'pending', 'accepted', 'expired', 'revoked'
  );
exception when duplicate_object then null; end $$;

-- Permissões granulares. Para estender, basta adicionar valores (enums só crescem).
do $$ begin
  create type public.app_permission as enum (
    'users.view',
    'users.invite',
    'users.update',
    'users.remove',
    'games.create',
    'games.view',
    'games.update',
    'games.delete',
    'games.publish',
    'results.view',
    'organization.update',
    'billing.view'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Gatilho genérico: mantém created_at / updated_at automaticamente.
-- ---------------------------------------------------------------------------
create or replace function public.trigger_set_timestamps()
returns trigger
language plpgsql
as $$
begin
  if (tg_op = 'INSERT') then
    new.created_at := coalesce(new.created_at, now());
    new.updated_at := coalesce(new.updated_at, now());
  else
    new.updated_at := now();
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

comment on function public.trigger_set_timestamps() is
  'Gatilho genérico BEFORE INSERT/UPDATE que mantém created_at/updated_at.';
