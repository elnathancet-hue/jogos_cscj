import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { hasPermission, type MemberRole } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Resultados · Jogos CSCJ" };
export const dynamic = "force-dynamic";

function formatDuration(seconds: number | null): string {
  if (seconds == null) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

type ResultRow = {
  id: string;
  player_name: string;
  score: number;
  duration_seconds: number | null;
  created_at: string;
  classes: { name: string } | null;
};

export default async function GameResultsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: game } = await supabase
    .from("games")
    .select("id, title, organization_id")
    .eq("id", id)
    .maybeSingle();
  if (!game) notFound();

  const { data: membership } = await supabase
    .from("organization_members")
    .select("role")
    .eq("organization_id", game.organization_id)
    .eq("user_id", user?.id ?? "")
    .eq("status", "active")
    .maybeSingle();
  const role = membership?.role as MemberRole | undefined;

  if (!hasPermission(role, "results.view")) {
    return (
      <>
        <PageHeader title={`Resultados · ${game.title}`} />
        <EmptyState
          title="Sem permissão"
          description="Você não tem permissão para ver os resultados deste jogo."
        />
      </>
    );
  }

  const { data: results } = await supabase
    .from("game_results")
    .select("id, player_name, score, duration_seconds, created_at, classes(name)")
    .eq("game_id", id)
    .order("created_at", { ascending: false })
    .limit(200);

  const rows = (results ?? []) as unknown as ResultRow[];

  return (
    <>
      <PageHeader
        title={`Resultados · ${game.title}`}
        description={`${rows.length} sessão(ões) registrada(s).`}
      />

      <div className="mb-4">
        <Link href={`/dashboard/games/${id}`} className="text-sm text-blue-700 hover:underline">
          ← Voltar para o jogo
        </Link>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum resultado ainda"
          description="Compartilhe o link público do jogo para começar a receber sessões."
        />
      ) : (
        <Card className="overflow-x-auto p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase text-slate-500">
                <th className="px-4 py-3 font-medium">Jogador</th>
                <th className="px-4 py-3 font-medium">Turma</th>
                <th className="px-4 py-3 font-medium">Pontuação</th>
                <th className="px-4 py-3 font-medium">Tempo</th>
                <th className="px-4 py-3 font-medium">Data</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-4 py-3 font-medium text-slate-900">{r.player_name}</td>
                  <td className="px-4 py-3 text-slate-600">{r.classes?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600">{r.score}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDuration(r.duration_seconds)}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {new Date(r.created_at).toLocaleString("pt-BR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </>
  );
}
