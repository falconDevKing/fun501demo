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
    "display_name" | "id" | "photo_public_id" | "photo_url"
  > | null;
  score: number;
};

/**
 * GET /api/sessions/[id]
 * - Reads the session ID from route params.
 * - Fetches session details and stored media metadata.
 * - Fetches joined session player rows with profile data and scores.
 * - Returns the parsed session detail used by the dashboard.
 */
export async function GET(_request: Request, context: SessionRouteContext) {
  const { id } = await context.params;
  const supabase = getSupabaseAdmin();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select(
      "id,title,status,video_url,video_public_id,video_source,started_at,ended_at",
    )
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
    .select("score,players(id,display_name,photo_url,photo_public_id)")
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
          id: row.players!.id,
          name: row.players!.display_name,
          photo: row.players!.photo_url,
          photoPublicId: row.players!.photo_public_id,
          score: row.score,
        })),
      startedAt: session.started_at,
      status: session.status,
      title: session.title,
      videoPublicId: session.video_public_id,
      videoSource: session.video_source,
      videoUrl: session.video_url,
    },
  });
}

/**
 * PATCH /api/sessions/[id]
 * - Reads the session ID and validates supported update fields.
 * - Builds a partial session update for title, status, or video metadata.
 * - Preserves an existing completion timestamp when ending a session.
 * - Returns the updated session summary.
 */
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

  if ("video_public_id" in body) {
    const videoPublicId = cleanOptionalString(body.video_public_id);

    if (videoPublicId === undefined) {
      return errorResponse("Video public ID must be a string or null.");
    }

    update.video_public_id = videoPublicId;
  }

  if ("video_source" in body) {
    if (!isVideoSource(body.video_source)) {
      return errorResponse("Video source must be uploaded or provided.");
    }

    update.video_source = body.video_source;
  }

  if (
    update.video_source === "uploaded" &&
    "video_url" in body &&
    !update.video_url
  ) {
    return errorResponse("Uploaded videos require a URL.");
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
    .select(
      "id,title,status,video_url,video_public_id,video_source,started_at,ended_at",
    )
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
      videoPublicId: session.video_public_id,
      videoSource: session.video_source,
      videoUrl: session.video_url,
    },
  });
}

function isVideoSource(value: unknown): value is "provided" | "uploaded" {
  return value === "provided" || value === "uploaded";
}
