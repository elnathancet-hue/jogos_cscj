"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/forms";

export async function acceptInviteAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const token = z.string().uuid().safeParse(formData.get("token"));
  if (!token.success) return { error: "Convite inválido." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Entre na sua conta para aceitar o convite." };

  // A função raise mensagens já em português (convite inválido/expirado/etc.).
  const { error } = await supabase.rpc("accept_invitation", {
    p_token: token.data,
  });
  if (error) return { error: error.message || "Não foi possível aceitar o convite." };

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
