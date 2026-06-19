"use client";

import { useActionState, useEffect, useState } from "react";

import { submitResultAction } from "@/app/play/[id]/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { scoreMemory, type MemoryPair } from "@/lib/games/memory";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type Card = { key: string; pairId: string; label: string };

function buildDeck(pairs: MemoryPair[]): Card[] {
  const cards: Card[] = pairs.flatMap((p) => [
    { key: `${p.id}-a`, pairId: p.id, label: p.a },
    { key: `${p.id}-b`, pairId: p.id, label: p.b },
  ]);
  // embaralha (Fisher–Yates)
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function MemoryPlay({ gameId, pairs }: { gameId: string; pairs: MemoryPair[] }) {
  const [step, setStep] = useState<"intro" | "playing">("intro");
  const [name, setName] = useState("");
  const [classCode, setClassCode] = useState("");
  const [startedAt, setStartedAt] = useState(0);

  const [deck] = useState<Card[]>(() => buildDeck(pairs));
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);

  const [state, action, pending] = useActionState(submitResultAction, EMPTY_FORM_STATE);

  // Quando 2 cartas estão viradas, conta tentativa e resolve o par.
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
    return (
      <div className="space-y-3 text-center">
        <p className="text-sm text-slate-600">{state.message}</p>
        <p className="text-3xl font-bold text-slate-950">{score}/100</p>
        <p className="text-sm text-slate-500">{attempts} tentativas</p>
      </div>
    );
  }

  if (step === "intro") {
    return (
      <div className="space-y-4">
        <Field label="Seu nome ou apelido" htmlFor="playerName">
          <Input id="playerName" value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
        </Field>
        <Field label="Código da turma" htmlFor="classCode" hint="Opcional.">
          <Input id="classCode" value={classCode} onChange={(e) => setClassCode(e.target.value)} autoComplete="off" />
        </Field>
        <Button
          type="button"
          className="w-full"
          disabled={name.trim().length === 0}
          onClick={() => {
            setStartedAt(Date.now());
            setStep("playing");
          }}
        >
          Começar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-slate-500">
        Pares: {matched.length}/{pairs.length} · Tentativas: {attempts}
      </p>

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {deck.map((c) => {
          const isUp = flipped.includes(c.key) || matched.includes(c.pairId);
          return (
            <button
              key={c.key}
              type="button"
              disabled={isUp || flipped.length === 2}
              onClick={() => setFlipped((f) => (f.length < 2 ? [...f, c.key] : f))}
              className={cn(
                "flex h-20 items-center justify-center rounded-lg border p-2 text-center text-xs font-medium transition-colors",
                isUp
                  ? "border-blue-200 bg-blue-50 text-blue-900"
                  : "border-slate-200 bg-slate-100 text-transparent hover:bg-slate-200",
              )}
            >
              {isUp ? c.label : "?"}
            </button>
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
          <p className="text-center text-sm font-medium text-emerald-700">
            Completou! Pontuação {score}/100.
          </p>
          <Button type="submit" className="w-full" disabled={pending}>
            {pending ? "Enviando..." : "Enviar resultado"}
          </Button>
        </form>
      )}
    </div>
  );
}
