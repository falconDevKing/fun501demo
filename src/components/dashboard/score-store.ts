"use client";

import { useCallback, useSyncExternalStore } from "react";

import type { SessionPlayer } from "./types";

type Listener = () => void;

const scoreListeners = new Map<string, Set<Listener>>();
const scores = new Map<string, number>();
const pending = new Set<string>();

export function resetScoreStore(players: SessionPlayer[]) {
  scores.clear();
  pending.clear();

  for (const player of players) {
    scores.set(player.id, player.score);
  }

  notifyAll();
}

export function setPlayerScore(playerId: string, score: number) {
  scores.set(playerId, score);
  notifyPlayer(playerId);
}

export function setPlayerPending(playerId: string, isPending: boolean) {
  if (isPending) {
    pending.add(playerId);
  } else {
    pending.delete(playerId);
  }

  notifyPlayer(playerId);
}

export function usePlayerScore(playerId: string, fallbackScore: number) {
  const subscribe = useCallback(
    (listener: Listener) => {
      let listeners = scoreListeners.get(playerId);

      if (!listeners) {
        listeners = new Set();
        scoreListeners.set(playerId, listeners);
      }

      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    [playerId],
  );

  const getSnapshot = useCallback(
    () => scores.get(playerId) ?? fallbackScore,
    [fallbackScore, playerId],
  );

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function usePlayerPending(playerId: string) {
  const subscribe = useCallback(
    (listener: Listener) => {
      let listeners = scoreListeners.get(playerId);

      if (!listeners) {
        listeners = new Set();
        scoreListeners.set(playerId, listeners);
      }

      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    [playerId],
  );

  const getSnapshot = useCallback(() => pending.has(playerId), [playerId]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

function notifyPlayer(playerId: string) {
  const listeners = scoreListeners.get(playerId);

  if (!listeners) {
    return;
  }

  for (const listener of listeners) {
    listener();
  }
}

function notifyAll() {
  for (const listeners of scoreListeners.values()) {
    for (const listener of listeners) {
      listener();
    }
  }
}
