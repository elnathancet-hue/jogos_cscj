/*
 * ---------------------------------------------------------------------------
 * Migration: table & function grants
 * ---------------------------------------------------------------------------
 * RLS only narrows what a role can see AMONG rows it is already granted access
 * to. Without these table-level GRANTs the policies are moot. We grant broadly
 * to `authenticated` and let RLS do the row filtering. `anon` gets nothing
 * here — anonymous players will be handled by a dedicated future table.
 * ---------------------------------------------------------------------------
 */

grant usage on schema public to authenticated;

grant select, insert, update, delete on
  public.profiles,
  public.organizations,
  public.organization_members,
  public.invitations,
  public.audit_logs
to authenticated;

-- Reference data is read-only for normal users (writes blocked by RLS anyway).
grant select on public.roles, public.role_permissions to authenticated;

-- Authorization helpers must be callable by authenticated users.
grant execute on function
  public.is_super_admin(),
  public.is_org_member(uuid),
  public.get_org_role(uuid),
  public.is_org_admin(uuid),
  public.has_org_permission(uuid, public.app_permission),
  public.shares_org_with(uuid)
to authenticated;
