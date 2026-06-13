import { errorResponse, readJsonObject } from "@/lib/api/http";
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

  if (!Number.isInteger(body.delta)) {
    return errorResponse("Delta must be an integer.");
  }

  const delta = body.delta as number;
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.rpc("update_session_player_score", {
    p_delta: delta,
    p_player_id: playerId,
    p_session_id: id,
  });

  if (error) {
    return errorResponse("Failed to update player score.", 500);
  }

  const result = data[0];

  if (!result) {
    return errorResponse("Failed to update player score.", 500);
  }

  if (!result.success) {
    if (result.error_code === "not_found") {
      return errorResponse("Player is not part of this session.", 404);
    }

    if (result.error_code === "negative_score") {
      return errorResponse("Score cannot be below zero.");
    }

    return errorResponse("Failed to update player score.", 500);
  }

  return Response.json({
    score: result.score,
    success: true,
  });
}
