"use server";

import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import { updateProfileSchema } from "@/lib/schema/profile.schema";
import type { FormState } from "@/lib/forms";

export async function updateProfileAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone"),
    avatarUrl: formData.get("avatarUrl"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  const { fullName, phone, avatarUrl } = parsed.data;
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: fullName,
      phone: phone || null,
      avatar_url: avatarUrl || null,
    })
    .eq("id", user.id);

  if (error) return { error: "Não foi possível salvar o perfil." };

  revalidatePath("/dashboard/profile");
  revalidatePath("/dashboard");
  return { message: "Perfil atualizado." };
}
