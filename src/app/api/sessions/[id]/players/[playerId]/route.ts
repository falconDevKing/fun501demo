import {
  errorResponse,
  isNonNegativeInteger,
  readJsonObject,
} from "@/lib/api/http";
import { getSupabaseAdmin } from "@/lib/db/supabase";

export const dynamic = "force-dynamic";

type SessionPlayerRouteContext = {
  params: Promise<{ id: string; playerId: string }>;
};

export async function PATCH(
  request: Request,
  context: SessionPlayerRouteContext,
) {
  const { id, playerId } = await context.params;
  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse("Request body must be a JSON object.");
  }

  const supabase = getSupabaseAdmin();

  const { data: sessionPlayer, error: sessionPlayerError } = await supabase
    .from("session_players")
    .select("id,score")
    .eq("session_id", id)
    .eq("player_id", playerId)
    .maybeSingle();

  if (sessionPlayerError) {
    return errorResponse("Failed to fetch session player.", 500);
  }

  if (!sessionPlayer) {
    return errorResponse("Player is not part of this session.", 404);
  }

  let nextScore: number;

  if ("score" in body) {
    if (!isNonNegativeInteger(body.score)) {
      return errorResponse("Score must be a non-negative integer.");
    }

    nextScore = body.score;
  } else if ("delta" in body) {
    if (!Number.isInteger(body.delta)) {
      return errorResponse("Delta must be an integer.");
    }

    nextScore = sessionPlayer.score + Number(body.delta);

    if (nextScore < 0) {
      return errorResponse("Score cannot be below zero.");
    }
  } else {
    return errorResponse("Payload must include score or delta.");
  }

  const { error: updateScoreError } = await supabase
    .from("session_players")
    .update({ score: nextScore })
    .eq("id", sessionPlayer.id);

  if (updateScoreError) {
    return errorResponse("Failed to update player score.", 500);
  }

  const { data: player, error: playerError } = await supabase
    .from("players")
    .select("id,display_name,photo_url,high_score,lifetime_score")
    .eq("id", playerId)
    .maybeSingle();

  if (playerError) {
    return errorResponse("Failed to fetch player.", 500);
  }

  if (!player) {
    return errorResponse("Player not found.", 404);
  }

  const { data: playerScores, error: scoresError } = await supabase
    .from("session_players")
    .select("score")
    .eq("player_id", playerId);

  if (scoresError) {
    return errorResponse("Failed to recompute lifetime score.", 500);
  }

  const lifetimeScore = playerScores.reduce(
    (total, scoreRow) => total + scoreRow.score,
    0,
  );
  const highScore = Math.max(player.high_score, nextScore);

  const { data: updatedPlayer, error: updatePlayerError } = await supabase
    .from("players")
    .update({
      high_score: highScore,
      lifetime_score: lifetimeScore,
    })
    .eq("id", playerId)
    .select("id,display_name,photo_url,high_score,lifetime_score")
    .single();

  if (updatePlayerError) {
    return errorResponse("Failed to update player totals.", 500);
  }

  return Response.json({
    player: {
      highScore: updatedPlayer.high_score,
      id: updatedPlayer.id,
      lifetimeScore: updatedPlayer.lifetime_score,
      name: updatedPlayer.display_name,
      photo: updatedPlayer.photo_url,
      score: nextScore,
    },
  });
}
