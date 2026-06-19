import Link from "next/link";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/Card";
import { AcceptInviteForm } from "@/components/auth/AcceptInviteForm";

export const metadata: Metadata = { title: "Aceitar convite · Jogos CSCJ" };
export const dynamic = "force-dynamic";

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <Card>
        <h2 className="text-lg font-semibold text-slate-950">Convite inválido</h2>
        <p className="mt-1 text-sm text-slate-600">
          O link do convite está incompleto.
        </p>
      </Card>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const next = `/auth/accept-invite?token=${token}`;
    return (
      <Card>
        <h2 className="mb-1 text-lg font-semibold text-slate-950">Você foi convidado</h2>
        <p className="mb-6 text-sm text-slate-600">
          Entre ou crie uma conta e abra este link novamente para aceitar o convite.
        </p>
        <div className="flex gap-3">
          <Link
            href="/auth/login"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-blue-600 bg-blue-600 px-4 text-sm font-medium text-white transition-colors hover:bg-blue-700"
          >
            Entrar
          </Link>
          <Link
            href="/auth/register"
            className="inline-flex h-10 flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            Criar conta
          </Link>
        </div>
        <p className="mt-4 break-all text-xs text-slate-400">{next}</p>
      </Card>
    );
  }

  return (
    <Card>
      <h2 className="mb-1 text-lg font-semibold text-slate-950">Aceitar convite</h2>
      <p className="mb-6 text-sm text-slate-600">
        Você entrará na organização com o papel definido no convite.
      </p>
      <AcceptInviteForm token={token} />
    </Card>
  );
}
