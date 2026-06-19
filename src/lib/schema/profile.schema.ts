// src/lib/schema/profile.schema.ts
import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, "Informe seu nome."),
  phone: z
    .string()
    .max(30, "Telefone muito longo.")
    .optional()
    .or(z.literal("")),
  avatarUrl: z
    .string()
    .url("URL inválida.")
    .max(1000)
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
