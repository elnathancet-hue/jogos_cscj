"use client";

import { useActionState, useState } from "react";

import { updateGameContentAction } from "@/app/dashboard/games/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import type { TrueFalseStatement } from "@/lib/games/truefalse";
import { cn } from "@/lib/utils";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function newStatement(): TrueFalseStatement {
  return { id: crypto.randomUUID(), text: "", answer: true };
}

export function TrueFalseEditor({
  gameId,
  initial,
}: {
  gameId: string;
  initial: TrueFalseStatement[];
}) {
  const [items, setItems] = useState<TrueFalseStatement[]>(
    initial.length ? initial : [newStatement()],
  );
  const [state, action, pending] = useActionState(updateGameContentAction, EMPTY_FORM_STATE);

  function patch(id: string, fn: (s: TrueFalseStatement) => TrueFalseStatement) {
    setItems((xs) => xs.map((x) => (x.id === id ? fn(x) : x)));
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="settings" value={JSON.stringify({ type: "truefalse", statements: items })} />

      {state.message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>
      )}
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      {items.map((s, i) => (
        <div key={s.id} className="flex items-end gap-2">
          <Field label={`Afirmação ${i + 1}`} className="flex-1">
            <Input value={s.text} onChange={(e) => patch(s.id, (x) => ({ ...x, text: e.target.value }))} />
          </Field>
          <div className="flex overflow-hidden rounded-lg border border-slate-200">
            {([true, false] as const).map((v) => (
              <button
                key={String(v)}
                type="button"
                onClick={() => patch(s.id, (x) => ({ ...x, answer: v }))}
                className={cn(
                  "px-3 py-2 text-sm font-medium",
                  s.answer === v
                    ? v
                      ? "bg-emerald-600 text-white"
                      : "bg-red-600 text-white"
                    : "bg-white text-slate-600",
                )}
              >
                {v ? "V" : "F"}
              </button>
            ))}
          </div>
          {items.length > 1 && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setItems((xs) => xs.filter((x) => x.id !== s.id))}>
              ✕
            </Button>
          )}
        </div>
      ))}

      <div className="flex items-center gap-3">
        {items.length < 30 && (
          <Button type="button" variant="secondary" onClick={() => setItems((xs) => [...xs, newStatement()])}>
            + Adicionar afirmação
          </Button>
        )}
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar conteúdo"}</Button>
      </div>
    </form>
  );
}
