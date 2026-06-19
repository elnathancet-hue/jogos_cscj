"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signInAction, type AuthState } from "@/app/auth/actions";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const initial: AuthState = {};

export function LoginForm() {
  const [state, action, pending] = useActionState(signInAction, initial);

  return (
    <form action={action} className="space-y-4">
      {state.error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field label="Senha" htmlFor="password">
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando..." : "Entrar"}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Link href="/auth/forgot-password" className="text-blue-700 hover:underline">
          Esqueci minha senha
        </Link>
        <Link href="/auth/register" className="text-blue-700 hover:underline">
          Criar conta
        </Link>
      </div>
    </form>
  );
}
