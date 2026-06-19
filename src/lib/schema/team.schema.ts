// src/lib/schema/team.schema.ts
import { z } from "zod";

// Papéis convidáveis/atribuíveis (não inclui super_admin, que é da plataforma).
export const ASSIGNABLE_ROLES = [
  "org_admin",
  "creator",
  "collaborator",
  "viewer",
] as const;

export const inviteMemberSchema = z.object({
  email: z.string().email("E-mail inválido."),
  role: z.enum(ASSIGNABLE_ROLES),
});

export const changeRoleSchema = z.object({
  memberId: z.string().uuid(),
  role: z.enum(ASSIGNABLE_ROLES),
});

export const memberIdSchema = z.object({ memberId: z.string().uuid() });
export const invitationIdSchema = z.object({ invitationId: z.string().uuid() });
