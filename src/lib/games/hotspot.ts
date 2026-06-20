// src/lib/games/hotspot.ts
//
// Hotspot: clicar no ponto certo de uma imagem. Cada alvo tem x,y (% da
// imagem) e uma dica (label). Tolerância = raio em % para acertar.

import { z } from "zod";

export const hotspotTargetSchema = z.object({
  id: z.string(),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  label: z.string().min(1, "Dica vazia.").max(120),
});

export const hotspotSettingsSchema = z.object({
  type: z.literal("hotspot"),
  imageUrl: z.string().url("Envie a imagem do jogo."),
  tolerance: z.number().min(3).max(25).optional(),
  targets: z.array(hotspotTargetSchema).min(1, "Marque ao menos 1 alvo.").max(15),
});

export type HotspotTarget = z.infer<typeof hotspotTargetSchema>;
export type HotspotSettings = z.infer<typeof hotspotSettingsSchema>;

export const HOTSPOT_TOLERANCE = 9; // raio padrão em % da imagem

export function readHotspot(settings: unknown): HotspotSettings | null {
  const parsed = hotspotSettingsSchema.safeParse(settings);
  return parsed.success ? parsed.data : null;
}

/** Distância (% da imagem) entre o clique e um alvo. */
export function distance(ax: number, ay: number, bx: number, by: number): number {
  return Math.hypot(ax - bx, ay - by);
}

/** Pontuação por precisão: menos erros = mais pontos. */
export function scoreHotspot(total: number, misses: number): number {
  if (total <= 0) return 0;
  return Math.round((total / (total + misses)) * 100);
}
