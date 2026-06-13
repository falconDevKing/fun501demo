"use client";

import { useMemo, useState, type FormEvent } from "react";
import { LoaderCircle, Plus, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Avatar } from "./dashboard-widgets";
import type { CurrentPlayer, SelectablePlayer } from "./types";

export type CreateSessionValues = {
  playerIds: string[];
  title: string;
  videoPublicId: string | null;
  videoSource: "provided" | "uploaded";
  videoUrl: string;
};

type UploadedVideo = {
  publicId: string;
  secureUrl: string;
};

export function StartSessionModal({
  currentPlayer,
  error,
  isLoadingPlayers,
  isUploadingVideo,
  isOpen,
  isSubmitting,
  onClose,
  onSubmit,
  onUploadVideo,
  players,
}: {
  currentPlayer: CurrentPlayer;
  error: string;
  isLoadingPlayers: boolean;
  isUploadingVideo: boolean;
  isOpen: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onSubmit: (values: CreateSessionValues) => void;
  onUploadVideo: (file: File) => Promise<UploadedVideo>;
  players: SelectablePlayer[];
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    () => new Set([currentPlayer.id]),
  );
  const [title, setTitle] = useState("");
  const [uploadedVideo, setUploadedVideo] = useState<UploadedVideo | null>(
    null,
  );
  const [videoUrl, setVideoUrl] = useState("");

  const sortedPlayers = useMemo(() => {
    const hasCurrentPlayer = players.some(
      (player) => player.id === currentPlayer.id,
    );

    return hasCurrentPlayer
      ? players
      : [
          {
            displayName: currentPlayer.displayName,
            id: currentPlayer.id,
            photoUrl: currentPlayer.photoUrl,
          },
          ...players,
        ];
  }, [currentPlayer, players]);

  if (!isOpen) {
    return null;
  }

  function togglePlayer(playerId: string) {
    if (playerId === currentPlayer.id) {
      return;
    }

    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(playerId)) {
        next.delete(playerId);
      } else {
        next.add(playerId);
      }

      return next;
    });
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      playerIds: [...selectedIds],
      title,
      videoPublicId: uploadedVideo?.publicId ?? null,
      videoSource: uploadedVideo ? "uploaded" : "provided",
      videoUrl,
    });
  }

  async function handleVideoUpload(file: File | undefined) {
    if (!file) {
      return;
    }

    try {
      const upload = await onUploadVideo(file);
      setUploadedVideo(upload);
      setVideoUrl(upload.secureUrl);
    } catch {
      // The controller owns the visible error state.
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 p-4">
      <form
        onSubmit={handleSubmit}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Start session</h2>
            <p className="mt-1 text-sm text-slate-500">
              Create an active session and choose the players.
            </p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={onClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-5 grid gap-4">
          <label className="grid gap-1.5 text-sm font-semibold">
            Session title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              className="focus:border-brand-alt focus:ring-brand-alt/20 h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 font-normal transition outline-none focus:bg-white focus:ring-3"
              placeholder="Championship round"
            />
          </label>

          <div className="grid gap-1.5 text-sm font-semibold">
            Video URL
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <input
                value={videoUrl}
                onChange={(event) => {
                  setUploadedVideo(null);
                  setVideoUrl(event.target.value);
                }}
                className="focus:border-brand-alt focus:ring-brand-alt/20 h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 font-normal transition outline-none focus:bg-white focus:ring-3"
                placeholder="https://..."
              />
              <label className="border-brand-main text-brand-main hover:bg-brand-main/5 inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 text-sm font-semibold">
                {isUploadingVideo ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                Upload
                <input
                  type="file"
                  accept="video/*"
                  disabled={isUploadingVideo}
                  onChange={(event) =>
                    void handleVideoUpload(event.target.files?.[0])
                  }
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold">Players</p>
          <div className="mt-2 grid max-h-72 gap-2 overflow-y-auto rounded-lg border border-slate-200 p-2">
            {isLoadingPlayers ? (
              <p className="p-3 text-sm text-slate-500">Loading players...</p>
            ) : null}

            {!isLoadingPlayers && sortedPlayers.length === 0 ? (
              <p className="p-3 text-sm text-slate-500">No players found.</p>
            ) : null}

            {sortedPlayers.map((player) => {
              const isCurrentPlayer = player.id === currentPlayer.id;
              const isSelected = selectedIds.has(player.id);

              return (
                <label
                  key={player.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    disabled={isCurrentPlayer}
                    onChange={() => togglePlayer(player.id)}
                    className="accent-brand-alt size-4"
                  />
                  <Avatar photo={player.photoUrl} name={player.displayName} />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">
                    {player.displayName}
                  </span>
                  {isCurrentPlayer ? (
                    <span className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
                      You
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-brand-main hover:bg-brand-main-light"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Create Session
          </Button>
        </div>
      </form>
    </div>
  );
}

export function EndSessionConfirm({
  isOpen,
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  isOpen: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/45 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-xl">
        <h2 className="text-lg font-bold">End active session?</h2>
        <p className="mt-2 text-sm text-slate-500">
          This marks the selected session as completed and closes the details.
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isSubmitting}
            onClick={onConfirm}
            className="bg-brand-main hover:bg-brand-main-light"
          >
            {isSubmitting ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : null}
            End Session
          </Button>
        </div>
      </div>
    </div>
  );
}
