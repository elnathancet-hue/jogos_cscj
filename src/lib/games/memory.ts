// src/lib/games/memory.ts
//
// Tipo "memory" (memória / associação): pares A↔B. As cartas são embaralhadas
// (A e B viram cartas separadas); o jogador acha os pares.

import { z } from "zod";

export const memoryPairSchema = z.object({
  id: z.string(),
  a: z.string().min(1, "Lado A vazio.").max(60),
  b: z.string().min(1, "Lado B vazio.").max(60),
});

export const memorySettingsSchema = z.object({
  type: z.literal("memory"),
  pairs: z.array(memoryPairSchema).min(2, "Adicione ao menos 2 pares.").max(12),
});

export type MemoryPair = z.infer<typeof memoryPairSchema>;
export type MemorySettings = z.infer<typeof memorySettingsSchema>;

export function readMemoryPairs(settings: unknown): MemoryPair[] {
  const parsed = memorySettingsSchema.safeParse(settings);
  return parsed.success ? parsed.data.pairs : [];
}

/** Pontuação 0–100 pela eficiência: pares / tentativas de virada de par. */
export function scoreMemory(pairs: number, attempts: number): number {
  if (pairs <= 0) return 0;
  if (attempts <= 0) return 100;
  return Math.max(0, Math.min(100, Math.round((pairs / attempts) * 100)));
}
