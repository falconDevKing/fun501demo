"use client";

import { memo } from "react";

import { cn } from "@/lib/utils";

import { Avatar } from "./dashboard-widgets";
import { PlayerScoreControls } from "./player-score-controls";
import type { SessionDetail, SessionPlayer } from "./types";

export function PlayerCards({
  isLoading,
  onScoreChange,
  players,
  status,
}: {
  isLoading: boolean;
  onScoreChange: (playerId: string, delta: number) => void;
  players: SessionDetail["players"];
  status: SessionDetail["status"];
}) {
  if (isLoading) {
    return <SectionPlaceholder label="Loading players..." />;
  }

  if (players.length === 0) {
    return (
      <SectionPlaceholder label="No players are attached to this session." />
    );
  }

  const highestCompletedScore =
    status === "completed"
      ? Math.max(...players.map((player) => player.score))
      : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {players.map((player) => (
        <PlayerCard
          key={player.id}
          isHighestCompletedScore={
            highestCompletedScore !== null &&
            player.score === highestCompletedScore
          }
          player={player}
          status={status}
          onScoreChange={onScoreChange}
        />
      ))}
    </div>
  );
}

const PlayerCard = memo(function PlayerCard({
  isHighestCompletedScore,
  onScoreChange,
  player,
  status,
}: {
  isHighestCompletedScore: boolean;
  onScoreChange: (playerId: string, delta: number) => void;
  player: SessionPlayer;
  status: SessionDetail["status"];
}) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white p-4 transition",
        isHighestCompletedScore
          ? "border-brand-alt ring-brand-alt/20 ring-3"
          : "border-slate-200",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar photo={player.photo} name={player.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{player.name}</p>
          <p className="text-xs text-slate-500">Session score</p>
        </div>
      </div>
      <PlayerScoreControls
        initialScore={player.score}
        playerId={player.id}
        status={status}
        onScoreChange={onScoreChange}
      />
    </div>
  );
});

function SectionPlaceholder({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
      {label}
    </div>
  );
}
