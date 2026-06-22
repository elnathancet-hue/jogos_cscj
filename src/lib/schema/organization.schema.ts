// src/lib/schema/organization.schema.ts
import { z } from "zod";
import { ORGANIZATION_TYPES } from "@/lib/schema/auth.schema";

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const themeSchema = z.object({
  preset: z.enum(["arcade", "museum", "school", "night", "custom"]),
  accent: hex.optional(),
  bgFrom: hex.optional(),
  bgTo: hex.optional(),
  font: z.enum(["playful", "elegant", "clean"]).optional(),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, "Informe o nome da organização."),
  organizationType: z.enum(ORGANIZATION_TYPES),
  primaryColor: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use uma cor hex (ex.: #f59e0b).")
    .optional()
    .or(z.literal("")),
  logoUrl: z.string().url("URL inválida.").max(1000).optional().or(z.literal("")),
});

export type UpdateOrganizationInput = z.infer<typeof updateOrganizationSchema>;
