"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import type { FormState } from "@/lib/forms";

const submitSchema = z.object({
  gameId: z.string().uuid(),
  playerName: z.string().min(1, "Informe um nome para começar."),
  classCode: z.string().optional().or(z.literal("")),
  score: z.coerce.number().int().min(0).max(1_000_000).optional(),
  startedAt: z.coerce.number().optional(),
});

/** Registra uma sessão de jogo (jogador anônimo) via RPC pública. */
export async function submitResultAction(
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = submitSchema.safeParse({
    gameId: formData.get("gameId"),
    playerName: formData.get("playerName"),
    classCode: formData.get("classCode"),
    score: formData.get("score") || undefined,
    startedAt: formData.get("startedAt") || undefined,
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const duration =
    parsed.data.startedAt && parsed.data.startedAt > 0
      ? Math.max(0, Math.round((Date.now() - parsed.data.startedAt) / 1000))
      : null;

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_game_result", {
    p_game_id: parsed.data.gameId,
    p_player_name: parsed.data.playerName,
    p_score: parsed.data.score ?? 0,
    p_duration_seconds: duration,
    p_class_code: parsed.data.classCode || null,
  });

  if (error) return { error: error.message || "Não foi possível registrar." };

  return { message: "Resultado registrado. Obrigado por jogar!" };
}
