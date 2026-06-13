import { errorResponse, readJsonObject } from "@/lib/api/http";
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
    .select("id,display_name,photo_url,photo_public_id")
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
      photoPublicId: player.photo_public_id,
      photoUrl: player.photo_url,
    },
  });
}

export async function PATCH(request: Request) {
  const token = readBearerToken(request);

  if (!token) {
    return errorResponse("Missing bearer token.", 401);
  }

  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse("Request body must be a JSON object.");
  }

  const displayName =
    typeof body.displayName === "string" ? body.displayName.trim() : "";
  const photoUrl = cleanNullableString(body.photoUrl);
  const photoPublicId = cleanNullableString(body.photoPublicId);

  if (!displayName) {
    return errorResponse("Display name is required.");
  }

  if (photoUrl === undefined || photoPublicId === undefined) {
    return errorResponse("Photo fields must be strings or null.");
  }

  const supabase = getSupabaseAdmin();
  const { data: authData, error: authError } =
    await supabase.auth.getUser(token);

  if (authError || !authData.user) {
    return errorResponse("Invalid or expired session.", 401);
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .update({
      display_name: displayName,
      photo_public_id: photoPublicId,
      photo_url: photoUrl,
    })
    .eq("auth_user_id", authData.user.id)
    .select("id,display_name,photo_url,photo_public_id")
    .maybeSingle();

  if (playerError) {
    return errorResponse("Failed to update player profile.", 500);
  }

  if (!player) {
    return errorResponse("Player profile not found.", 404);
  }

  return Response.json({
    player: {
      displayName: player.display_name,
      id: player.id,
      photoPublicId: player.photo_public_id,
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

function cleanNullableString(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed || null;
}
