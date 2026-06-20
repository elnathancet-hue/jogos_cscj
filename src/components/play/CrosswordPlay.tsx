"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { submitResultAction, type PlayResultState } from "@/app/play/[id]/actions";
import {
  buildCrossword,
  scoreCrossword,
  type CrosswordEntry,
  type PlacedWord,
} from "@/lib/games/crossword";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { PlayIntro } from "@/components/play/PlayIntro";
import { ResultScreen } from "@/components/play/ResultScreen";

type Dir = "across" | "down";
const key = (r: number, c: number) => `${r},${c}`;

function cellsOf(w: PlacedWord) {
  return Array.from({ length: w.answer.length }, (_, i) => ({
    r: w.dir === "across" ? w.row : w.row + i,
    c: w.dir === "across" ? w.col + i : w.col,
  }));
}

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
  const [active, setActive] = useState<{ r: number; c: number } | null>(null);
  const [dir, setDir] = useState<Dir>("across");
  const [state, action, pending] = useActionState(submitResultAction, {} as PlayResultState);

  const inputs = useRef<Record<string, HTMLInputElement | null>>({});

  // mapa: célula -> palavras que passam por ela (por direção)
  const cellWords = useMemo(() => {
    const m: Record<string, Partial<Record<Dir, PlacedWord>>> = {};
    for (const w of layout.placed) {
      for (const { r, c } of cellsOf(w)) {
        (m[key(r, c)] ??= {})[w.dir] = w;
      }
    }
    return m;
  }, [layout]);

  const startNumber: Record<string, number> = {};
  for (const p of layout.placed) startNumber[key(p.row, p.col)] = p.number;

  const activeKey = active ? key(active.r, active.c) : null;
  const curWord =
    (activeKey && (cellWords[activeKey]?.[dir] ?? cellWords[activeKey]?.across ?? cellWords[activeKey]?.down)) ||
    null;
  const wordCells = curWord ? cellsOf(curWord) : [];
  const wordKeySet = new Set(wordCells.map((c) => key(c.r, c.c)));

  // células de palavras totalmente corretas (para tom verde)
  const correctCells = useMemo(() => {
    const s = new Set<string>();
    for (const w of layout.placed) {
      const cells = cellsOf(w);
      const ok = cells.every((cell, i) => (filled[key(cell.r, cell.c)] ?? "") === w.answer[i]);
      if (ok) cells.forEach((c) => s.add(key(c.r, c.c)));
    }
    return s;
  }, [filled, layout]);

  const { correct, total, score } = scoreCrossword(layout, filled);

  useEffect(() => {
    if (activeKey) inputs.current[activeKey]?.focus();
  }, [activeKey]);

  function focusCell(r: number, c: number) {
    const w = cellWords[key(r, c)];
    if (!w) return;
    setActive({ r, c });
    setDir((d) => (w[d] ? d : w.across ? "across" : "down"));
  }

  function focusWord(w: PlacedWord) {
    setActive({ r: w.row, c: w.col });
    setDir(w.dir);
  }

  function step(r: number, c: number, d: Dir, back = false) {
    const next = d === "across" ? { r, c: c + (back ? -1 : 1) } : { r: r + (back ? -1 : 1), c };
    if (key(next.r, next.c) in layout.cells) {
      setActive(next);
      setDir(d);
    }
  }

  function onType(r: number, c: number, raw: string) {
    const ch = raw.normalize("NFD").toUpperCase().replace(/[^A-Z]/g, "").slice(-1);
    setFilled((f) => ({ ...f, [key(r, c)]: ch }));
    if (ch && curWord) {
      // avança dentro da palavra atual
      const idx = wordCells.findIndex((cell) => cell.r === r && cell.c === c);
      const nxt = wordCells[idx + 1];
      if (nxt) setActive({ r: nxt.r, c: nxt.c });
    }
  }

  function onKeyDown(e: React.KeyboardEvent, r: number, c: number) {
    if (e.key === "ArrowRight") { e.preventDefault(); step(r, c, "across"); }
    else if (e.key === "ArrowLeft") { e.preventDefault(); step(r, c, "across", true); }
    else if (e.key === "ArrowDown") { e.preventDefault(); step(r, c, "down"); }
    else if (e.key === "ArrowUp") { e.preventDefault(); step(r, c, "down", true); }
    else if (e.key === "Backspace") {
      e.preventDefault();
      if (filled[key(r, c)]) {
        setFilled((f) => ({ ...f, [key(r, c)]: "" }));
      } else if (curWord) {
        const idx = wordCells.findIndex((cell) => cell.r === r && cell.c === c);
        const prev = wordCells[idx - 1];
        if (prev) {
          setActive({ r: prev.r, c: prev.c });
          setFilled((f) => ({ ...f, [key(prev.r, prev.c)]: "" }));
        }
      }
    }
  }

  if (state.message) {
    return (
      <ResultScreen
        score={score}
        detail={`${correct} de ${total} palavras`}
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

  const across = layout.placed.filter((p) => p.dir === "across").sort((a, b) => a.number - b.number);
  const down = layout.placed.filter((p) => p.dir === "down").sort((a, b) => a.number - b.number);

  function clueRow(p: PlacedWord) {
    return (
      <li key={p.id}>
        <button
          type="button"
          onClick={() => focusWord(p)}
          className={cn(
            "w-full rounded px-1 py-0.5 text-left transition-colors",
            curWord?.id === p.id ? "bg-blue-50 text-blue-900" : "text-slate-600 hover:bg-slate-50",
          )}
        >
          <span className="font-medium text-slate-900">{p.number}.</span> {p.clue}
        </button>
      </li>
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
              const isActive = activeKey === cellKey;
              const inWord = wordKeySet.has(cellKey);
              const isCorrect = correctCells.has(cellKey);
              return (
                <div key={cellKey} className="relative h-8 w-8">
                  {num && (
                    <span className="pointer-events-none absolute left-0 top-0 z-10 px-0.5 text-[8px] leading-none text-slate-500">
                      {num}
                    </span>
                  )}
                  <input
                    ref={(el) => {
                      inputs.current[cellKey] = el;
                    }}
                    value={filled[cellKey] ?? ""}
                    onFocus={() => focusCell(r, c)}
                    onClick={() => {
                      if (isActive) {
                        const w = cellWords[cellKey];
                        if (w?.across && w?.down) setDir((d) => (d === "across" ? "down" : "across"));
                      }
                    }}
                    onChange={(e) => onType(r, c, e.target.value)}
                    onKeyDown={(e) => onKeyDown(e, r, c)}
                    maxLength={1}
                    className={cn(
                      "h-8 w-8 rounded-sm border text-center text-sm font-semibold uppercase outline-none transition-colors",
                      isActive
                        ? "border-blue-500 bg-blue-100 text-blue-900"
                        : inWord
                          ? "border-blue-200 bg-blue-50 text-slate-900"
                          : isCorrect
                            ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                            : "border-slate-300 bg-white text-slate-900",
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
          <ul className="space-y-0.5 text-sm">{across.map(clueRow)}</ul>
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold text-slate-700">Verticais</p>
          <ul className="space-y-0.5 text-sm">{down.map(clueRow)}</ul>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Enviando..." : "Finalizar e enviar"}
      </Button>
    </form>
  );
}
