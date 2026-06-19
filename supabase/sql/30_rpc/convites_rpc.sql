/*
 * ===========================================================================
 * RPC — Convites
 * ===========================================================================
 * accept_invitation(token): o usuário logado aceita um convite e vira membro.
 * SECURITY DEFINER porque o convidado ainda NÃO é membro — o insert precisa
 * ignorar a política de RLS de organization_members (que exige ser admin).
 * Depende de: invitations, organization_members.
 * ===========================================================================
 */

create or replace function public.accept_invitation(p_token uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_inv public.invitations%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'É preciso estar autenticado para aceitar o convite.';
  end if;

  select * into v_inv
  from public.invitations
  where token = p_token
  for update;

  if not found then
    raise exception 'Convite inválido.';
  end if;

  if v_inv.status <> 'pending' then
    raise exception 'Este convite não está mais disponível.';
  end if;

  if v_inv.expires_at < now() then
    update public.invitations set status = 'expired' where id = v_inv.id;
    raise exception 'Convite expirado.';
  end if;

  -- Cria (ou reativa) o vínculo do usuário com a organização.
  insert into public.organization_members
    (organization_id, user_id, role, status, invited_by, joined_at)
  values
    (v_inv.organization_id, v_uid, v_inv.role, 'active', v_inv.invited_by, now())
  on conflict (organization_id, user_id) do update
    set status = 'active', role = excluded.role;

  update public.invitations
  set status = 'accepted', accepted_at = now()
  where id = v_inv.id;

  return v_inv.organization_id;
end;
$$;

comment on function public.accept_invitation(uuid) is
  'Usuário logado aceita um convite por token e vira membro da organização.';

grant execute on function public.accept_invitation(uuid) to authenticated;
