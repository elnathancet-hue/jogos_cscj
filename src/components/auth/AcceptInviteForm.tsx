"use client";

import { useActionState } from "react";

import { acceptInviteAction } from "@/app/auth/accept-invite/actions";
import { EMPTY_FORM_STATE } from "@/lib/forms";
import { Button } from "@/components/ui/Button";

export function AcceptInviteForm({ token }: { token: string }) {
  const [state, action, pending] = useActionState(
    acceptInviteAction,
    EMPTY_FORM_STATE,
  );

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <input type="hidden" name="token" value={token} />
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando na organização..." : "Aceitar convite"}
      </Button>
    </form>
  );
}
