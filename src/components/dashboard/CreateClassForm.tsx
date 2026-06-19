"use client";

import { useActionState } from "react";

import { createClassAction } from "@/app/dashboard/classes/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";

export function CreateClassForm() {
  const [state, action, pending] = useActionState(
    createClassAction,
    EMPTY_FORM_STATE,
  );

  return (
    <form action={action} className="space-y-4">
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

      <Field label="Nome" htmlFor="class-name">
        <Input id="class-name" name="name" placeholder="Ex.: 5º ano A / Visita 14h" required />
      </Field>

      <Field label="Descrição" htmlFor="class-description" hint="Opcional.">
        <Textarea id="class-description" name="description" rows={2} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Criando..." : "Criar turma"}
      </Button>
    </form>
  );
}
