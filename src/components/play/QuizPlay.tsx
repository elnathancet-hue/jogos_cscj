"use client";

import { useActionState, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { submitResultAction } from "@/app/play/[id]/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { scoreQuiz, type QuizQuestion } from "@/lib/games/quiz";
import { cn } from "@/lib/utils";
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
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(
    () => Array(questions.length).fill(undefined),
  );
  const [state, action, pending] = useActionState(submitResultAction, EMPTY_FORM_STATE);

  const { correct, total, score } = scoreQuiz(questions, answers);

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

  const q = questions[index];
  const chosen = answers[index];
  const answered = chosen !== undefined;
  const isLast = index === total - 1;

  function choose(oi: number) {
    if (answered) return;
    setAnswers((a) => a.map((v, i) => (i === index ? oi : v)));
  }

  return (
    <form action={action} className="space-y-5">
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
        <ProgressBar value={index + 1} max={total} />
        <p className="text-right text-xs text-slate-400">
          Pergunta {index + 1} de {total}
        </p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          <p className="text-base font-medium text-slate-900">{q.prompt}</p>

          <div className="space-y-2">
            {q.options.map((opt, oi) => {
              const isCorrect = oi === q.answerIndex;
              const isChosen = chosen === oi;
              const showCorrect = answered && isCorrect;
              const showWrong = answered && isChosen && !isCorrect;
              return (
                <motion.button
                  key={oi}
                  type="button"
                  onClick={() => choose(oi)}
                  disabled={answered}
                  whileTap={answered ? undefined : { scale: 0.98 }}
                  animate={showCorrect ? { scale: [1, 1.04, 1] } : {}}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                    showCorrect && "border-emerald-300 bg-emerald-50 text-emerald-900",
                    showWrong && "border-red-300 bg-red-50 text-red-900 animate-shake",
                    !answered && "border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50",
                    answered && !showCorrect && !showWrong && "border-slate-200 text-slate-400",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs",
                      showCorrect && "border-emerald-400 bg-emerald-100",
                      showWrong && "border-red-400 bg-red-100",
                      !answered && "border-slate-300",
                    )}
                  >
                    {showCorrect ? "✓" : showWrong ? "✕" : String.fromCharCode(65 + oi)}
                  </span>
                  {opt}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="min-h-[2.5rem]">
        {answered && !isLast && (
          <Button type="button" className="w-full" onClick={() => setIndex((i) => i + 1)}>
            Próxima
          </Button>
        )}
        {answered && isLast && (
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Ver resultado"}
          </Button>
        )}
      </div>
    </form>
  );
}
