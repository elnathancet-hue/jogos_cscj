"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getMyOrganizations, ACTIVE_ORG_COOKIE } from "@/lib/auth/org";
import { ORGANIZATION_TYPES } from "@/lib/schema/auth.schema";
import type { FormState } from "@/lib/forms";

const createOrgSchema = z.object({
  name: z.string().min(2, "Informe o nome da organização."),
  organizationType: z.enum(ORGANIZATION_TYPES),
});

/** Define qual organização está ativa (cookie de 1 ano). */
export async function setActiveOrganizationAction(formData: FormData): Promise<void> {
  const orgId = z.string().uuid().safeParse(formData.get("orgId"));
  if (!orgId.success) return;

  // Só permite ativar uma organização da qual o usuário é membro.
  const all = await getMyOrganizations();
  if (!all.some((m) => m.org.id === orgId.data)) return;

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, orgId.data, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
}

/** Cria uma nova organização (o criador vira org_admin via gatilho) e a ativa. */
export async function createOrganizationAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = createOrgSchema.safeParse({
    name: formData.get("name"),
    organizationType: formData.get("organizationType"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Sessão expirada. Entre novamente." };

  // slug a partir do nome + sufixo aleatório para garantir unicidade.
  const base =
    parsed.data.name
      .toLowerCase()
      .normalize("NFD") // separa acentos; os combinantes caem no filtro abaixo
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "org";
  const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name: parsed.data.name,
      slug,
      organization_type: parsed.data.organizationType,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !data) return { error: "Não foi possível criar a organização." };

  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_ORG_COOKIE, data.id, {
    path: "/",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 365,
  });

  revalidatePath("/", "layout");
  redirect("/dashboard");
}
