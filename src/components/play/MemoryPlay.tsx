"use client";

import { useActionState, useEffect, useState } from "react";
import { motion } from "framer-motion";

import { submitResultAction } from "@/app/play/[id]/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { scoreMemory, type MemoryPair } from "@/lib/games/memory";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PlayIntro } from "@/components/play/PlayIntro";
import { ResultScreen } from "@/components/play/ResultScreen";
import { ProgressBar } from "@/components/play/ProgressBar";

type Card = { key: string; pairId: string; label: string };

function buildDeck(pairs: MemoryPair[]): Card[] {
  const cards: Card[] = pairs.flatMap((p) => [
    { key: `${p.id}-a`, pairId: p.id, label: p.a },
    { key: `${p.id}-b`, pairId: p.id, label: p.b },
  ]);
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function MemoryPlay({ gameId, pairs }: { gameId: string; pairs: MemoryPair[] }) {
  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [startedAt, setStartedAt] = useState(0);

  const [deck] = useState<Card[]>(() => buildDeck(pairs));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);

  const [state, action, pending] = useActionState(submitResultAction, EMPTY_FORM_STATE);

  useEffect(() => {
    if (flipped.length !== 2) return;
    setAttempts((a) => a + 1);
    const [k1, k2] = flipped;
    const c1 = deck.find((c) => c.key === k1)!;
    const c2 = deck.find((c) => c.key === k2)!;
    if (c1.pairId === c2.pairId) {
      setMatched((m) => [...m, c1.pairId]);
      setFlipped([]);
    } else {
      const t = setTimeout(() => setFlipped([]), 900);
      return () => clearTimeout(t);
    }
  }, [flipped, deck]);

  const done = matched.length === pairs.length;
  const score = scoreMemory(pairs.length, attempts);

  if (state.message) {
    return <ResultScreen score={score} detail={`${attempts} tentativas`} />;
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
    <div className="space-y-4">
      <div className="space-y-1">
        <ProgressBar value={matched.length} max={pairs.length} />
        <p className="text-right text-xs text-slate-400">
          {matched.length}/{pairs.length} pares · {attempts} tentativas
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {deck.map((c) => {
          const isUp = flipped.includes(c.key) || matched.includes(c.pairId);
          const isMatched = matched.includes(c.pairId);
          return (
            <motion.button
              key={c.key}
              type="button"
              disabled={isUp || flipped.length === 2}
              onClick={() => setFlipped((f) => (f.length < 2 ? [...f, c.key] : f))}
              whileTap={{ scale: 0.94 }}
              animate={isMatched ? { scale: [1, 1.08, 1] } : {}}
              className={cn(
                "flex h-20 items-center justify-center rounded-lg border p-2 text-center text-xs font-medium transition-colors",
                isMatched
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : isUp
                    ? "border-blue-200 bg-blue-50 text-blue-900"
                    : "border-slate-200 bg-slate-100 text-transparent hover:bg-slate-200",
              )}
            >
              {isUp ? c.label : "?"}
            </motion.button>
          );
        })}
      </div>

      {done && (
        <form action={action} className="space-y-3">
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
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Enviar resultado"}
          </Button>
        </form>
      )}
    </div>
  );
}
