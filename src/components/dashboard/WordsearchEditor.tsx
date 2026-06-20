"use client";

import { useActionState, useState } from "react";

import { updateGameContentAction } from "@/app/dashboard/games/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function WordsearchEditor({
  gameId,
  initialWords,
}: {
  gameId: string;
  initialWords: string[];
}) {
  const [words, setWords] = useState<string[]>(
    initialWords.length ? initialWords : ["", ""],
  );
  const [state, action, pending] = useActionState(updateGameContentAction, EMPTY_FORM_STATE);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="gameId" value={gameId} />
      <input
        type="hidden"
        name="settings"
        value={JSON.stringify({ type: "wordsearch", words: words.map((w) => w.trim()).filter(Boolean) })}
      />

      {state.message && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.message}</p>
      )}
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      )}

      <p className="text-sm text-slate-600">Palavras (só letras, sem espaços). A grade é gerada automaticamente.</p>

      <div className="space-y-2">
        {words.map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <Field label={`Palavra ${i + 1}`} className="flex-1">
              <Input value={w} onChange={(e) => setWords((xs) => xs.map((x, j) => (j === i ? e.target.value : x)))} />
            </Field>
            {words.length > 2 && (
              <Button type="button" variant="ghost" size="sm" className="mt-6" onClick={() => setWords((xs) => xs.filter((_, j) => j !== i))}>✕</Button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {words.length < 12 && (
          <Button type="button" variant="secondary" onClick={() => setWords((xs) => [...xs, ""])}>+ Adicionar palavra</Button>
        )}
        <Button type="submit" disabled={pending}>{pending ? "Salvando..." : "Salvar conteúdo"}</Button>
      </div>
    </form>
  );
}
