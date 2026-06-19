"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/auth/org";
import { classFormSchema } from "@/lib/schema/class.schema";
import type { FormState } from "@/lib/forms";

const MANAGER_ROLES = ["org_admin", "creator"] as const;

export async function createClassAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = classFormSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const active = await getActiveOrganization();
  if (!active) return { error: "Selecione uma organização primeiro." };
  if (!MANAGER_ROLES.includes(active.role as (typeof MANAGER_ROLES)[number])) {
    return { error: "Você não tem permissão para criar turmas." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("classes").insert({
    organization_id: active.org.id,
    name: parsed.data.name,
    description: parsed.data.description || null,
    created_by: user?.id ?? null,
  });

  if (error) return { error: "Não foi possível criar a turma." };

  revalidatePath("/dashboard/classes");
  return { message: "Turma criada." };
}

export async function deleteClassAction(formData: FormData): Promise<void> {
  const classId = z.string().uuid().safeParse(formData.get("classId"));
  if (!classId.success) return;

  const supabase = await createClient();
  await supabase.from("classes").delete().eq("id", classId.data);

  revalidatePath("/dashboard/classes");
}
