"use client";

import { useEffect, useState } from "react";

import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";

import type { RealtimeStatus } from "./types";

type ChannelStatus = Exclude<RealtimeStatus, "connecting">;

export function useSessionRealtime({
  onScoreUpdate,
  sessionId,
}: {
  onScoreUpdate: (playerId: string, score: number) => void;
  sessionId: string | null;
}): RealtimeStatus {
  const [channelState, setChannelState] = useState<{
    sessionId: string;
    status: ChannelStatus;
  }>({
    sessionId: "",
    status: "closed",
  });

  useEffect(() => {
    if (!sessionId) {
      return;
    }

    const supabase = getSupabaseBrowser();
    const channel = supabase
      .channel(`session-score-${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          filter: `session_id=eq.${sessionId}`,
          schema: "public",
          table: "session_players",
        },
        (payload) => {
          const row = payload.new as {
            player_id?: unknown;
            score?: unknown;
          };

          if (
            typeof row.player_id === "string" &&
            typeof row.score === "number"
          ) {
            onScoreUpdate(row.player_id, row.score);
          }
        },
      )
      .subscribe((status) => {
        setChannelState({
          sessionId,
          status: mapRealtimeStatus(status),
        });
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [onScoreUpdate, sessionId]);

  if (!sessionId) {
    return "closed";
  }

  if (channelState.sessionId !== sessionId) {
    return "connecting";
  }

  return channelState.status;
}

function mapRealtimeStatus(status: string): ChannelStatus {
  if (status === "SUBSCRIBED") {
    return "subscribed";
  }

  if (status === "TIMED_OUT") {
    return "timed out";
  }

  if (status === "CHANNEL_ERROR") {
    return "error";
  }

  return "closed";
}
