// src/lib/games/wordsearch.ts
//
// Caça-palavras: gera uma grade colocando as palavras em 8 direções e
// preenche o resto com letras aleatórias.

import { z } from "zod";

export const wordsearchSettingsSchema = z.object({
  type: z.literal("wordsearch"),
  words: z
    .array(
      z
        .string()
        .regex(/^[A-Za-zÀ-ÿ]+$/, "Só letras, sem espaços.")
        .min(2)
        .max(12),
    )
    .min(2, "Adicione ao menos 2 palavras.")
    .max(12),
});

export type WordsearchSettings = z.infer<typeof wordsearchSettingsSchema>;

export function readWordsearchWords(settings: unknown): string[] {
  const parsed = wordsearchSettingsSchema.safeParse(settings);
  return parsed.success ? parsed.data.words : [];
}

function norm(w: string): string {
  return w.normalize("NFD").toUpperCase().replace(/[^A-Z]/g, "");
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIRS = [
  [0, 1],
  [1, 0],
  [1, 1],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, -1],
  [-1, 1],
];

export type WordsearchGrid = {
  grid: string[][];
  size: number;
  words: string[]; // normalizadas
};

/** Gera a grade. Determinístico o suficiente; robusto (nunca lança). */
export function buildWordsearch(rawWords: string[]): WordsearchGrid {
  const words = Array.from(new Set(rawWords.map(norm).filter((w) => w.length >= 2)));
  const maxLen = words.reduce((m, w) => Math.max(m, w.length), 2);
  const size = Math.min(14, Math.max(maxLen + 1, 9));
  const grid: (string | null)[][] = Array.from({ length: size }, () =>
    Array<string | null>(size).fill(null),
  );

  const inBounds = (r: number, c: number) => r >= 0 && r < size && c >= 0 && c < size;

  function tryPlace(word: string): boolean {
    for (let attempt = 0; attempt < 80; attempt++) {
      const [dr, dc] = DIRS[Math.floor(Math.random() * DIRS.length)];
      const r0 = Math.floor(Math.random() * size);
      const c0 = Math.floor(Math.random() * size);
      let ok = true;
      for (let i = 0; i < word.length; i++) {
        const r = r0 + dr * i;
        const c = c0 + dc * i;
        if (!inBounds(r, c) || (grid[r][c] !== null && grid[r][c] !== word[i])) {
          ok = false;
          break;
        }
      }
      if (!ok) continue;
      for (let i = 0; i < word.length; i++) grid[r0 + dr * i][c0 + dc * i] = word[i];
      return true;
    }
    return false;
  }

  const placed: string[] = [];
  for (const w of words) {
    if (tryPlace(w)) placed.push(w);
  }

  const finalGrid = grid.map((row) =>
    row.map((cell) => cell ?? ALPHABET[Math.floor(Math.random() * 26)]),
  );

  return { grid: finalGrid, size, words: placed };
}

/** Letras de uma reta de start→end (mesma linha/coluna/diagonal), ou null. */
export function lineCells(
  r1: number,
  c1: number,
  r2: number,
  c2: number,
): { r: number; c: number }[] | null {
  const dr = Math.sign(r2 - r1);
  const dc = Math.sign(c2 - c1);
  const lenR = Math.abs(r2 - r1);
  const lenC = Math.abs(c2 - c1);
  // precisa ser reta: horizontal, vertical ou diagonal perfeita
  if (!((dr === 0 && dc !== 0) || (dc === 0 && dr !== 0) || lenR === lenC)) return null;
  const len = Math.max(lenR, lenC);
  return Array.from({ length: len + 1 }, (_, i) => ({ r: r1 + dr * i, c: c1 + dc * i }));
}

export function scoreWordsearch(total: number, found: number): number {
  return total > 0 ? Math.round((found / total) * 100) : 0;
}
