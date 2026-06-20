"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { createClient } from "@/lib/supabase/client";

type Row = { player_name: string; score: number };

const MEDALS = ["🥇", "🥈", "🥉"];

export function LiveRanking({
  gameId,
  intervalMs = 9000,
  limit = 5,
}: {
  gameId: string;
  intervalMs?: number;
  limit?: number;
}) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    async function load() {
      const { data } = await supabase.rpc("get_game_leaderboard", {
        p_game_id: gameId,
        p_limit: limit,
      });
      if (active && Array.isArray(data)) setRows(data as Row[]);
    }
    load();
    const t = setInterval(load, intervalMs);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [gameId, intervalMs, limit]);

  return (
    <div className="w-full max-w-xs rounded-2xl bg-white/10 p-4 backdrop-blur-sm">
      <p className="mb-2 flex items-center justify-center gap-1 text-sm font-semibold uppercase tracking-wide text-white/90">
        🏆 Ranking ao vivo
        <span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
      </p>
      {rows.length === 0 ? (
        <p className="text-center text-sm text-white/70">Seja o primeiro a jogar!</p>
      ) : (
        <ul className="space-y-1">
          <AnimatePresence initial={false}>
            {rows.map((row, i) => (
              <motion.li
                key={`${row.player_name}-${i}`}
                layout
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-between gap-2 text-sm text-white"
              >
                <span className="flex min-w-0 items-center gap-1">
                  <span className="w-5 text-center">{MEDALS[i] ?? i + 1}</span>
                  <span className="truncate">{row.player_name}</span>
                </span>
                <span className="font-bold tabular-nums">{row.score}</span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
