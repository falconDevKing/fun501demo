import { errorResponse, isStringArray, readJsonObject } from "@/lib/api/http";
import { cleanOptionalString, isSessionStatus } from "@/lib/api/session-utils";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import type { SessionStatus } from "@/lib/db/types";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseAdmin();

  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("id,title,status,started_at,created_at")
    .order("started_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });

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

export async function POST(request: Request) {
  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse("Request body must be a JSON object.");
  }

  const title = typeof body.title === "string" ? body.title.trim() : "";
  const status = body.status ?? "active";
  const videoUrl = cleanOptionalString(body.video_url);

  if (!title) {
    return errorResponse("Title is required.");
  }

  if (!isSessionStatus(status)) {
    return errorResponse("Status must be either active or completed.");
  }

  if (videoUrl === undefined) {
    return errorResponse("Video URL must be a string or null.");
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
      video_url: videoUrl,
    })
    .select("id,title,status,video_url,started_at,ended_at")
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
        videoUrl: session.video_url,
      },
    },
    { status: 201 },
  );
}
