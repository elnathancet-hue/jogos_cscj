"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

import { Confetti } from "@/components/play/Confetti";

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

export function ResultScreen({
  score,
  detail,
  label = "pontos de 100",
}: {
  score: number;
  detail?: string;
  label?: string;
}) {
  const value = useCountUp(score);
  const tier =
    score >= 80
      ? { t: "Excelente! 🎉", c: "text-emerald-600" }
      : score >= 50
        ? { t: "Bom trabalho! 👏", c: "text-blue-600" }
        : { t: "Continue tentando! 💪", c: "text-slate-600" };

  return (
    <div className="relative">
      {score >= 70 && <Confetti />}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 15 }}
        className="space-y-1 py-4 text-center"
      >
        <p className={`text-sm font-semibold ${tier.c}`}>{tier.t}</p>
        <p className="text-5xl font-bold tabular-nums text-slate-950">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
        {detail && <p className="pt-1 text-sm text-slate-600">{detail}</p>}
      </motion.div>
    </div>
  );
}
