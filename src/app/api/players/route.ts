import { errorResponse } from "@/lib/api/http";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: players, error } = await supabase
    .from("players")
    .select("id,display_name,photo_url")
    .order("display_name", { ascending: true });

  if (error) {
    return errorResponse("Failed to fetch players.", 500);
  }

  return Response.json({
    players: players.map((player) => ({
      displayName: player.display_name,
      id: player.id,
      photoUrl: player.photo_url,
    })),
  });
}
