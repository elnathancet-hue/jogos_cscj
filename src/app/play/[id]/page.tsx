import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { createClient } from "@/lib/supabase/server";
import { resolveTheme } from "@/lib/play/theme";
import { PlayStage } from "@/components/play/PlayStage";
import { renderGamePlayer, isWideType } from "@/components/play/render-player";

export const metadata: Metadata = { title: "Jogar · Jogos CSCJ" };
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
  theme: unknown;
};

export default async function PlayPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase.rpc("get_public_game", { p_game_id: id });
  const game = (Array.isArray(data) ? data[0] : data) as PublicGame | undefined;
  if (!game) notFound();

  return (
    <PlayStage
      title={game.title}
      description={game.description}
      coverImageUrl={game.cover_image_url}
      orgName={game.org_name}
      logoUrl={game.logo_url}
      theme={resolveTheme(game.theme, game.primary_color)}
      wide={isWideType(game.settings)}
    >
      {renderGamePlayer(game)}
    </PlayStage>
  );
}
