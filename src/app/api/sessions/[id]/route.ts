import { errorResponse, readJsonObject } from "@/lib/api/http";
import { cleanOptionalString, isSessionStatus } from "@/lib/api/session-utils";
import { getSupabaseAdmin } from "@/lib/db/supabase";
import type { Database } from "@/lib/db/types";

export const dynamic = "force-dynamic";

type SessionRouteContext = {
  params: Promise<{ id: string }>;
};

type PlayerJoinRow = {
  players: Pick<
    Database["public"]["Tables"]["players"]["Row"],
    "display_name" | "high_score" | "id" | "lifetime_score" | "photo_url"
  > | null;
  score: number;
};

export async function GET(_request: Request, context: SessionRouteContext) {
  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select("id,title,status,video_url,started_at,ended_at")
    .eq("id", id)
    .maybeSingle();

  if (sessionError) {
    return errorResponse("Failed to fetch session.", 500);
  }

  if (!session) {
    return errorResponse("Session not found.", 404);
  }

  const { data: sessionPlayers, error: playersError } = await supabase
    .from("session_players")
    .select(
      "score,players(id,display_name,photo_url,high_score,lifetime_score)",
    )
    .eq("session_id", id)
    .order("created_at", { ascending: true });

  if (playersError) {
    return errorResponse("Failed to fetch session players.", 500);
  }

  const rows = (sessionPlayers ?? []) as unknown as PlayerJoinRow[];

  return Response.json({
    session: {
      endedAt: session.ended_at,
      id: session.id,
      players: rows
        .filter((row) => row.players)
        .map((row) => ({
          highScore: row.players!.high_score,
          id: row.players!.id,
          lifetimeScore: row.players!.lifetime_score,
          name: row.players!.display_name,
          photo: row.players!.photo_url,
          score: row.score,
        })),
      startedAt: session.started_at,
      status: session.status,
      title: session.title,
      videoUrl: session.video_url,
    },
  });
}

export async function PATCH(request: Request, context: SessionRouteContext) {
  const { id } = await context.params;
  const body = await readJsonObject(request);

  if (!body) {
    return errorResponse("Request body must be a JSON object.");
  }

  const update: Database["public"]["Tables"]["sessions"]["Update"] = {};

  if ("title" in body) {
    const title = typeof body.title === "string" ? body.title.trim() : "";

    if (!title) {
      return errorResponse("Title must be a non-empty string.");
    }

    update.title = title;
  }

  if ("video_url" in body) {
    const videoUrl = cleanOptionalString(body.video_url);

    if (videoUrl === undefined) {
      return errorResponse("Video URL must be a string or null.");
    }

    update.video_url = videoUrl;
  }

  if ("status" in body) {
    if (!isSessionStatus(body.status)) {
      return errorResponse("Status must be either active or completed.");
    }

    update.status = body.status;
    update.ended_at =
      body.status === "completed" ? new Date().toISOString() : null;
  }

  if (Object.keys(update).length === 0) {
    return errorResponse("At least one supported field is required.");
  }

  const supabase = getSupabaseAdmin();

  if (update.status === "completed") {
    const { data: currentSession, error: currentSessionError } = await supabase
      .from("sessions")
      .select("ended_at")
      .eq("id", id)
      .maybeSingle();

    if (currentSessionError) {
      return errorResponse("Failed to fetch session.", 500);
    }

    if (!currentSession) {
      return errorResponse("Session not found.", 404);
    }

    update.ended_at = currentSession.ended_at ?? update.ended_at;
  }

  const { data: session, error } = await supabase
    .from("sessions")
    .update(update)
    .eq("id", id)
    .select("id,title,status,video_url,started_at,ended_at")
    .maybeSingle();

  if (error) {
    return errorResponse("Failed to update session.", 500);
  }

  if (!session) {
    return errorResponse("Session not found.", 404);
  }

  return Response.json({
    session: {
      endedAt: session.ended_at,
      id: session.id,
      startedAt: session.started_at,
      status: session.status,
      title: session.title,
      videoUrl: session.video_url,
    },
  });
}
