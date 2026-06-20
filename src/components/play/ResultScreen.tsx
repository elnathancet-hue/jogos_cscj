"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { Confetti } from "@/components/play/Confetti";
import { playWin } from "@/lib/play/sound";
import type { LeaderboardRow } from "@/app/play/[id]/actions";

function useCountUp(target: number, ms = 900) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / ms);
      setValue(Math.round(target * p));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return value;
}

function tierFor(score: number) {
  if (score >= 85) return { medal: "🥇", stars: 3, t: "Excelente!", c: "text-amber-600" };
  if (score >= 60) return { medal: "🥈", stars: 2, t: "Muito bom!", c: "text-slate-600" };
  if (score >= 30) return { medal: "🥉", stars: 1, t: "Bom trabalho!", c: "text-orange-700" };
  return { medal: "🎮", stars: 0, t: "Quase lá!", c: "text-slate-600" };
}

export function ResultScreen({
  score,
  detail,
  rank,
  total,
  leaderboard,
  label = "pontos de 100",
}: {
  score: number;
  detail?: string;
  rank?: number;
  total?: number;
  leaderboard?: LeaderboardRow[];
  label?: string;
}) {
  const value = useCountUp(score);
  const tier = tierFor(score);

  useEffect(() => {
    playWin();
  }, []);

  return (
    <div className="relative">
      {score >= 70 && <Confetti />}

      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="space-y-2 py-2 text-center"
      >
        <motion.div
          initial={{ scale: 0, rotate: -30 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 12 }}
          className="text-6xl"
        >
          {tier.medal}
        </motion.div>

        <div className="flex items-center justify-center gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.35 + i * 0.18, type: "spring", stiffness: 300, damping: 12 }}
              className={`text-2xl ${i < tier.stars ? "" : "opacity-25 grayscale"}`}
            >
              ⭐
            </motion.span>
          ))}
        </div>

        <p className={`font-display text-lg font-semibold ${tier.c}`}>{tier.t}</p>
        <p className="font-display text-5xl font-bold tabular-nums text-slate-950">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {detail && <p className="text-sm text-slate-600">{detail}</p>}

        {rank && total ? (
          <p className="pt-1 text-sm font-medium text-slate-900">
            Você ficou em <span className="text-blue-700">#{rank}</span> de {total}
          </p>
        ) : null}
      </motion.div>

      {leaderboard && leaderboard.length > 0 && (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">
            🏆 Ranking
          </p>
          <ul className="space-y-1 text-sm">
            {leaderboard.map((row, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="truncate text-slate-700">
                  <span className="inline-block w-5 font-semibold text-slate-400">{i + 1}.</span>
                  {row.player_name}
                </span>
                <span className="font-semibold tabular-nums text-slate-900">{row.score}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
