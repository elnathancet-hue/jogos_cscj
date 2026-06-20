"use client";

import { useActionState, useState } from "react";

import { submitResultAction } from "@/app/play/[id]/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import {
  buildCrossword,
  scoreCrossword,
  type CrosswordEntry,
} from "@/lib/games/crossword";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PlayIntro } from "@/components/play/PlayIntro";
import { ResultScreen } from "@/components/play/ResultScreen";

const key = (r: number, c: number) => `${r},${c}`;

export function CrosswordPlay({
  gameId,
  entries,
}: {
  gameId: string;
  entries: CrosswordEntry[];
}) {
  const [layout] = useState(() => buildCrossword(entries));
  const [started, setStarted] = useState(false);
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [startedAt, setStartedAt] = useState(0);
  const [filled, setFilled] = useState<Record<string, string>>({});
  const [state, action, pending] = useActionState(submitResultAction, EMPTY_FORM_STATE);

  const { correct, total, score } = scoreCrossword(layout, filled);

  const startNumber: Record<string, number> = {};
  for (const p of layout.placed) startNumber[key(p.row, p.col)] = p.number;
  const across = layout.placed.filter((p) => p.dir === "across").sort((a, b) => a.number - b.number);
  const down = layout.placed.filter((p) => p.dir === "down").sort((a, b) => a.number - b.number);

  if (state.message) {
    return <ResultScreen score={score} detail={`${correct} de ${total} palavras`} />;
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

      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${layout.cols}, 2rem)` }}
        >
          {Array.from({ length: layout.rows }).flatMap((_, r) =>
            Array.from({ length: layout.cols }).map((_, c) => {
              const cellKey = key(r, c);
              if (!(cellKey in layout.cells)) return <div key={cellKey} className="h-8 w-8" />;
              const num = startNumber[cellKey];
              return (
                <div key={cellKey} className="relative h-8 w-8">
                  {num && (
                    <span className="absolute left-0 top-0 z-10 px-0.5 text-[8px] leading-none text-slate-500">
                      {num}
                    </span>
                  )}
                  <input
                    value={filled[cellKey] ?? ""}
                    onChange={(e) =>
                      setFilled((f) => ({ ...f, [cellKey]: e.target.value.slice(-1).toUpperCase() }))
                    }
                    maxLength={1}
                    className={cn(
                      "h-8 w-8 rounded-sm border border-slate-300 text-center text-sm uppercase",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
                    )}
                  />
                </div>
              );
            }),
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-700">Horizontais</p>
          <ul className="space-y-1 text-sm text-slate-600">
            {across.map((p) => (
              <li key={p.id}>
                <span className="font-medium text-slate-900">{p.number}.</span> {p.clue}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-700">Verticais</p>
          <ul className="space-y-1 text-sm text-slate-600">
            {down.map((p) => (
              <li key={p.id}>
                <span className="font-medium text-slate-900">{p.number}.</span> {p.clue}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Finalizar e enviar"}
      </Button>
    </form>
  );
}
