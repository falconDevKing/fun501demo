import { errorResponse, isStringArray, readJsonObject } from "@/lib/api/http";
import { cleanOptionalString, isSessionStatus } from "@/lib/api/session-utils";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import type { SessionStatus } from "@/lib/db/types";

export const dynamic = "force-dynamic";

/**
 * GET /api/sessions
 * - Optionally scopes sessions to a playerId query parameter.
 * - Fetches matching sessions ordered by newest started/created time.
 * - Counts players for each returned session.
 * - Returns match-history summary rows for dashboard tabs.
 */
export async function GET(request: Request) {
  const supabase = getSupabaseAdmin();
  const playerId = new URL(request.url).searchParams.get("playerId");
  let scopedSessionIds: string[] | null = null;

  if (playerId) {
    const { data: playerSessions, error: playerSessionsError } = await supabase
      .from("session_players")
      .select("session_id")
      .eq("player_id", playerId);

    if (playerSessionsError) {
      return errorResponse("Failed to fetch player sessions.", 500);
    }

    scopedSessionIds = [
      ...new Set(playerSessions.map((session) => session.session_id)),
    ];

    if (scopedSessionIds.length === 0) {
      return Response.json({ sessions: [] });
    }
  }

  let sessionsQuery = supabase
    .from("sessions")
    .select("id,title,status,started_at,created_at")
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

  if (scopedSessionIds) {
    sessionsQuery = sessionsQuery.in("id", scopedSessionIds);
  }

  const { data: sessions, error } = await sessionsQuery;

  if (error) {
    return errorResponse("Failed to fetch sessions.", 500);
  }

  const sessionIds = sessions.map((session) => session.id);
  const playerCounts = new Map<string, number>();

  if (sessionIds.length > 0) {
    const { data: sessionPlayers, error: countError } = await supabase
      .from("session_players")
      .select("session_id")
      .in("session_id", sessionIds);

    if (countError) {
      return errorResponse("Failed to fetch session player counts.", 500);
    }

    for (const sessionPlayer of sessionPlayers) {
      playerCounts.set(
        sessionPlayer.session_id,
        (playerCounts.get(sessionPlayer.session_id) ?? 0) + 1,
      );
    }
  }

  return Response.json({
    sessions: sessions.map((session) => ({
      id: session.id,
      playerCount: playerCounts.get(session.id) ?? 0,
      startedAt: session.started_at,
      status: session.status,
      title: session.title,
    })),
  });
}

/**
 * POST /api/sessions
 * - Reads and validates session details, players, and video metadata.
 * - Verifies every provided player ID exists.
 * - Creates the session row and joins selected players with score 0.
 * - Returns the created session summary for immediate dashboard selection.
 */
export async function POST(request: Request) {
  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse("Request body must be a JSON object.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const status = body.status ?? "active";
  const videoUrl = cleanOptionalString(body.video_url);
  const videoPublicId = cleanOptionalString(body.video_public_id);
  const videoSource = body.video_source ?? (videoUrl ? "provided" : null);

  if (!title) {
    return errorResponse("Title is required.");
  }

  if (!isSessionStatus(status)) {
    return errorResponse("Status must be either active or completed.");
  }

  if (videoUrl === undefined) {
    return errorResponse("Video URL must be a string or null.");
  }

  if (videoPublicId === undefined) {
    return errorResponse("Video public ID must be a string or null.");
  }

  if (!isVideoSource(videoSource)) {
    return errorResponse("Video source must be uploaded, provided, or null.");
  }

  if (videoSource === "uploaded" && (!videoUrl || !videoPublicId)) {
    return errorResponse("Uploaded videos require a URL and public ID.");
  }

  if (!isStringArray(body.player_ids)) {
    return errorResponse("player_ids must be an array of player IDs.");
  }

  const playerIds = [...new Set(body.player_ids)];
  const supabase = getSupabaseAdmin();

  if (playerIds.length > 0) {
    const { data: players, error: playersError } = await supabase
      .from("players")
      .select("id")
      .in("id", playerIds);

    if (playersError) {
      return errorResponse("Failed to validate players.", 500);
    }

    if (players.length !== playerIds.length) {
      return errorResponse("One or more player IDs do not exist.");
    }
  }

  const now = new Date().toISOString();
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      ended_at: status === "completed" ? now : null,
      status: status as SessionStatus,
      title,
      video_public_id: videoPublicId,
      video_source: videoSource ?? "provided",
      video_url: videoUrl,
    })
    .select(
      "id,title,status,video_url,video_public_id,video_source,started_at,ended_at",
    )
    .single();

  if (sessionError) {
    return errorResponse("Failed to create session.", 500);
  }

  if (playerIds.length > 0) {
    const { error: sessionPlayersError } = await supabase
      .from("session_players")
      .insert(
        playerIds.map((playerId) => ({
          player_id: playerId,
          score: 0,
          session_id: session.id,
        })),
      );

    if (sessionPlayersError) {
      await supabase.from("sessions").delete().eq("id", session.id);
      return errorResponse("Failed to add players to session.", 500);
    }
  }

  return Response.json(
    {
      session: {
        endedAt: session.ended_at,
        id: session.id,
        startedAt: session.started_at,
        status: session.status,
        title: session.title,
        videoPublicId: session.video_public_id,
        videoSource: session.video_source,
        videoUrl: session.video_url,
      },
    },
    { status: 201 },
  );
}

function isVideoSource(
  value: unknown,
): value is "provided" | "uploaded" | null {
  return value === "provided" || value === "uploaded" || value === null;
}
