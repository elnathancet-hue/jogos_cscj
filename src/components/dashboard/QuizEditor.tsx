"use client";

import { useActionState, useState } from "react";

import { updateGameContentAction } from "@/app/dashboard/games/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import type { QuizQuestion } from "@/lib/games/quiz";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ImageUpload } from "@/components/ui/ImageUpload";

function newQuestion(): QuizQuestion {
  return { id: crypto.randomUUID(), prompt: "", options: ["", ""], answerIndex: 0, imageUrl: "", explanation: "" };
}

export function QuizEditor({
  gameId,
  initialQuestions,
  initialTimed,
}: {
  gameId: string;
  initialQuestions: QuizQuestion[];
  initialTimed?: boolean;
}) {
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initialQuestions.length ? initialQuestions : [newQuestion()],
  );
  const [timed, setTimed] = useState(!!initialTimed);
  const [state, action, pending] = useActionState(
    updateGameContentAction,
    EMPTY_FORM_STATE,
  );

  function patch(id: string, fn: (q: QuizQuestion) => QuizQuestion) {
    setQuestions((qs) => qs.map((q) => (q.id === id ? fn(q) : q)));
  }

  const settingsJson = JSON.stringify({ type: "quiz", timed, questions });

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="settings" value={settingsJson} />

      {state.message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <label className="flex items-center gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
        Modo contra o tempo (cada pergunta tem 20s; respostas rápidas valem mais)
      </label>

      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-lg border border-slate-200 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-700">Pergunta {qi + 1}</span>
            {questions.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setQuestions((qs) => qs.filter((x) => x.id !== q.id))}
              >
                Remover
              </Button>
            )}
          </div>

          <Field label="Enunciado" htmlFor={`prompt-${q.id}`}>
            <Input
              id={`prompt-${q.id}`}
              value={q.prompt}
              onChange={(e) => patch(q.id, (x) => ({ ...x, prompt: e.target.value }))}
            />
          </Field>

          <p className="mb-1 mt-3 text-sm font-medium text-slate-700">
            Opções <span className="text-slate-400">(marque a correta)</span>
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  type="radio"
                  name={`correct-${q.id}`}
                  checked={q.answerIndex === oi}
                  onChange={() => patch(q.id, (x) => ({ ...x, answerIndex: oi }))}
                  aria-label={`Marcar opção ${oi + 1} como correta`}
                />
                <Input
                  value={opt}
                  placeholder={`Opção ${oi + 1}`}
                  onChange={(e) =>
                    patch(q.id, (x) => ({
                      ...x,
                      options: x.options.map((o, i) => (i === oi ? e.target.value : o)),
                    }))
                  }
                />
                {q.options.length > 2 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      patch(q.id, (x) => {
                        const options = x.options.filter((_, i) => i !== oi);
                        const answerIndex =
                          x.answerIndex >= options.length ? options.length - 1 : x.answerIndex;
                        return { ...x, options, answerIndex };
                      })
                    }
                  >
                    ✕
                  </Button>
                )}
              </div>
            ))}
          </div>

          {q.options.length < 6 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="mt-2"
              onClick={() => patch(q.id, (x) => ({ ...x, options: [...x.options, ""] }))}
            >
              + Adicionar opção
            </Button>
          )}

          <div className="mt-3">
            <Field label="Explicação (mostrada após responder)" hint="Opcional — o porquê da resposta.">
              <Input
                value={q.explanation ?? ""}
                onChange={(e) => patch(q.id, (x) => ({ ...x, explanation: e.target.value }))}
              />
            </Field>
          </div>

          <div className="mt-3">
            <Field label="Imagem da pergunta" hint="Opcional.">
              <ImageUpload
                name={`__qimg_${q.id}`}
                defaultUrl={q.imageUrl ?? ""}
                pathPrefix="quiz"
                onChange={(url) => patch(q.id, (x) => ({ ...x, imageUrl: url }))}
              />
            </Field>
          </div>
        </div>
      ))}

      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() => setQuestions((qs) => [...qs, newQuestion()])}
        >
          + Adicionar pergunta
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar conteúdo"}
        </Button>
      </div>
    </form>
  );
}
