import { errorResponse } from "@/lib/api/http";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const token = readBearerToken(request);

  if (!token) {
    return errorResponse("Missing bearer token.", 401);
  }

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } =
    await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    return errorResponse("Invalid or expired session.", 401);
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id,display_name,photo_url")
    .eq("auth_user_id", authData.user.id)
    .maybeSingle();

  if (playerError) {
    return errorResponse("Failed to fetch player profile.", 500);
  }

  if (!player) {
    return errorResponse("Player profile not found.", 404);
  }

  const { data: scoreSummary, error: scoreSummaryError } = await supabase.rpc(
    "get_player_score_summary",
    {
      p_player_id: player.id,
    },
  );

  const scores: {
    high_score: number;
    lifetime_score: number;
  } = scoreSummaryError
    ? {
        high_score: 0,
        lifetime_score: 0,
      }
    : (scoreSummary[0] ?? {
        high_score: 0,
        lifetime_score: 0,
      });

  return Response.json({
    player: {
      displayName: player.display_name,
      highScore: scores.high_score,
      id: player.id,
      lifetimeScore: scores.lifetime_score,
      photoUrl: player.photo_url,
    },
  });
}

function readBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice("Bearer ".length).trim();
}
