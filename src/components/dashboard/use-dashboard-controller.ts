"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { getAuthErrorMessage } from "@/lib/auth/errors";
import { getSupabaseBrowser } from "@/lib/auth/supabase-browser";

import { fetchMatchLists } from "./dashboard-api";
import type { MatchTab } from "./dashboard-widgets";
import { fetchJson } from "./fetch-json";
import {
  resetScoreStore,
  setPlayerPending,
  setPlayerScore,
} from "./score-store";
import type { CreateSessionValues } from "./session-flow";
import { useSessionRealtime } from "./use-session-realtime";
import type {
  CurrentPlayer,
  MatchSummary,
  SelectablePlayer,
  SessionDetail,
} from "./types";

type CurrentPlayerResponse = { player: CurrentPlayer };
type PlayersResponse = { players: SelectablePlayer[] };
type ScoreResponse = { score: number; success: boolean };
type SessionResponse = { session: SessionDetail };

export function useDashboardController() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<MatchTab>("my");
  const [currentPlayer, setCurrentPlayer] = useState<CurrentPlayer | null>(
    null,
  );
  const [latestMatches, setLatestMatches] = useState<MatchSummary[]>([]);
  const [myMatches, setMyMatches] = useState<MatchSummary[]>([]);
  const [players, setPlayers] = useState<SelectablePlayer[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(
    null,
  );
  const [selectedSession, setSelectedSession] = useState<SessionDetail | null>(
    null,
  );
  const [error, setError] = useState("");
  const [flowError, setFlowError] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEndConfirmOpen, setIsEndConfirmOpen] = useState(false);
  const [isEndingSession, setIsEndingSession] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);
  const [isSubmittingSession, setIsSubmittingSession] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      const supabase = getSupabaseBrowser();

      try {
        const code = new URLSearchParams(window.location.search).get("code");

        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
          window.history.replaceState({}, "", "/dashboard");
        }

        const { data } = await supabase.auth.getSession();

        if (!data.session) {
          router.replace("/");
          return;
        }

        const me = await fetchJson<CurrentPlayerResponse>("/api/me", {
          token: data.session.access_token,
        });
        const matchLists = await fetchMatchLists(me.player.id);

        if (!isMounted) {
          return;
        }

        setCurrentPlayer(me.player);
        setMyMatches(matchLists.myMatches);
        setLatestMatches(matchLists.latestMatches);
        setActiveTab(matchLists.myMatches.length > 0 ? "my" : "latest");
      } catch (loadError) {
        if (isMounted) {
          setError(getAuthErrorMessage(loadError));
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, [router]);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      if (!selectedSessionId) {
        resetScoreStore([]);
        setSelectedSession(null);
        return;
      }

      setIsSessionLoading(true);

      try {
        const data = await fetchJson<SessionResponse>(
          `/api/sessions/${selectedSessionId}`,
        );

        if (isMounted) {
          resetScoreStore(data.session.players);
          setSelectedSession(data.session);
        }
      } catch (sessionError) {
        if (isMounted) {
          setError(getAuthErrorMessage(sessionError));
        }
      } finally {
        if (isMounted) {
          setIsSessionLoading(false);
        }
      }
    }

    loadSession();

    return () => {
      isMounted = false;
    };
  }, [selectedSessionId]);

  const updatePlayerScore = useCallback((playerId: string, score: number) => {
    setPlayerScore(playerId, score);
  }, []);

  const realtimeStatus = useSessionRealtime({
    onScoreUpdate: updatePlayerScore,
    sessionId: selectedSessionId,
  });

  useEffect(() => {
    if (!isCreateOpen || players.length > 0) {
      return;
    }

    let isMounted = true;

    async function loadPlayers() {
      setIsLoadingPlayers(true);

      try {
        const data = await fetchJson<PlayersResponse>("/api/players");

        if (isMounted) {
          setPlayers(data.players);
        }
      } catch (playersError) {
        if (isMounted) {
          setFlowError(getAuthErrorMessage(playersError));
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlayers(false);
        }
      }
    }

    loadPlayers();

    return () => {
      isMounted = false;
    };
  }, [isCreateOpen, players.length]);

  async function closeSessionDetails() {
    if (!selectedSession) {
      setSelectedSessionId(null);
      return;
    }

    if (selectedSession.status === "active") {
      setIsEndConfirmOpen(true);
      return;
    }

    setSelectedSessionId(null);
  }

  async function confirmEndSession() {
    if (!selectedSession || !currentPlayer) {
      return;
    }

    setIsEndingSession(true);

    try {
      await fetchJson<SessionResponse>(`/api/sessions/${selectedSession.id}`, {
        body: { status: "completed" },
        method: "PATCH",
      });
      await refreshMatchLists(currentPlayer.id);
      setSelectedSessionId(null);
      setIsEndConfirmOpen(false);
    } catch (endError) {
      setError(getAuthErrorMessage(endError));
    } finally {
      setIsEndingSession(false);
    }
  }

  async function createSession(values: CreateSessionValues) {
    if (!currentPlayer) {
      return;
    }

    const title = values.title.trim();
    const videoUrl = values.videoUrl.trim();
    const playerIds = [...new Set([currentPlayer.id, ...values.playerIds])];

    if (!title) {
      setFlowError("Session title is required.");
      return;
    }

    setFlowError("");
    setIsSubmittingSession(true);

    try {
      const data = await fetchJson<SessionResponse>("/api/sessions", {
        body: {
          player_ids: playerIds,
          status: "active",
          title,
          video_url: videoUrl || null,
        },
        method: "POST",
      });

      await refreshMatchLists(currentPlayer.id);
      setActiveTab("my");
      setSelectedSessionId(data.session.id);
      setIsCreateOpen(false);
    } catch (createError) {
      setFlowError(getAuthErrorMessage(createError));
    } finally {
      setIsSubmittingSession(false);
    }
  }

  const changeScore = useCallback(
    async (playerId: string, delta: number) => {
      if (!selectedSessionId) {
        return;
      }

      setPlayerPending(playerId, true);

      try {
        const data = await fetchJson<ScoreResponse>(
          `/api/sessions/${selectedSessionId}/players/${playerId}`,
          { body: { delta }, method: "PATCH" },
        );

        if (!data.success) {
          throw new Error("Score update was not accepted.");
        }

        setPlayerScore(playerId, data.score);
      } catch (scoreError) {
        setError(getAuthErrorMessage(scoreError));
      } finally {
        setPlayerPending(playerId, false);
      }
    },
    [selectedSessionId],
  );

  async function signOut() {
    try {
      await getSupabaseBrowser().auth.signOut();
      router.replace("/");
    } catch (signOutError) {
      setError(getAuthErrorMessage(signOutError));
    }
  }

  async function refreshMatchLists(playerId: string) {
    const matchLists = await fetchMatchLists(playerId);
    setMyMatches(matchLists.myMatches);
    setLatestMatches(matchLists.latestMatches);
  }

  return {
    activeTab,
    currentPlayer,
    displayedMatches: activeTab === "my" ? myMatches : latestMatches,
    error,
    flowError,
    isCreateOpen,
    isEndConfirmOpen,
    isEndingSession,
    isLoading,
    isLoadingPlayers,
    isSessionLoading,
    isSubmittingSession,
    players,
    realtimeStatus,
    selectedSession,
    selectedSessionId,
    actions: {
      changeScore,
      closeSessionDetails,
      confirmEndSession,
      createSession,
      selectSession: (id: string) => {
        setError("");
        setSelectedSessionId(id);
      },
      setActiveTab,
      setIsCreateOpen,
      setIsEndConfirmOpen,
      signOut,
    },
  };
}
