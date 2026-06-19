// src/lib/games/quiz.ts
//
// Tipo de jogo "quiz": perguntas de múltipla escolha. O conteúdo fica em
// games.settings (jsonb), validado por estes schemas.

import { z } from "zod";

export const quizQuestionSchema = z
  .object({
    id: z.string(),
    prompt: z.string().min(1, "Pergunta sem enunciado."),
    options: z.array(z.string().min(1, "Opção vazia.")).min(2, "Mínimo de 2 opções.").max(6),
    answerIndex: z.number().int().min(0),
  })
  .refine((q) => q.answerIndex < q.options.length, {
    message: "Marque qual opção é a correta.",
  });

export const quizSettingsSchema = z.object({
  type: z.literal("quiz"),
  questions: z.array(quizQuestionSchema).min(1, "Adicione ao menos uma pergunta."),
});

export type QuizQuestion = z.infer<typeof quizQuestionSchema>;
export type QuizSettings = z.infer<typeof quizSettingsSchema>;

/** settings é um quiz válido e jogável? */
export function isQuiz(settings: unknown): settings is QuizSettings {
  return quizSettingsSchema.safeParse(settings).success;
}

/** Extrai as perguntas de um settings desconhecido (vazio se não for quiz). */
export function readQuizQuestions(settings: unknown): QuizQuestion[] {
  const parsed = quizSettingsSchema.safeParse(settings);
  return parsed.success ? parsed.data.questions : [];
}

/** Pontuação 0–100 a partir das respostas (índice da opção por pergunta). */
export function scoreQuiz(
  questions: QuizQuestion[],
  answers: (number | undefined)[],
): { correct: number; total: number; score: number } {
  const total = questions.length;
  const correct = questions.reduce(
    (acc, q, i) => acc + (answers[i] === q.answerIndex ? 1 : 0),
    0,
  );
  const score = total > 0 ? Math.round((correct / total) * 100) : 0;
  return { correct, total, score };
}
