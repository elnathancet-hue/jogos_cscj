import { redirect } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ProfileForm } from "@/components/dashboard/ProfileForm";

export const metadata: Metadata = { title: "Perfil · Jogos CSCJ" };
export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email, phone, avatar_url")
    .eq("id", user.id)
    .single();

  return (
    <>
      <PageHeader title="Meu perfil" description="Atualize seus dados pessoais." />
      <Card className="max-w-xl">
        <ProfileForm
          defaults={{
            fullName: profile?.full_name ?? "",
            phone: profile?.phone ?? "",
            avatarUrl: profile?.avatar_url ?? "",
            email: profile?.email ?? user.email ?? "",
          }}
        />
      </Card>
    </>
  );
}
