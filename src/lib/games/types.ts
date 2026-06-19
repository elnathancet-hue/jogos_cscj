// src/lib/games/types.ts
//
// Registro dos tipos de jogo. Cada tipo tem schema próprio em seu módulo.

import { z } from "zod";

import { quizSettingsSchema } from "@/lib/games/quiz";
import { memorySettingsSchema } from "@/lib/games/memory";
import { crosswordSettingsSchema } from "@/lib/games/crossword";

export const GAME_TYPES = ["quiz", "memory", "crossword"] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  quiz: "Quiz",
  memory: "Memória / Associação",
  crossword: "Palavra-cruzada",
};

/** Conteúdo COMPLETO e jogável (exige conteúdo válido conforme o tipo). */
export const gameSettingsSchema = z.discriminatedUnion("type", [
  quizSettingsSchema,
  memorySettingsSchema,
  crosswordSettingsSchema,
]);

/** Lê só o tipo do settings (mesmo sem conteúdo ainda). */
export function getGameType(settings: unknown): GameType | null {
  const t = (settings as { type?: unknown } | null)?.type;
  return typeof t === "string" && (GAME_TYPES as readonly string[]).includes(t)
    ? (t as GameType)
    : null;
}
