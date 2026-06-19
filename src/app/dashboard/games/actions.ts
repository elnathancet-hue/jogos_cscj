"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/auth/org";
import { hasPermission } from "@/lib/auth/permissions";
import { gameFormSchema, GAME_STATUSES } from "@/lib/schema/game.schema";
import type { FormState } from "@/lib/forms";

export async function createGameAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = gameFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    coverImageUrl: formData.get("coverImageUrl"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const active = await getActiveOrganization();
  if (!active) return { error: "Selecione uma organização primeiro." };
  if (!hasPermission(active.role, "games.create")) {
    return { error: "Você não tem permissão para criar jogos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("games").insert({
    organization_id: active.org.id,
    created_by: user?.id ?? null,
    title: parsed.data.title,
    description: parsed.data.description || null,
    cover_image_url: parsed.data.coverImageUrl || null,
  });

  if (error) return { error: "Não foi possível criar o jogo." };

  revalidatePath("/dashboard/games");
  redirect("/dashboard/games");
}

export async function updateGameAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const gameId = z.string().uuid().safeParse(formData.get("gameId"));
  if (!gameId.success) return { error: "Jogo inválido." };

  const parsed = gameFormSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    coverImageUrl: formData.get("coverImageUrl"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .update({
      title: parsed.data.title,
      description: parsed.data.description || null,
      cover_image_url: parsed.data.coverImageUrl || null,
    })
    .eq("id", gameId.data)
    .select("id");

  if (error) return { error: "Não foi possível salvar o jogo." };
  if (!data || data.length === 0) {
    return { error: "Você não tem permissão para editar este jogo." };
  }

  revalidatePath("/dashboard/games");
  revalidatePath(`/dashboard/games/${gameId.data}`);
  return { message: "Jogo salvo." };
}

const statusSchema = z.object({
  gameId: z.string().uuid(),
  status: z.enum(GAME_STATUSES),
});

export async function setGameStatusAction(formData: FormData): Promise<void> {
  const parsed = statusSchema.safeParse({
    gameId: formData.get("gameId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const active = await getActiveOrganization();
  if (!active) return;
  // Publicar exige games.publish; demais transições exigem games.update.
  const needed = parsed.data.status === "published" ? "games.publish" : "games.update";
  if (!hasPermission(active.role, needed)) return;

  const supabase = await createClient();
  await supabase
    .from("games")
    .update({
      status: parsed.data.status,
      published_at: parsed.data.status === "published" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.gameId);

  revalidatePath("/dashboard/games");
  revalidatePath(`/dashboard/games/${parsed.data.gameId}`);
}

export async function deleteGameAction(formData: FormData): Promise<void> {
  const gameId = z.string().uuid().safeParse(formData.get("gameId"));
  if (!gameId.success) return;

  const supabase = await createClient();
  await supabase.from("games").delete().eq("id", gameId.data);

  revalidatePath("/dashboard/games");
  redirect("/dashboard/games");
}
