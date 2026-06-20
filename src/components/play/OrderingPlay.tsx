"use client";

import { useActionState, useEffect, useState } from "react";
import { motion } from "framer-motion";

import { submitResultAction, type PlayResultState } from "@/app/play/[id]/actions";
import { scoreOrdering, type OrderingItem } from "@/lib/games/ordering";
import { playClick } from "@/lib/play/sound";
import { Button } from "@/components/ui/Button";
import { PlayIntro } from "@/components/play/PlayIntro";
import { ResultScreen } from "@/components/play/ResultScreen";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function OrderingPlay({
  gameId,
  prompt,
  items,
  autoStart,
  playerName,
  onFinish,
}: {
  gameId: string;
  prompt: string;
  items: OrderingItem[];
  autoStart?: boolean;
  playerName?: string;
  onFinish?: () => void;
}) {
  const [started, setStarted] = useState(!!autoStart);
  const [name, setName] = useState(playerName ?? "");
  const [classCode, setClassCode] = useState("");
  const [startedAt, setStartedAt] = useState(() => (autoStart ? Date.now() : 0));
  const [order, setOrder] = useState<OrderingItem[]>(() => shuffle(items));
  const [state, action, pending] = useActionState(submitResultAction, {} as PlayResultState);

  useEffect(() => {
    if (state.message) onFinish?.();
  }, [state.message, onFinish]);

  const correctIds = items.map((i) => i.id);
  const { correct, total, score } = scoreOrdering(correctIds, order.map((o) => o.id));

  if (state.message) {
    return <ResultScreen score={score} detail={`${correct} de ${total} na ordem certa`} rank={state.rank} total={state.total} leaderboard={state.leaderboard} />;
  }
  if (!started) {
    return <PlayIntro onStart={(n, c) => { setName(n); setClassCode(c); setStartedAt(Date.now()); setStarted(true); }} />;
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= order.length) return;
    playClick();
    setOrder((xs) => {
      const copy = [...xs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="playerName" value={name} />
      <input type="hidden" name="classCode" value={classCode} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="score" value={score} />

      {prompt && <p className="font-display text-base font-semibold text-slate-900">{prompt}</p>}
      <p className="text-sm text-slate-500">Use ↑ ↓ para colocar na ordem certa.</p>

      <ul className="space-y-2">
        {order.map((it, i) => (
          <motion.li key={it.id} layout className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-3 py-3">
            <span className="w-5 text-center text-sm font-bold text-slate-400">{i + 1}</span>
            <span className="flex-1 text-sm text-slate-800">{it.text}</span>
            <Button type="button" variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === order.length - 1}>↓</Button>
          </motion.li>
        ))}
      </ul>

      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Enviando..." : "Finalizar e enviar"}</Button>
    </form>
  );
}
