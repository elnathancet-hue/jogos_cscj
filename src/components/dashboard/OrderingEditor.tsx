"use client";

import { useActionState, useState } from "react";

import { updateGameContentAction } from "@/app/dashboard/games/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import type { OrderingItem } from "@/lib/games/ordering";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function newItem(): OrderingItem {
  return { id: crypto.randomUUID(), text: "" };
}

export function OrderingEditor({
  gameId,
  initialPrompt,
  initialItems,
}: {
  gameId: string;
  initialPrompt: string;
  initialItems: OrderingItem[];
}) {
  const [prompt, setPrompt] = useState(initialPrompt);
  const [items, setItems] = useState<OrderingItem[]>(
    initialItems.length ? initialItems : [newItem(), newItem()],
  );
  const [state, action, pending] = useActionState(updateGameContentAction, EMPTY_FORM_STATE);

  function move(i: number, dir: -1 | 1) {
    setItems((xs) => {
      const j = i + dir;
      if (j < 0 || j >= xs.length) return xs;
      const copy = [...xs];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
  }

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="settings" value={JSON.stringify({ type: "ordering", prompt, items })} />

      {state.message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>
      )}
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <Field label="Enunciado" hint="Ex.: Coloque os eventos em ordem cronológica.">
        <Input value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      </Field>

      <p className="text-sm text-slate-600">Liste na <strong>ordem correta</strong> (o jogo embaralha pro jogador).</p>

      <ol className="space-y-2">
        {items.map((it, i) => (
          <li key={it.id} className="flex items-center gap-2">
            <span className="w-5 text-center text-sm font-semibold text-slate-400">{i + 1}</span>
            <Input
              value={it.text}
              onChange={(e) => setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, text: e.target.value } : x)))}
            />
            <Button type="button" variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</Button>
            {items.length > 2 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))}>✕</Button>
            )}
          </li>
        ))}
      </ol>

      <div className="flex items-center gap-3">
        {items.length < 12 && (
          <Button type="button" variant="secondary" onClick={() => setItems((xs) => [...xs, newItem()])}>+ Adicionar item</Button>
        )}
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar conteúdo"}</Button>
      </div>
    </form>
  );
}
