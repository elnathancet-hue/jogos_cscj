"use client";

import { useActionState, useState } from "react";

import { updateGameContentAction } from "@/app/dashboard/games/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import type { MemoryPair } from "@/lib/games/memory";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function newPair(): MemoryPair {
  return { id: crypto.randomUUID(), a: "", b: "" };
}

export function MemoryEditor({
  gameId,
  initialPairs,
}: {
  gameId: string;
  initialPairs: MemoryPair[];
}) {
  const [pairs, setPairs] = useState<MemoryPair[]>(
    initialPairs.length ? initialPairs : [newPair(), newPair()],
  );
  const [state, action, pending] = useActionState(updateGameContentAction, EMPTY_FORM_STATE);

  function patch(id: string, fn: (p: MemoryPair) => MemoryPair) {
    setPairs((ps) => ps.map((p) => (p.id === id ? fn(p) : p)));
  }

  const settingsJson = JSON.stringify({ type: "memory", pairs });

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="settings" value={settingsJson} />

      {state.message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.message}
        </p>
      )}
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <p className="text-sm text-slate-600">
        Cada par vira duas cartas que o jogador precisa associar.
      </p>

      {pairs.map((p, i) => (
        <div key={p.id} className="flex items-end gap-2">
          <Field label={`Par ${i + 1} — lado A`} className="flex-1">
            <Input
              value={p.a}
              onChange={(e) => patch(p.id, (x) => ({ ...x, a: e.target.value }))}
            />
          </Field>
          <Field label="lado B" className="flex-1">
            <Input
              value={p.b}
              onChange={(e) => patch(p.id, (x) => ({ ...x, b: e.target.value }))}
            />
          </Field>
          {pairs.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPairs((ps) => ps.filter((x) => x.id !== p.id))}
            >
              ✕
            </Button>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3">
        {pairs.length < 12 && (
          <Button type="button" variant="secondary" onClick={() => setPairs((ps) => [...ps, newPair()])}>
            + Adicionar par
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar conteúdo"}
        </Button>
      </div>
    </form>
  );
}
