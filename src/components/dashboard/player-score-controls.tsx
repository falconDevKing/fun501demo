"use client";

import { Minus, Plus, Trophy } from "lucide-react";

import { Button } from "@/components/ui/button";

import { usePlayerPending, usePlayerScore } from "./score-store";

export function PlayerScoreControls({
  initialScore,
  onScoreChange,
  playerId,
  status,
}: {
  initialScore: number;
  onScoreChange: (playerId: string, delta: number) => void;
  playerId: string;
  status: "active" | "completed";
}) {
  const isPending = usePlayerPending(playerId);
  const score = usePlayerScore(playerId, initialScore);
  const isCompleted = status === "completed";

  return (
    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="bg-brand-main inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold text-white">
        <Trophy className="size-4" />
        {score}
      </div>
      <div className="grid grid-cols-2 gap-2 sm:min-w-36">
        <Button
          type="button"
          variant="outline"
          disabled={isCompleted || isPending || score === 0}
          onClick={() => onScoreChange(playerId, -1)}
        >
          <Minus className="size-4" />
          -1
        </Button>
        <Button
          type="button"
          disabled={isCompleted || isPending}
          onClick={() => onScoreChange(playerId, 1)}
          className="bg-brand-main hover:bg-brand-main-light"
        >
          <Plus className="size-4" />
          +1
        </Button>
      </div>
    </div>
  );
}
