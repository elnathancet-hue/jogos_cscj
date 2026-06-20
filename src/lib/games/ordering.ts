// src/lib/games/ordering.ts
//
// "Ordenar": o jogador coloca itens na ordem correta. A ordem do array é a
// ordem correta; o player embaralha e o jogador reordena.

import { z } from "zod";

export const orderingItemSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Item vazio.").max(160),
});

export const orderingSettingsSchema = z.object({
  type: z.literal("ordering"),
  prompt: z.string().max(200).optional().or(z.literal("")),
  items: z.array(orderingItemSchema).min(2, "Adicione ao menos 2 itens.").max(12),
});

export type OrderingItem = z.infer<typeof orderingItemSchema>;
export type OrderingSettings = z.infer<typeof orderingSettingsSchema>;

export function readOrdering(settings: unknown): OrderingSettings | null {
  const parsed = orderingSettingsSchema.safeParse(settings);
  return parsed.success ? parsed.data : null;
}

/** Pontuação: itens na posição correta / total. */
export function scoreOrdering(
  correctIds: string[],
  currentIds: string[],
): { correct: number; total: number; score: number } {
  const total = correctIds.length;
  const correct = correctIds.reduce(
    (acc, id, i) => acc + (currentIds[i] === id ? 1 : 0),
    0,
  );
  return { correct, total, score: total > 0 ? Math.round((correct / total) * 100) : 0 };
}
