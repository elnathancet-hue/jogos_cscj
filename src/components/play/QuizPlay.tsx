"use client";

import { useActionState, useState } from "react";
import { motion } from "framer-motion";

import { submitResultAction } from "@/app/play/[id]/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { scoreQuiz, type QuizQuestion } from "@/lib/games/quiz";
import { Button } from "@/components/ui/Button";
import { PlayIntro } from "@/components/play/PlayIntro";
import { ResultScreen } from "@/components/play/ResultScreen";
import { ProgressBar } from "@/components/play/ProgressBar";

export function QuizPlay({
  gameId,
  questions,
}: {
  gameId: string;
  questions: QuizQuestion[];
}) {
  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(
    () => Array(questions.length).fill(undefined),
  );
  const [state, action, pending] = useActionState(submitResultAction, EMPTY_FORM_STATE);

  const { correct, total, score } = scoreQuiz(questions, answers);
  const answered = answers.filter((a) => a !== undefined).length;
  const allAnswered = answered === total;

  if (state.message) {
    return <ResultScreen score={score} detail={`${correct} de ${total} acertos`} />;
  }

  if (!started) {
    return (
      <PlayIntro
        onStart={(n, c) => {
          setName(n);
          setClassCode(c);
          setStartedAt(Date.now());
          setStarted(true);
        }}
      />
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

      <div className="space-y-1">
        <ProgressBar value={answered} max={total} />
        <p className="text-right text-xs text-slate-400">
          {answered}/{total}
        </p>
      </div>

      {questions.map((q, qi) => (
        <div key={q.id} className="space-y-2">
          <p className="text-sm font-medium text-slate-900">
            {qi + 1}. {q.prompt}
          </p>
          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const selected = answers[qi] === oi;
              return (
                <motion.label
                  key={oi}
                  whileTap={{ scale: 0.98 }}
                  className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selected
                      ? "border-blue-300 bg-blue-50 text-blue-900"
                      : "border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={selected}
                    onChange={() => setAnswers((a) => a.map((v, i) => (i === qi ? oi : v)))}
                  />
                  {opt}
                </motion.label>
              );
            })}
          </div>
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={pending || !allAnswered}>
        {pending ? "Enviando..." : allAnswered ? "Finalizar e enviar" : "Responda todas as perguntas"}
      </Button>
    </form>
  );
}
