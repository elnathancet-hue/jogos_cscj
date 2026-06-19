"use client";

import { useActionState } from "react";
import Link from "next/link";

import { signUpAction, type AuthState } from "@/app/auth/actions";
import {
  ORGANIZATION_TYPES,
  ORGANIZATION_TYPE_LABELS,
} from "@/lib/schema/auth.schema";
import { Field } from "@/components/ui/Field";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

const initial: AuthState = {};

export function RegisterForm() {
  const [state, action, pending] = useActionState(signUpAction, initial);

  // Após o cadastro com confirmação de e-mail, mostramos só a mensagem.
  if (state.message) {
    return (
      <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
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

      <Field label="Seu nome" htmlFor="fullName">
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </Field>

      <Field label="E-mail" htmlFor="email">
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </Field>

      <Field
        label="Senha"
        htmlFor="password"
        hint="Mínimo de 8 caracteres."
      >
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
        />
      </Field>

      <Field label="Nome da organização" htmlFor="organizationName">
        <Input id="organizationName" name="organizationName" required />
      </Field>

      <Field label="Tipo de organização" htmlFor="organizationType">
        <Select id="organizationType" name="organizationType" defaultValue="school">
          {ORGANIZATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {ORGANIZATION_TYPE_LABELS[t]}
            </option>
          ))}
        </Select>
      </Field>

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-slate-600">
        Já tem conta?{" "}
        <Link href="/auth/login" className="text-blue-700 hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
