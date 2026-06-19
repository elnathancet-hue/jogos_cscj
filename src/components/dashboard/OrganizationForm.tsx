"use client";

import { useActionState } from "react";

import { updateOrganizationAction } from "@/app/dashboard/organization/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import {
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/schema/auth.schema";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

type OrganizationFormProps = {
  canEdit: boolean;
  defaults: {
    id: string;
    name: string;
    slug: string;
    organizationType: (typeof ORGANIZATION_TYPES)[number];
    primaryColor: string;
    logoUrl: string;
  };
};

export function OrganizationForm({ canEdit, defaults }: OrganizationFormProps) {
  const [state, action, pending] = useActionState(
    updateOrganizationAction,
    EMPTY_FORM_STATE,
  );

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="organizationId" value={defaults.id} />

      {!canEdit && (
        <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
          Apenas administradores podem editar a organização.
        </p>
      )}
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

      <Field label="Nome" htmlFor="name">
        <Input id="name" name="name" defaultValue={defaults.name} disabled={!canEdit} required />
      </Field>

      <Field label="Identificador (slug)" hint="Gerado automaticamente; não editável por aqui.">
        <Input value={defaults.slug} disabled readOnly />
      </Field>

      <Field label="Tipo" htmlFor="organizationType">
        <Select
          id="organizationType"
          name="organizationType"
          defaultValue={defaults.organizationType}
          disabled={!canEdit}
        >
          {ORGANIZATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {ORGANIZATION_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Cor principal" htmlFor="primaryColor" hint="Hex, ex.: #f59e0b.">
        <Input
          id="primaryColor"
          name="primaryColor"
          defaultValue={defaults.primaryColor}
          placeholder="#2563eb"
          disabled={!canEdit}
        />
      </Field>

      <Field label="Logo (URL)" htmlFor="logoUrl">
        <Input id="logoUrl" name="logoUrl" defaultValue={defaults.logoUrl} disabled={!canEdit} />
      </Field>

      {canEdit && (
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar"}
        </Button>
      )}
    </form>
  );
}
