"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/app/dashboard/profile/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

type ProfileFormProps = {
  defaults: { fullName: string; phone: string; avatarUrl: string; email: string };
};

export function ProfileForm({ defaults }: ProfileFormProps) {
  const [state, action, pending] = useActionState(
    updateProfileAction,
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

      <Field label="E-mail">
        <Input value={defaults.email} disabled readOnly />
      </Field>

      <Field label="Nome" htmlFor="fullName">
        <Input id="fullName" name="fullName" defaultValue={defaults.fullName} required />
      </Field>

      <Field label="Telefone" htmlFor="phone" hint="Opcional.">
        <Input id="phone" name="phone" defaultValue={defaults.phone} />
      </Field>

      <Field
        label="Foto (URL)"
        htmlFor="avatarUrl"
        hint="Cole a URL de uma imagem. Upload direto entra numa próxima etapa."
      >
        <Input id="avatarUrl" name="avatarUrl" defaultValue={defaults.avatarUrl} />
      </Field>

      <Button type="submit" disabled={pending}>
        {pending ? "Salvando..." : "Salvar"}
      </Button>
    </form>
  );
}
