"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { submitResultAction, type PlayResultState } from "@/app/play/[id]/actions";
import { scoreQuiz, type QuizQuestion } from "@/lib/games/quiz";
import { playCorrect, playWrong, playCombo } from "@/lib/play/sound";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PlayIntro } from "@/components/play/PlayIntro";
import { ResultScreen } from "@/components/play/ResultScreen";
import { ProgressBar } from "@/components/play/ProgressBar";

const INITIAL: PlayResultState = {};

export function QuizPlay({
  gameId,
  questions,
  autoStart,
  playerName,
  onFinish,
}: {
  gameId: string;
  questions: QuizQuestion[];
  autoStart?: boolean;
  playerName?: string;
  onFinish?: () => void;
}) {
  const [started, setStarted] = useState(!!autoStart);
  const [name, setName] = useState(playerName ?? "");
  const [classCode, setClassCode] = useState("");
  const [startedAt, setStartedAt] = useState(() => (autoStart ? Date.now() : 0));
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [answers, setAnswers] = useState<(number | undefined)[]>(
    () => Array(questions.length).fill(undefined),
  );
  const [state, action, pending] = useActionState(submitResultAction, INITIAL);

  useEffect(() => {
    if (state.message) onFinish?.();
  }, [state.message, onFinish]);

  const { correct, total, score } = scoreQuiz(questions, answers);

  if (state.message) {
    return (
      <ResultScreen
        score={score}
        detail={`${correct} de ${total} acertos`}
        rank={state.rank}
        total={state.total}
        leaderboard={state.leaderboard}
      />
    );
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
  const wasCorrect = answered && chosen === q.answerIndex;
  const isLast = index === total - 1;

  function choose(oi: number) {
    if (answered) return;
    const correctChoice = oi === q.answerIndex;
    const nextStreak = correctChoice ? streak + 1 : 0;
    if (correctChoice) {
      playCorrect();
      if (nextStreak >= 2) playCombo(nextStreak);
    } else {
      playWrong();
    }
    setStreak(nextStreak);
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
          <div className="flex min-h-[1.5rem] items-center justify-end">
            <AnimatePresence>
              {wasCorrect && streak >= 2 && (
                <motion.span
                  key={streak}
                  initial={{ scale: 0, rotate: -8 }}
                  animate={{ scale: 1, rotate: 0 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="rounded-full bg-orange-100 px-2 py-0.5 text-xs font-bold text-orange-700"
                >
                  🔥 Combo x{streak}!
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          <p className="font-display text-lg font-semibold text-slate-900">{q.prompt}</p>

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
                  animate={showCorrect ? { scale: [1, 1.05, 1] } : {}}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border-2 px-3 py-3 text-left text-sm font-medium transition-colors",
                    showCorrect && "border-emerald-400 bg-emerald-50 text-emerald-900",
                    showWrong && "border-red-400 bg-red-50 text-red-900 animate-shake",
                    !answered && "border-slate-200 text-slate-700 hover:border-blue-400 hover:bg-blue-50",
                    answered && !showCorrect && !showWrong && "border-slate-200 text-slate-400",
                  )}
                >
                  <span
                    className={cn(
                      "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold",
                      showCorrect && "border-emerald-400 bg-emerald-100",
                      showWrong && "border-red-400 bg-red-100",
                      !answered && "border-slate-300",
                      answered && !showCorrect && !showWrong && "border-slate-200",
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

      <div className="min-h-[3rem]">
        {answered && !isLast && (
          <Button type="button" className="w-full" onClick={() => setIndex((i) => i + 1)}>
            Próxima →
          </Button>
        )}
        {answered && isLast && (
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Ver resultado 🏆"}
          </Button>
        )}
      </div>
    </form>
  );
}
