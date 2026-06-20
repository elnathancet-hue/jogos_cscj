// src/lib/games/truefalse.ts
import { z } from "zod";

export const trueFalseStatementSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Afirmação vazia.").max(300),
  answer: z.boolean(),
});

export const trueFalseSettingsSchema = z.object({
  type: z.literal("truefalse"),
  statements: z
    .array(trueFalseStatementSchema)
    .min(1, "Adicione ao menos 1 afirmação.")
    .max(30),
});

export type TrueFalseStatement = z.infer<typeof trueFalseStatementSchema>;
export type TrueFalseSettings = z.infer<typeof trueFalseSettingsSchema>;

export function readTrueFalse(settings: unknown): TrueFalseStatement[] {
  const parsed = trueFalseSettingsSchema.safeParse(settings);
  return parsed.success ? parsed.data.statements : [];
}

export function scoreTrueFalse(
  statements: TrueFalseStatement[],
  answers: (boolean | undefined)[],
): { correct: number; total: number; score: number } {
  const total = statements.length;
  const correct = statements.reduce(
    (acc, s, i) => acc + (answers[i] === s.answer ? 1 : 0),
    0,
  );
  return { correct, total, score: total > 0 ? Math.round((correct / total) * 100) : 0 };
}
