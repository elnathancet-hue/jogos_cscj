// src/lib/schema/auth.schema.ts
//
// Schemas Zod compartilhados entre as telas (client) e as server actions.

import { z } from "zod";

export const ORGANIZATION_TYPES = [
  "school",
  "museum",
  "company",
  "cultural_project",
  "other",
] as const;

export const ORGANIZATION_TYPE_LABELS: Record<
  (typeof ORGANIZATION_TYPES)[number],
  string
> = {
  school: "Escola",
  museum: "Museu",
  company: "Empresa",
  cultural_project: "Projeto cultural",
  other: "Outro",
};

export const signInSchema = z.object({
  email: z.string().email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});

export const signUpSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome."),
  email: z.string().email("E-mail inválido."),
  password: z.string().min(8, "A senha precisa ter ao menos 8 caracteres."),
  organizationName: z.string().min(2, "Informe o nome da organização."),
  organizationType: z.enum(ORGANIZATION_TYPES),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("E-mail inválido."),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
