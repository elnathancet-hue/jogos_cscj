// src/lib/auth/permissions.ts
//
// Espelho client-side do mapa de permissões do banco (role_permissions).
// O banco continua sendo a autoridade (RLS); isto serve para esconder/mostrar
// ações na UI. super_admin é tratado à parte (flag em profiles).

export type MemberRole = "org_admin" | "creator" | "collaborator" | "viewer";

export type Permission =
  | "users.view"
  | "users.invite"
  | "users.update"
  | "users.remove"
  | "games.create"
  | "games.view"
  | "games.update"
  | "games.delete"
  | "games.publish"
  | "results.view"
  | "organization.update"
  | "billing.view";

export const ROLE_PERMISSIONS: Record<MemberRole, Permission[]> = {
  org_admin: [
    "users.view",
    "users.invite",
    "users.update",
    "users.remove",
    "games.create",
    "games.view",
    "games.update",
    "games.delete",
    "games.publish",
    "results.view",
    "organization.update",
    "billing.view",
  ],
  creator: ["games.create", "games.view", "games.update", "games.publish", "results.view"],
  collaborator: ["games.view", "games.update"],
  viewer: ["games.view", "results.view"],
};

/** Verifica se um papel concede a permissão. super_admin: passe true em isSuperAdmin. */
export function hasPermission(
  role: MemberRole | null | undefined,
  permission: Permission,
  isSuperAdmin = false,
): boolean {
  if (isSuperAdmin) return true;
  if (!role) return false;
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export const ROLE_LABELS: Record<MemberRole, string> = {
  org_admin: "Administrador",
  creator: "Criador",
  collaborator: "Colaborador",
  viewer: "Observador",
};
