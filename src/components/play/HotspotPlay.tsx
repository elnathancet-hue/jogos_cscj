"use client";

import { useActionState, useEffect, useState } from "react";
import { motion } from "framer-motion";

import { submitResultAction, type PlayResultState } from "@/app/play/[id]/actions";
import {
  distance,
  scoreHotspot,
  HOTSPOT_TOLERANCE,
  type HotspotTarget,
} from "@/lib/games/hotspot";
import { playCorrect, playWrong } from "@/lib/play/sound";
import { Button } from "@/components/ui/Button";
import { PlayIntro } from "@/components/play/PlayIntro";
import { ResultScreen } from "@/components/play/ResultScreen";
import { ProgressBar } from "@/components/play/ProgressBar";

export function HotspotPlay({
  gameId,
  imageUrl,
  targets,
  tolerance = HOTSPOT_TOLERANCE,
  autoStart,
  playerName,
  onFinish,
}: {
  gameId: string;
  imageUrl: string;
  targets: HotspotTarget[];
  tolerance?: number;
  autoStart?: boolean;
  playerName?: string;
  onFinish?: () => void;
}) {
  const [started, setStarted] = useState(!!autoStart);
  const [name, setName] = useState(playerName ?? "");
  const [classCode, setClassCode] = useState("");
  const [startedAt, setStartedAt] = useState(() => (autoStart ? Date.now() : 0));
  const [idx, setIdx] = useState(0);
  const [misses, setMisses] = useState(0);
  const [wrong, setWrong] = useState(false);
  const [state, action, pending] = useActionState(submitResultAction, {} as PlayResultState);

  useEffect(() => {
    if (state.message) onFinish?.();
  }, [state.message, onFinish]);

  const total = targets.length;
  const done = idx >= total;
  const score = scoreHotspot(total, misses);

  if (state.message) {
    return <ResultScreen score={score} detail={`${total} alvos · ${misses} erros`} rank={state.rank} total={state.total} leaderboard={state.leaderboard} />;
  }
  if (!started) {
    return <PlayIntro onStart={(n, c) => { setName(n); setClassCode(c); setStartedAt(Date.now()); setStarted(true); }} />;
  }

  function clickImage(e: React.MouseEvent<HTMLDivElement>) {
    if (done) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    const t = targets[idx];
    if (distance(x, y, t.x, t.y) <= tolerance) {
      playCorrect();
      setIdx((i) => i + 1);
    } else {
      playWrong();
      setMisses((m) => m + 1);
      setWrong(true);
      setTimeout(() => setWrong(false), 400);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <ProgressBar value={idx} max={total} />
        <p className="text-center text-sm font-medium text-slate-700">
          {done ? "Você encontrou todos! 🎉" : `Encontre: ${targets[idx].label}`}
        </p>
      </div>

      <motion.div
        animate={wrong ? { x: [0, -6, 6, -6, 0] } : {}}
        transition={{ duration: 0.3 }}
        onClick={clickImage}
        className="relative mx-auto inline-block cursor-crosshair select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt="" className="max-h-[60vh] w-auto rounded-lg" draggable={false} />
        {targets.slice(0, idx).map((t) => (
          <span
            key={t.id}
            className="absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-emerald-500 shadow"
            style={{ left: `${t.x}%`, top: `${t.y}%` }}
          />
        ))}
      </motion.div>

      <p className="text-center text-xs text-slate-400">Erros: {misses}</p>

      {done && (
        <form action={action} className="space-y-2">
          {state.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
          <input type="hidden" name="gameId" value={gameId} />
          <input type="hidden" name="playerName" value={name} />
          <input type="hidden" name="classCode" value={classCode} />
          <input type="hidden" name="startedAt" value={startedAt} />
          <input type="hidden" name="score" value={score} />
          <Button type="submit" className="w-full" disabled={pending}>{pending ? "Enviando..." : "Ver resultado 🏆"}</Button>
        </form>
      )}
    </div>
  );
}
