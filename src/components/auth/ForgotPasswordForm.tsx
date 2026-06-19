"use client";

import { useActionState } from "react";
import Link from "next/link";

import { requestPasswordResetAction, type AuthState } from "@/app/auth/actions";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initial: AuthState = {};

export function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(
    requestPasswordResetAction,
    initial,
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

      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Enviando..." : "Enviar instruções"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        <Link href="/auth/login" className="text-blue-700 hover:underline">
          Voltar para o login
        </Link>
      </p>
    </form>
  );
}
