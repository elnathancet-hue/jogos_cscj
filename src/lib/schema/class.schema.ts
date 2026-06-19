// src/lib/schema/class.schema.ts
import { z } from "zod";

export const classFormSchema = z.object({
  name: z.string().min(2, "Informe o nome da turma/público.").max(120),
  description: z.string().max(2000).optional().or(z.literal("")),
});

export type ClassFormInput = z.infer<typeof classFormSchema>;
