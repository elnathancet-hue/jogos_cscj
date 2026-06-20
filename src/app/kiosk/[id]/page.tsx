import { headers } from "next/headers";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { Kiosk, type KioskGame } from "@/components/play/Kiosk";

export const metadata: Metadata = { title: "Modo TV · Jogos CSCJ" };
export const dynamic = "force-dynamic";

type PublicGame = {
  id: string;
  title: string;
  description: string | null;
  settings: unknown;
  cover_image_url: string | null;
  org_name: string | null;
  primary_color: string | null;
  logo_url: string | null;
};

export default async function KioskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_public_game", { p_game_id: id });
  const g = (Array.isArray(data) ? data[0] : data) as PublicGame | undefined;
  if (!g) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const playUrl = `${proto}://${host}/play/${g.id}`;

  const game: KioskGame = {
    id: g.id,
    title: g.title,
    description: g.description,
    settings: g.settings,
    coverImageUrl: g.cover_image_url,
    orgName: g.org_name,
    primaryColor: g.primary_color,
    logoUrl: g.logo_url,
  };

  return <Kiosk game={game} playUrl={playUrl} />;
}
