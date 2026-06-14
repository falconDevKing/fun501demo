import { errorResponse } from "@/lib/api/http";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

/**
 * GET /api/players
 * - Fetches all player profiles needed by the create-session picker.
 * - Sorts players by display name for predictable selection.
 * - Returns normalized player IDs, names, and profile image fields.
 */
export async function GET() {
  const supabase = getSupabaseAdmin();
  const { data: players, error } = await supabase
    .from("players")
    .select("id,display_name,photo_url,photo_public_id")
    .order("display_name", { ascending: true });

  if (error) {
    return errorResponse("Failed to fetch players.", 500);
  }

  return Response.json({
    players: players.map((player) => ({
      displayName: player.display_name,
      id: player.id,
      photoPublicId: player.photo_public_id,
      photoUrl: player.photo_url,
    })),
  });
}
