"use client";

import { useActionState, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { submitResultAction, type PlayResultState } from "@/app/play/[id]/actions";
import { scoreTrueFalse, type TrueFalseStatement } from "@/lib/games/truefalse";
import { playCorrect, playWrong } from "@/lib/play/sound";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PlayIntro } from "@/components/play/PlayIntro";
import { ResultScreen } from "@/components/play/ResultScreen";
import { ProgressBar } from "@/components/play/ProgressBar";

export function TrueFalsePlay({
  gameId,
  statements,
  autoStart,
  playerName,
  onFinish,
}: {
  gameId: string;
  statements: TrueFalseStatement[];
  autoStart?: boolean;
  playerName?: string;
  onFinish?: () => void;
}) {
  const [started, setStarted] = useState(!!autoStart);
  const [name, setName] = useState(playerName ?? "");
  const [classCode, setClassCode] = useState("");
  const [startedAt, setStartedAt] = useState(() => (autoStart ? Date.now() : 0));
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<(boolean | undefined)[]>(() => Array(statements.length).fill(undefined));
  const [state, action, pending] = useActionState(submitResultAction, {} as PlayResultState);

  useEffect(() => {
    if (state.message) onFinish?.();
  }, [state.message, onFinish]);

  const total = statements.length;
  const { correct, score } = scoreTrueFalse(statements, answers);
  const s = statements[index];
  const chosen = answers[index];
  const answered = chosen !== undefined;
  const isLast = index === total - 1;

  if (state.message) {
    return <ResultScreen score={score} detail={`${correct} de ${total} acertos`} rank={state.rank} total={state.total} leaderboard={state.leaderboard} />;
  }
  if (!started) {
    return <PlayIntro onStart={(n, c) => { setName(n); setClassCode(c); setStartedAt(Date.now()); setStarted(true); }} />;
  }

  function choose(v: boolean) {
    if (answered) return;
    if (v === s.answer) playCorrect();
    else playWrong();
    setAnswers((a) => a.map((x, i) => (i === index ? v : x)));
  }

  return (
    <form action={action} className="space-y-5">
      {state.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="playerName" value={name} />
      <input type="hidden" name="classCode" value={classCode} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="score" value={score} />

      <div className="space-y-1">
        <ProgressBar value={index + 1} max={total} />
        <p className="text-right text-xs text-slate-400">{index + 1} de {total}</p>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={index} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.25 }} className="space-y-4">
          <p className="font-display text-lg font-semibold text-slate-900">{s.text}</p>
          <div className="grid grid-cols-2 gap-3">
            {([true, false] as const).map((v) => {
              const isAns = s.answer === v;
              const isChosen = chosen === v;
              const showCorrect = answered && isAns;
              const showWrong = answered && isChosen && !isAns;
              return (
                <motion.button
                  key={String(v)}
                  type="button"
                  onClick={() => choose(v)}
                  disabled={answered}
                  whileTap={answered ? undefined : { scale: 0.97 }}
                  className={cn(
                    "rounded-2xl border-2 py-6 font-display text-xl font-bold transition-colors",
                    showCorrect && "border-emerald-400 bg-emerald-50 text-emerald-800",
                    showWrong && "border-red-400 bg-red-50 text-red-800 animate-shake",
                    !answered && (v ? "border-emerald-200 text-emerald-700 hover:bg-emerald-50" : "border-red-200 text-red-700 hover:bg-red-50"),
                    answered && !showCorrect && !showWrong && "border-slate-200 text-slate-300",
                  )}
                >
                  {v ? "✓ Verdadeiro" : "✕ Falso"}
                </motion.button>
              );
            })}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="min-h-[3rem]">
        {answered && !isLast && <Button type="button" className="w-full" onClick={() => setIndex((i) => i + 1)}>Próxima →</Button>}
        {answered && isLast && <Button type="submit" className="w-full" disabled={pending}>{pending ? "Enviando..." : "Ver resultado 🏆"}</Button>}
      </div>
    </form>
  );
}
