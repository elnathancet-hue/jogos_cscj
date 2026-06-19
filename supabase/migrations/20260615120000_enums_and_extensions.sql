/*
 * ---------------------------------------------------------------------------
 * Migration: enums and extensions
 * Area: Users / Organizations (SaaS core)
 * ---------------------------------------------------------------------------
 * Defines every enum used by the user/organization domain plus the generic
 * `updated_at` timestamp trigger function. Idempotent: safe to re-run.
 * ---------------------------------------------------------------------------
 */

-- pgcrypto provides gen_random_uuid() (available by default on Supabase).
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

-- Account lifecycle for a person on the platform.
do $$ begin
  create type public.user_status as enum ('active', 'inactive', 'blocked');
exception when duplicate_object then null; end $$;

-- What kind of institution an organization is.
do $$ begin
  create type public.organization_type as enum (
    'school', 'museum', 'company', 'cultural_project', 'other'
  );
exception when duplicate_object then null; end $$;

-- Organization lifecycle.
do $$ begin
  create type public.organization_status as enum ('active', 'inactive', 'suspended');
exception when duplicate_object then null; end $$;

-- Commercial plan attached to an organization.
do $$ begin
  create type public.organization_plan as enum ('free', 'starter', 'pro', 'enterprise');
exception when duplicate_object then null; end $$;

-- Roles a person can hold WITHIN an organization.
-- NOTE: platform super_admin is intentionally NOT here; it lives on
-- public.profiles.is_super_admin because it is platform-wide, not org-scoped.
do $$ begin
  create type public.member_role as enum (
    'org_admin', 'creator', 'collaborator', 'viewer'
  );
exception when duplicate_object then null; end $$;

-- Membership lifecycle within an organization.
do $$ begin
  create type public.member_status as enum ('active', 'invited', 'removed');
exception when duplicate_object then null; end $$;

-- Invitation lifecycle.
do $$ begin
  create type public.invitation_status as enum (
    'pending', 'accepted', 'expired', 'revoked'
  );
exception when duplicate_object then null; end $$;

-- Granular permissions. Extend by adding values (enums are append-only).
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
-- Generic trigger: keep updated_at in sync on every UPDATE.
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
  'Generic BEFORE INSERT/UPDATE trigger that maintains created_at/updated_at.';
