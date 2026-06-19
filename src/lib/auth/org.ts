// src/lib/auth/org.ts
import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { MemberRole } from "@/lib/auth/permissions";

export type ActiveOrg = {
  role: MemberRole;
  org: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    primary_color: string | null;
    organization_type: "school" | "museum" | "company" | "cultural_project" | "other";
    plan: string;
    status: string;
  };
};

/**
 * Organização "ativa" do usuário. MVP: a primeira organização ativa (por data
 * de entrada). Um seletor de organização pode ser adicionado depois.
 */
export async function getActiveOrganization(): Promise<ActiveOrg | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("organization_members")
    .select(
      "role, organizations(id, name, slug, logo_url, primary_color, organization_type, plan, status)",
    )
    .eq("user_id", user.id)
    .eq("status", "active")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data || !data.organizations) return null;
  return {
    role: data.role as MemberRole,
    org: data.organizations as unknown as ActiveOrg["org"],
  };
}
