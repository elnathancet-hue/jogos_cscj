// src/lib/games/crossword.ts
//
// Tipo "crossword" (palavra-cruzada): lista de {answer, clue}. O layout é
// calculado por um algoritmo guloso que cruza letras em comum.

import { z } from "zod";

export const crosswordEntrySchema = z.object({
  id: z.string(),
  answer: z
    .string()
    .min(2, "Mínimo de 2 letras.")
    .max(20)
    .regex(/^[A-Za-zÀ-ÿ]+$/, "Só letras, sem espaços ou números."),
  clue: z.string().min(1, "Dica vazia.").max(200),
});

export const crosswordSettingsSchema = z.object({
  type: z.literal("crossword"),
  entries: z.array(crosswordEntrySchema).min(2, "Adicione ao menos 2 palavras.").max(20),
});

export type CrosswordEntry = z.infer<typeof crosswordEntrySchema>;
export type CrosswordSettings = z.infer<typeof crosswordSettingsSchema>;

export type PlacedWord = {
  id: string;
  answer: string; // normalizada (MAIÚSCULA, sem acento)
  clue: string;
  row: number;
  col: number;
  dir: "across" | "down";
  number: number;
};

export type CrosswordLayout = {
  placed: PlacedWord[];
  rows: number;
  cols: number;
  /** células ocupadas: "r,c" -> letra correta */
  cells: Record<string, string>;
};

export function readCrosswordEntries(settings: unknown): CrosswordEntry[] {
  const parsed = crosswordSettingsSchema.safeParse(settings);
  return parsed.success ? parsed.data.entries : [];
}

/** MAIÚSCULA sem acentos, para casar letras no cruzamento. */
export function normalizeWord(w: string): string {
  // NFD separa os acentos; o filtro [^A-Z] no fim remove os combinantes.
  return w.normalize("NFD").toUpperCase().replace(/[^A-Z]/g, "");
}

const key = (r: number, c: number) => `${r},${c}`;

/** Monta a grade cruzando palavras (guloso). Robusto: nunca lança. */
export function buildCrossword(entries: CrosswordEntry[]): CrosswordLayout {
  const words = entries
    .map((e) => ({ ...e, norm: normalizeWord(e.answer) }))
    .filter((e) => e.norm.length >= 2)
    .sort((a, b) => b.norm.length - a.norm.length);

  const cells: Record<string, string> = {};
  const placed: Omit<PlacedWord, "number">[] = [];

  function fits(word: string, r: number, c: number, dir: "across" | "down") {
    let crosses = 0;
    for (let i = 0; i < word.length; i++) {
      const rr = dir === "across" ? r : r + i;
      const cc = dir === "across" ? c + i : c;
      const existing = cells[key(rr, cc)];
      if (existing) {
        if (existing !== word[i]) return null;
        crosses++;
      }
    }
    return crosses;
  }

  function put(w: { id: string; answer: string; clue: string; norm: string }, r: number, c: number, dir: "across" | "down") {
    for (let i = 0; i < w.norm.length; i++) {
      const rr = dir === "across" ? r : r + i;
      const cc = dir === "across" ? c + i : c;
      cells[key(rr, cc)] = w.norm[i];
    }
    placed.push({ id: w.id, answer: w.norm, clue: w.clue, row: r, col: c, dir });
  }

  words.forEach((w, idx) => {
    if (idx === 0) {
      put(w, 0, 0, "across");
      return;
    }
    let best: { r: number; c: number; dir: "across" | "down" } | null = null;
    // tenta cruzar com letras já colocadas
    for (const p of placed) {
      for (let pi = 0; pi < p.answer.length; pi++) {
        const pr = p.dir === "across" ? p.row : p.row + pi;
        const pc = p.dir === "across" ? p.col + pi : p.col;
        for (let wi = 0; wi < w.norm.length; wi++) {
          if (w.norm[wi] !== p.answer[pi]) continue;
          const dir: "across" | "down" = p.dir === "across" ? "down" : "across";
          const r = dir === "across" ? pr : pr - wi;
          const c = dir === "across" ? pc - wi : pc;
          if (fits(w.norm, r, c, dir) !== null) {
            best = { r, c, dir };
            break;
          }
        }
        if (best) break;
      }
      if (best) break;
    }
    if (best) {
      put(w, best.r, best.c, best.dir);
    } else {
      // sem cruzamento: empilha abaixo de tudo
      const maxRow = placed.reduce(
        (m, p) => Math.max(m, p.dir === "down" ? p.row + p.answer.length : p.row),
        0,
      );
      put(w, maxRow + 2, 0, "across");
    }
  });

  // normaliza para começar em (0,0)
  const rs = placed.flatMap((p) =>
    Array.from({ length: p.answer.length }, (_, i) => (p.dir === "across" ? p.row : p.row + i)),
  );
  const cs = placed.flatMap((p) =>
    Array.from({ length: p.answer.length }, (_, i) => (p.dir === "across" ? p.col + i : p.col)),
  );
  const minR = rs.length ? Math.min(...rs) : 0;
  const minC = cs.length ? Math.min(...cs) : 0;

  const shifted = placed.map((p) => ({ ...p, row: p.row - minR, col: p.col - minC }));
  const normCells: Record<string, string> = {};
  for (const k in cells) {
    const [r, c] = k.split(",").map(Number);
    normCells[key(r - minR, c - minC)] = cells[k];
  }

  // numeração: células que iniciam palavra, em ordem de leitura
  const starts = new Map<string, number>();
  const sorted = [...shifted].sort((a, b) => a.row - b.row || a.col - b.col);
  let n = 0;
  const numbered: PlacedWord[] = [];
  for (const p of sorted) {
    const k = key(p.row, p.col);
    if (!starts.has(k)) starts.set(k, ++n);
    numbered.push({ ...p, number: starts.get(k)! });
  }

  const rows = shifted.reduce(
    (m, p) => Math.max(m, p.dir === "down" ? p.row + p.answer.length : p.row + 1),
    0,
  );
  const cols = shifted.reduce(
    (m, p) => Math.max(m, p.dir === "across" ? p.col + p.answer.length : p.col + 1),
    0,
  );

  return { placed: numbered, rows, cols, cells: normCells };
}

/** Pontuação 0–100: palavras totalmente corretas / total. */
export function scoreCrossword(
  layout: CrosswordLayout,
  filled: Record<string, string>,
): { correct: number; total: number; score: number } {
  const total = layout.placed.length;
  let correct = 0;
  for (const p of layout.placed) {
    let ok = true;
    for (let i = 0; i < p.answer.length; i++) {
      const rr = p.dir === "across" ? p.row : p.row + i;
      const cc = p.dir === "across" ? p.col + i : p.col;
      const v = (filled[key(rr, cc)] ?? "").toUpperCase();
      if (v !== p.answer[i]) {
        ok = false;
        break;
      }
    }
    if (ok) correct++;
  }
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, score };
}
