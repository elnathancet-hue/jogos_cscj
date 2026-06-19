"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { updateOrganizationSchema } from "@/lib/schema/organization.schema";
import type { FormState } from "@/lib/forms";

export async function updateOrganizationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const orgId = z.string().uuid().safeParse(formData.get("organizationId"));
  if (!orgId.success) return { error: "Organização inválida." };

  const parsed = updateOrganizationSchema.safeParse({
    name: formData.get("name"),
    organizationType: formData.get("organizationType"),
    primaryColor: formData.get("primaryColor"),
    logoUrl: formData.get("logoUrl"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const { name, organizationType, primaryColor, logoUrl } = parsed.data;
  const supabase = await createClient();

  // RLS garante que só org_admin/super admin consegue atualizar.
  const { data, error } = await supabase
    .from("organizations")
    .update({
      name,
      organization_type: organizationType,
      primary_color: primaryColor || null,
      logo_url: logoUrl || null,
    })
    .eq("id", orgId.data)
    .select("id");

  if (error) return { error: "Não foi possível salvar a organização." };
  if (!data || data.length === 0) {
    return { error: "Você não tem permissão para editar esta organização." };
  }

  revalidatePath("/dashboard/organization");
  revalidatePath("/dashboard");
  return { message: "Organização atualizada." };
}
