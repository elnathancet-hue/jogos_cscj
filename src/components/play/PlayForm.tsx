"use client";

import { useActionState, useState } from "react";

import { submitResultAction } from "@/app/play/[id]/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function PlayForm({ gameId }: { gameId: string }) {
  const [state, action, pending] = useActionState(submitResultAction, EMPTY_FORM_STATE);
  // Marca o início da sessão (para calcular a duração no servidor).
  const [startedAt] = useState(() => Date.now());

  if (state.message) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
        {state.message}
      </p>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <input type="hidden" name="gameId" value={gameId} />
      <input type="hidden" name="startedAt" value={startedAt} />

      <Field label="Seu nome ou apelido" htmlFor="playerName">
        <Input id="playerName" name="playerName" required autoComplete="off" />
      </Field>

      <Field label="Código da turma" htmlFor="classCode" hint="Opcional — só se a escola/museu informou.">
        <Input id="classCode" name="classCode" autoComplete="off" />
      </Field>

      <Field label="Pontuação" htmlFor="score" hint="Opcional (demonstração).">
        <Input id="score" name="score" type="number" min={0} defaultValue={0} />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Concluir"}
      </Button>
    </form>
  );
}
