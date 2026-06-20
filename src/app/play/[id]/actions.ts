"use server";

import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export type LeaderboardRow = { player_name: string; score: number };

export type PlayResultState = {
  error?: string;
  message?: string;
  rank?: number;
  total?: number;
  leaderboard?: LeaderboardRow[];
};

const submitSchema = z.object({
  gameId: z.string().uuid(),
  playerName: z.string().min(1, "Informe um nome para começar."),
  classCode: z.string().optional().or(z.literal("")),
  score: z.coerce.number().int().min(0).max(1_000_000).optional(),
  startedAt: z.coerce.number().optional(),
});

/** Registra a sessão (RPC pública) e devolve posição + ranking do jogo. */
export async function submitResultAction(
  _prev: PlayResultState,
  formData: FormData,
): Promise<PlayResultState> {
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
  const { data: resultId, error } = await supabase.rpc("submit_game_result", {
    p_game_id: parsed.data.gameId,
    p_player_name: parsed.data.playerName,
    p_score: parsed.data.score ?? 0,
    p_duration_seconds: duration,
    p_class_code: parsed.data.classCode || null,
  });

  if (error) return { error: error.message || "Não foi possível registrar." };

  const [{ data: rankRows }, { data: lb }] = await Promise.all([
    supabase.rpc("get_result_rank", { p_result_id: resultId }),
    supabase.rpc("get_game_leaderboard", { p_game_id: parsed.data.gameId, p_limit: 5 }),
  ]);

  const rank = Array.isArray(rankRows) ? rankRows[0] : undefined;

  return {
    message: "Resultado registrado!",
    rank: rank?.rank,
    total: rank?.total,
    leaderboard: (lb as LeaderboardRow[]) ?? [],
  };
}
