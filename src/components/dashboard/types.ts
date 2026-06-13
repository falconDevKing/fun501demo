export type MatchSummary = {
  id: string;
  playerCount: number;
  startedAt: string;
  status: "active" | "completed";
  title: string;
};

export type CurrentPlayer = {
  displayName: string;
  highScore: number;
  id: string;
  lifetimeScore: number;
  photoUrl: string | null;
};

export type SelectablePlayer = {
  displayName: string;
  id: string;
  photoUrl: string | null;
};

export type RealtimeStatus =
  | "closed"
  | "connecting"
  | "error"
  | "subscribed"
  | "timed out";

export type SessionPlayer = {
  id: string;
  name: string;
  photo: string | null;
  score: number;
};

export type SessionDetail = {
  endedAt: string | null;
  id: string;
  players: SessionPlayer[];
  startedAt: string;
  status: "active" | "completed";
  title: string;
  videoUrl: string | null;
};
