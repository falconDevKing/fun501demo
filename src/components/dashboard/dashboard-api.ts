import { fetchJson } from "./fetch-json";
import type { MatchSummary } from "./types";

type MatchListResponse = {
  sessions: MatchSummary[];
};

export async function fetchMatchLists(playerId: string) {
  const [myMatchesData, latestMatchesData] = await Promise.all([
    fetchJson<MatchListResponse>(
      `/api/sessions?playerId=${encodeURIComponent(playerId)}`,
    ),
    fetchJson<MatchListResponse>("/api/sessions"),
  ]);

  return {
    latestMatches: latestMatchesData.sessions,
    myMatches: myMatchesData.sessions,
  };
}
