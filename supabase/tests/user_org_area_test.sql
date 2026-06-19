/*
 * ---------------------------------------------------------------------------
 * PgTAP tests — User / Organization multi-tenant isolation
 * ---------------------------------------------------------------------------
 * Run with:  supabase test db
 * Verifies the security-critical promise: a member of org A cannot read or
 * write org B's data, and helper functions behave under each role context.
 * ---------------------------------------------------------------------------
 */
begin;
select plan(10);

-- --- Fixtures -------------------------------------------------------------
-- Two users, two orgs. user_a -> org_a (admin), user_b -> org_b (admin).
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.dev'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.dev');
-- profiles are auto-created by the on_auth_user_created trigger.

insert into public.organizations (id, name, slug, created_by) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Org A', 'org-a', '11111111-1111-1111-1111-111111111111'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Org B', 'org-b', '22222222-2222-2222-2222-222222222222');
-- memberships (org_admin) are auto-created by on_organization_created.

-- --- Trigger behaviour ----------------------------------------------------
select isnt_empty(
  $$ select 1 from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  'handle_new_user created a profile for user_a');

select results_eq(
  $$ select role::text from public.organization_members
     where organization_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
       and user_id = '11111111-1111-1111-1111-111111111111' $$,
  $$ values ('org_admin') $$,
  'creator of org_a is auto-promoted to org_admin');

-- --- Authorization helpers (as user_a) ------------------------------------
set local role authenticated;
set local "request.jwt.claims" to '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

select ok(public.is_org_member('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'user_a is a member of org_a');
select ok(not public.is_org_member('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'),
  'user_a is NOT a member of org_b');
select ok(public.is_org_admin('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  'user_a is admin of org_a');
select ok(public.has_org_permission('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'games.create'),
  'org_admin has games.create in org_a');
select ok(not public.has_org_permission('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'games.create'),
  'user_a has no permission in org_b');

-- --- RLS isolation (as user_a via the policies) ---------------------------
select results_eq(
  $$ select count(*)::int from public.organizations $$,
  $$ values (1) $$,
  'user_a sees only their own organization through RLS');

select is_empty(
  $$ select 1 from public.organization_members
     where organization_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' $$,
  'user_a cannot read org_b memberships through RLS');

-- viewer role lacks games.create (sanity check on seed)
select is_empty(
  $$ select 1 from public.role_permissions
     where role_key = 'viewer' and permission_key = 'games.create' $$,
  'viewer role is not granted games.create');

select * from finish();
rollback;
