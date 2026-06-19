// src/lib/auth/org.ts
import "server-only";

import { cookies } from "next/headers";

import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/auth/permissions";

export const ACTIVE_ORG_COOKIE = "active_org";

export type OrgSummary = {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  primary_color: string | null;
  organization_type: "school" | "museum" | "company" | "cultural_project" | "other";
  plan: string;
  status: string;
};

export type Membership = { role: MemberRole; org: OrgSummary };

/** Todas as organizações ativas do usuário (ordenadas por entrada). */
export async function getMyOrganizations(): Promise<Membership[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("organization_members")
    .select(
      "role, organizations(id, name, slug, logo_url, primary_color, organization_type, plan, status)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  return (data ?? [])
    .filter((m) => m.organizations)
    .map((m) => ({
      role: m.role as MemberRole,
      org: m.organizations as unknown as OrgSummary,
    }));
}

/**
 * Organização ativa: a salva no cookie (se o usuário ainda for membro) ou,
 * na falta dela, a primeira organização.
 */
export async function getActiveOrganization(): Promise<Membership | null> {
  const all = await getMyOrganizations();
  if (all.length === 0) return null;

  const cookieStore = await cookies();
  const activeId = cookieStore.get(ACTIVE_ORG_COOKIE)?.value;
  const found = activeId ? all.find((m) => m.org.id === activeId) : undefined;
  return found ?? all[0];
}
