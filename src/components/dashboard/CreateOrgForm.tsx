"use client";

import { useActionState } from "react";

import { createOrganizationAction } from "@/app/dashboard/organizations/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import {
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/schema/auth.schema";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export function CreateOrgForm() {
  const [state, action, pending] = useActionState(
    createOrganizationAction,
    EMPTY_FORM_STATE,
  );

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Field label="Nome" htmlFor="org-name" className="flex-1">
          <Input id="org-name" name="name" required />
        </Field>

        <Field label="Tipo" htmlFor="org-type" className="sm:w-48">
          <Select id="org-type" name="organizationType" defaultValue="school">
            {ORGANIZATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {ORGANIZATION_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="submit" disabled={pending}>
          {pending ? "Criando..." : "Criar organização"}
        </Button>
      </div>
    </form>
  );
}
