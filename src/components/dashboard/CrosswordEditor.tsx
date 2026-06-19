"use client";

import { useActionState, useState } from "react";

import { updateGameContentAction } from "@/app/dashboard/games/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import type { CrosswordEntry } from "@/lib/games/crossword";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function newEntry(): CrosswordEntry {
  return { id: crypto.randomUUID(), answer: "", clue: "" };
}

export function CrosswordEditor({
  gameId,
  initialEntries,
}: {
  gameId: string;
  initialEntries: CrosswordEntry[];
}) {
  const [entries, setEntries] = useState<CrosswordEntry[]>(
    initialEntries.length ? initialEntries : [newEntry(), newEntry()],
  );
  const [state, action, pending] = useActionState(updateGameContentAction, EMPTY_FORM_STATE);

  function patch(id: string, fn: (e: CrosswordEntry) => CrosswordEntry) {
    setEntries((es) => es.map((e) => (e.id === id ? fn(e) : e)));
  }

  const settingsJson = JSON.stringify({ type: "crossword", entries });

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
        Palavra (só letras, sem espaços) + dica. A grade é montada automaticamente cruzando letras.
      </p>

      {entries.map((e, i) => (
        <div key={e.id} className="flex items-end gap-2">
          <Field label={`Palavra ${i + 1}`} className="w-40">
            <Input
              value={e.answer}
              onChange={(ev) => patch(e.id, (x) => ({ ...x, answer: ev.target.value }))}
            />
          </Field>
          <Field label="Dica" className="flex-1">
            <Input
              value={e.clue}
              onChange={(ev) => patch(e.id, (x) => ({ ...x, clue: ev.target.value }))}
            />
          </Field>
          {entries.length > 2 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setEntries((es) => es.filter((x) => x.id !== e.id))}
            >
              ✕
            </Button>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3">
        {entries.length < 20 && (
          <Button type="button" variant="secondary" onClick={() => setEntries((es) => [...es, newEntry()])}>
            + Adicionar palavra
          </Button>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar conteúdo"}
        </Button>
      </div>
    </form>
  );
}
