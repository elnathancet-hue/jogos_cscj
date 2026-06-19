"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/auth/org";
import {
  inviteMemberSchema,
  changeRoleSchema,
  memberIdSchema,
  invitationIdSchema,
} from "@/lib/schema/team.schema";
import type { FormState } from "@/lib/forms";

/** Convida um membro: cria um convite pendente (compartilhado por link). */
export async function inviteMemberAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = inviteMemberSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const active = await getActiveOrganization();
  if (!active) return { error: "Organização não encontrada." };
  if (active.role !== "org_admin") {
    return { error: "Apenas administradores podem convidar." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("invitations").insert({
    organization_id: active.org.id,
    email: parsed.data.email.toLowerCase(),
    role: parsed.data.role,
    invited_by: user?.id ?? null,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Já existe um convite pendente para este e-mail." };
    }
    return { error: "Não foi possível criar o convite." };
  }

  revalidatePath("/dashboard/team");
  return { message: `Convite criado para ${parsed.data.email}. Copie o link abaixo.` };
}

/** Altera o papel de um membro (org_admin). */
export async function changeRoleAction(formData: FormData): Promise<void> {
  const parsed = changeRoleSchema.safeParse({
    memberId: formData.get("memberId"),
    role: formData.get("role"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("organization_members")
    .update({ role: parsed.data.role })
    .eq("id", parsed.data.memberId);

  revalidatePath("/dashboard/team");
}

/** Remove um membro da organização (org_admin). */
export async function removeMemberAction(formData: FormData): Promise<void> {
  const parsed = memberIdSchema.safeParse({ memberId: formData.get("memberId") });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase.from("organization_members").delete().eq("id", parsed.data.memberId);

  revalidatePath("/dashboard/team");
}

/** Revoga um convite pendente (org_admin). */
export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const parsed = invitationIdSchema.safeParse({
    invitationId: formData.get("invitationId"),
  });
  if (!parsed.success) return;

  const supabase = await createClient();
  await supabase
    .from("invitations")
    .update({ status: "revoked" })
    .eq("id", parsed.data.invitationId);

  revalidatePath("/dashboard/team");
}
