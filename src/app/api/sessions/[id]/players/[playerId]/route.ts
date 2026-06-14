import { errorResponse, readJsonObject } from "@/lib/api/http";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import type { Database } from "@/lib/db/types";

export const dynamic = "force-dynamic";

type ScoreUpdateRow =
  Database["public"]["Functions"]["update_session_player_score"]["Returns"][number];

type SessionPlayerRouteContext = {
  params: Promise<{ id: string; playerId: string }>;
};

/**
 * PATCH /api/sessions/[id]/players/[playerId]
 * - Reads session and player IDs from route params.
 * - Validates the score delta payload.
 * - Calls the score-update RPC for an atomic non-negative update.
 * - Maps RPC result codes to API responses and returns the confirmed score.
 */
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

  const result: ScoreUpdateRow | undefined = data[0];

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
