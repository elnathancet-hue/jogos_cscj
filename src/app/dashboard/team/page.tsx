import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { getActiveOrganization } from "@/lib/auth/org";
import type { MemberRole } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { InviteForm } from "@/components/dashboard/InviteForm";
import { TeamMembers, type TeamMember } from "@/components/dashboard/TeamMembers";
import {
  PendingInvitations,
  type PendingInvite,
} from "@/components/dashboard/PendingInvitations";

export const metadata: Metadata = { title: "Equipe · Jogos CSCJ" };
export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const active = await getActiveOrganization();
  if (!active) {
    return (
      <>
        <PageHeader title="Equipe" />
        <EmptyState
          title="Nenhuma organização"
          description="Você ainda não pertence a uma organização."
        />
      </>
    );
  }

  const isAdmin = active.role === "org_admin";
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Membros ativos + perfis (join feito em JS — não há FK direta members→profiles).
  const { data: rawMembers } = await supabase
    .from("organization_members")
    .select("id, role, user_id")
    .eq("organization_id", active.org.id)
    .eq("status", "active");

  const userIds = (rawMembers ?? []).map((m) => m.user_id);
  const { data: profiles } = userIds.length
    ? await supabase.from("profiles").select("id, full_name, email").in("id", userIds)
    : { data: [] };

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]));
  const members: TeamMember[] = (rawMembers ?? []).map((m) => {
    const p = profileById.get(m.user_id);
    return {
      id: m.id,
      userId: m.user_id,
      role: m.role as MemberRole,
      fullName: p?.full_name ?? "",
      email: p?.email ?? "",
    };
  });

  // Convites pendentes (RLS só retorna para admin).
  const { data: rawInvites } = await supabase
    .from("invitations")
    .select("id, email, role, token")
    .eq("organization_id", active.org.id)
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const invites: PendingInvite[] = (rawInvites ?? []).map((i) => ({
    id: i.id,
    email: i.email,
    role: i.role as MemberRole,
    token: i.token,
  }));

  return (
    <>
      <PageHeader
        title="Equipe"
        description={`Membros de ${active.org.name}.`}
      />

      <div className="space-y-6">
        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Convidar pessoa</CardTitle>
              <CardDescription>
                Geramos um link de convite para você compartilhar.
              </CardDescription>
            </CardHeader>
            <InviteForm />
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Membros ({members.length})</CardTitle>
          </CardHeader>
          <TeamMembers
            members={members}
            isAdmin={isAdmin}
            currentUserId={user?.id ?? ""}
          />
        </Card>

        {isAdmin && (
          <Card>
            <CardHeader>
              <CardTitle>Convites pendentes</CardTitle>
            </CardHeader>
            <PendingInvitations invites={invites} />
          </Card>
        )}
      </div>
    </>
  );
}
