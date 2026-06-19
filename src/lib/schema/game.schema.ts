// src/lib/schema/game.schema.ts
import { z } from "zod";

export const GAME_STATUSES = ["draft", "published", "archived"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export const gameFormSchema = z.object({
  title: z.string().min(2, "Informe o título do jogo.").max(200),
  description: z.string().max(5000).optional().or(z.literal("")),
});

export type GameFormInput = z.infer<typeof gameFormSchema>;
