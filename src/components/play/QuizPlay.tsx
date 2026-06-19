"use client";

import { useActionState, useState } from "react";

import { submitResultAction } from "@/app/play/[id]/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { scoreQuiz, type QuizQuestion } from "@/lib/games/quiz";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Step = "intro" | "quiz";

export function QuizPlay({
  gameId,
  questions,
}: {
  gameId: string;
  questions: QuizQuestion[];
}) {
  const [step, setStep] = useState<Step>("intro");
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(
    () => Array(questions.length).fill(undefined),
  );
  const [state, action, pending] = useActionState(submitResultAction, EMPTY_FORM_STATE);

  const { correct, total, score } = scoreQuiz(questions, answers);
  const allAnswered = answers.every((a) => a !== undefined);

  // Tela final: resultado enviado.
  if (state.message) {
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-slate-600">{state.message}</p>
        <p className="text-3xl font-bold text-slate-950">
          {correct}/{total}
        </p>
        <p className="text-sm text-slate-500">Pontuação: {score}/100</p>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="space-y-4">
        <Field label="Seu nome ou apelido" htmlFor="playerName">
          <Input
            id="playerName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Field
          label="Código da turma"
          htmlFor="classCode"
          hint="Opcional — só se a escola/museu informou."
        >
          <Input
            id="classCode"
            value={classCode}
            onChange={(e) => setClassCode(e.target.value)}
            autoComplete="off"
          />
        </Field>
        <Button
          type="button"
          className="w-full"
          disabled={name.trim().length === 0}
          onClick={() => {
            setStartedAt(Date.now());
            setStep("quiz");
          }}
        >
          Começar
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="playerName" value={name} />
      <input type="hidden" name="classCode" value={classCode} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="score" value={score} />

      {questions.map((q, qi) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm font-medium text-slate-900">
            {qi + 1}. {q.prompt}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              >
                <input
                  type="radio"
                  name={`q-${q.id}`}
                  checked={answers[qi] === oi}
                  onChange={() =>
                    setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))
                  }
                />
                {opt}
              </label>
            ))}
          </div>
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={pending || !allAnswered}>
        {pending ? "Enviando..." : allAnswered ? "Finalizar e enviar" : "Responda todas as perguntas"}
      </Button>
    </form>
  );
}
