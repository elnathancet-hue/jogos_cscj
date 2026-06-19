/*
 * ---------------------------------------------------------------------------
 * Migration: Row Level Security policies
 * ---------------------------------------------------------------------------
 * Every table has RLS enabled (previous migration). With no policy, a table
 * is deny-all. These policies open precisely the needed access paths and
 * nothing more. All multi-tenant checks go through the SECURITY DEFINER
 * helpers so there is no policy recursion.
 *
 * Policies are split per command (select/insert/update/delete) for clarity
 * and dropped-then-created so this migration is idempotent.
 * ---------------------------------------------------------------------------
 */

-- ===========================================================================
-- profiles
-- ===========================================================================
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated
  using (
    id = (select auth.uid())
    or public.is_super_admin()
    or public.shares_org_with(id)
  );

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) or public.is_super_admin())
  with check (id = (select auth.uid()) or public.is_super_admin());

-- No delete policy: profiles are removed only via auth.users cascade.

-- ===========================================================================
-- organizations
-- ===========================================================================
drop policy if exists organizations_select on public.organizations;
create policy organizations_select on public.organizations
  for select to authenticated
  using (public.is_org_member(id) or public.is_super_admin());

-- Any authenticated user can create an organization, but only as themselves.
-- A trigger immediately adds them as org_admin (see triggers migration).
drop policy if exists organizations_insert on public.organizations;
create policy organizations_insert on public.organizations
  for insert to authenticated
  with check (created_by = (select auth.uid()));

drop policy if exists organizations_update on public.organizations;
create policy organizations_update on public.organizations
  for update to authenticated
  using (public.is_org_admin(id) or public.is_super_admin())
  with check (public.is_org_admin(id) or public.is_super_admin());

drop policy if exists organizations_delete on public.organizations;
create policy organizations_delete on public.organizations
  for delete to authenticated
  using (public.is_org_admin(id) or public.is_super_admin());

-- ===========================================================================
-- organization_members
-- ===========================================================================
drop policy if exists organization_members_select on public.organization_members;
create policy organization_members_select on public.organization_members
  for select to authenticated
  using (
    user_id = (select auth.uid())
    or public.is_org_member(organization_id)
    or public.is_super_admin()
  );

drop policy if exists organization_members_insert on public.organization_members;
create policy organization_members_insert on public.organization_members
  for insert to authenticated
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists organization_members_update on public.organization_members;
create policy organization_members_update on public.organization_members
  for update to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin())
  with check (public.is_org_admin(organization_id) or public.is_super_admin());

-- Admins manage anyone; a member may remove themselves (leave the org).
drop policy if exists organization_members_delete on public.organization_members;
create policy organization_members_delete on public.organization_members
  for delete to authenticated
  using (
    public.is_org_admin(organization_id)
    or public.is_super_admin()
    or user_id = (select auth.uid())
  );

-- ===========================================================================
-- invitations
-- Visible/manageable only by org admins. Acceptance happens server-side via
-- the signed token (service role / edge function), not through these policies.
-- ===========================================================================
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

-- ===========================================================================
-- roles + role_permissions — read-only reference data for everyone signed in.
-- Only super admins may change them.
-- ===========================================================================
drop policy if exists roles_select on public.roles;
create policy roles_select on public.roles
  for select to authenticated using (true);

drop policy if exists roles_write on public.roles;
create policy roles_write on public.roles
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

drop policy if exists role_permissions_select on public.role_permissions;
create policy role_permissions_select on public.role_permissions
  for select to authenticated using (true);

drop policy if exists role_permissions_write on public.role_permissions;
create policy role_permissions_write on public.role_permissions
  for all to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

-- ===========================================================================
-- audit_logs — admins read their org's logs; members append their own.
-- No update/delete policies: the log is immutable.
-- ===========================================================================
drop policy if exists audit_logs_select on public.audit_logs;
create policy audit_logs_select on public.audit_logs
  for select to authenticated
  using (public.is_org_admin(organization_id) or public.is_super_admin());

drop policy if exists audit_logs_insert on public.audit_logs;
create policy audit_logs_insert on public.audit_logs
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and (organization_id is null or public.is_org_member(organization_id))
  );
