"use client";

import { useActionState } from "react";

import { inviteMemberAction } from "@/app/dashboard/team/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { ASSIGNABLE_ROLES } from "@/lib/schema/team.schema";
import { ROLE_LABELS } from "@/lib/auth/permissions";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export function InviteForm() {
  const [state, action, pending] = useActionState(
    inviteMemberAction,
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

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <Field label="E-mail" htmlFor="invite-email" className="flex-1">
          <Input id="invite-email" name="email" type="email" required />
        </Field>

        <Field label="Papel" htmlFor="invite-role" className="sm:w-48">
          <Select id="invite-role" name="role" defaultValue="viewer">
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </Select>
        </Field>

        <Button type="submit" disabled={pending}>
          {pending ? "Convidando..." : "Convidar"}
        </Button>
      </div>
    </form>
  );
}
