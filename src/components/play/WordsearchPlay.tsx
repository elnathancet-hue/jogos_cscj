"use client";

import { useActionState, useEffect, useState } from "react";

import { submitResultAction, type PlayResultState } from "@/app/play/[id]/actions";
import { buildWordsearch, lineCells, scoreWordsearch } from "@/lib/games/wordsearch";
import { playCorrect, playClick } from "@/lib/play/sound";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PlayIntro } from "@/components/play/PlayIntro";
import { ResultScreen } from "@/components/play/ResultScreen";

const key = (r: number, c: number) => `${r},${c}`;

export function WordsearchPlay({
  gameId,
  words,
  autoStart,
  playerName,
  onFinish,
}: {
  gameId: string;
  words: string[];
  autoStart?: boolean;
  playerName?: string;
  onFinish?: () => void;
}) {
  const [grid] = useState(() => buildWordsearch(words));
  const [started, setStarted] = useState(!!autoStart);
  const [name, setName] = useState(playerName ?? "");
  const [classCode, setClassCode] = useState("");
  const [startedAt, setStartedAt] = useState(() => (autoStart ? Date.now() : 0));
  const [found, setFound] = useState<string[]>([]);
  const [foundCells, setFoundCells] = useState<Set<string>>(() => new Set());
  const [first, setFirst] = useState<{ r: number; c: number } | null>(null);
  const [state, action, pending] = useActionState(submitResultAction, {} as PlayResultState);

  useEffect(() => {
    if (state.message) onFinish?.();
  }, [state.message, onFinish]);

  const total = grid.words.length;
  const score = scoreWordsearch(total, found.length);

  if (state.message) {
    return <ResultScreen score={score} detail={`${found.length} de ${total} palavras`} rank={state.rank} total={state.total} leaderboard={state.leaderboard} />;
  }
  if (!started) {
    return <PlayIntro onStart={(n, c) => { setName(n); setClassCode(c); setStartedAt(Date.now()); setStarted(true); }} />;
  }

  function click(r: number, c: number) {
    if (!first) {
      playClick();
      setFirst({ r, c });
      return;
    }
    const cells = lineCells(first.r, first.c, r, c);
    setFirst(null);
    if (!cells) return;
    const str = cells.map((p) => grid.grid[p.r][p.c]).join("");
    const rev = str.split("").reverse().join("");
    const match = grid.words.find((w) => !found.includes(w) && (w === str || w === rev));
    if (match) {
      playCorrect();
      setFound((f) => [...f, match]);
      setFoundCells((s) => {
        const next = new Set(s);
        cells.forEach((p) => next.add(key(p.r, p.c)));
        return next;
      });
    }
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>}
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="playerName" value={name} />
      <input type="hidden" name="classCode" value={classCode} />
      <input type="hidden" name="startedAt" value={startedAt} />
      <input type="hidden" name="score" value={score} />

      <p className="text-center text-sm text-slate-500">Toque na 1ª e na última letra da palavra.</p>

      <div className="flex justify-center overflow-x-auto">
        <div className="inline-grid gap-0.5" style={{ gridTemplateColumns: `repeat(${grid.size}, 1.75rem)` }}>
          {grid.grid.flatMap((row, r) =>
            row.map((ch, c) => {
              const k = key(r, c);
              const isFound = foundCells.has(k);
              const isFirst = first?.r === r && first?.c === c;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => click(r, c)}
                  className={cn(
                    "h-7 w-7 rounded-sm text-center text-xs font-bold uppercase transition-colors",
                    isFound ? "bg-emerald-200 text-emerald-900" : isFirst ? "bg-blue-300 text-blue-900" : "bg-slate-100 text-slate-700 hover:bg-slate-200",
                  )}
                >
                  {ch}
                </button>
              );
            }),
          )}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {grid.words.map((w) => (
          <span key={w} className={cn("rounded-full px-2 py-0.5 text-xs font-medium", found.includes(w) ? "bg-emerald-100 text-emerald-700 line-through" : "bg-slate-100 text-slate-600")}>
            {w}
          </span>
        ))}
      </div>

      <Button type="submit" className="w-full" disabled={pending}>{pending ? "Enviando..." : "Finalizar e enviar"}</Button>
    </form>
  );
}
