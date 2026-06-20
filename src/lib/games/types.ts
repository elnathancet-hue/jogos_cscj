// src/lib/games/types.ts
//
// Registro dos tipos de jogo. Cada tipo tem schema próprio em seu módulo.

import { z } from "zod";

import { quizSettingsSchema } from "@/lib/games/quiz";
import { memorySettingsSchema } from "@/lib/games/memory";
import { crosswordSettingsSchema } from "@/lib/games/crossword";
import { trueFalseSettingsSchema } from "@/lib/games/truefalse";
import { orderingSettingsSchema } from "@/lib/games/ordering";
import { wordsearchSettingsSchema } from "@/lib/games/wordsearch";
import { hotspotSettingsSchema } from "@/lib/games/hotspot";

export const GAME_TYPES = [
  "quiz",
  "truefalse",
  "memory",
  "ordering",
  "wordsearch",
  "crossword",
  "hotspot",
] as const;
export type GameType = (typeof GAME_TYPES)[number];

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  quiz: "Quiz",
  truefalse: "Verdadeiro ou Falso",
  memory: "Memória / Associação",
  ordering: "Ordenar / Sequência",
  wordsearch: "Caça-palavras",
  crossword: "Palavra-cruzada",
  hotspot: "Hotspot (clicar na imagem)",
};

/** Conteúdo COMPLETO e jogável (exige conteúdo válido conforme o tipo). */
export const gameSettingsSchema = z.discriminatedUnion("type", [
  quizSettingsSchema,
  memorySettingsSchema,
  crosswordSettingsSchema,
  trueFalseSettingsSchema,
  orderingSettingsSchema,
  wordsearchSettingsSchema,
  hotspotSettingsSchema,
]);

/** Lê só o tipo do settings (mesmo sem conteúdo ainda). */
export function getGameType(settings: unknown): GameType | null {
  const t = (settings as { type?: unknown } | null)?.type;
  return typeof t === "string" && (GAME_TYPES as readonly string[]).includes(t)
    ? (t as GameType)
    : null;
}
