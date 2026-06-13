"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { LoaderCircle, Upload, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Avatar } from "./dashboard-widgets";
import type { CurrentPlayer } from "./types";

export type ProfileValues = {
  displayName: string;
  photoFile: File | null;
};

export function ProfileDrawer({
  error,
  isOpen,
  isSaving,
  onClose,
  onSubmit,
  player,
}: {
  error: string;
  isOpen: boolean;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (values: ProfileValues) => void;
  player: CurrentPlayer;
}) {
  const [displayName, setDisplayName] = useState(player.displayName);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  useEffect(() => {
    return () => revokePreviewUrl();
  }, []);

  if (!isOpen) {
    return null;
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit({
      displayName,
      photoFile,
    });
  }

  function handleClose() {
    handlePhotoChange(null);
    onClose();
  }

  function handlePhotoChange(file: File | null) {
    revokePreviewUrl();
    setPhotoFile(file);

    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setPreviewUrl(objectUrl);
  }

  function revokePreviewUrl() {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }

  return (
    <div className="fixed inset-0 z-30 flex justify-end bg-slate-950/45">
      <form
        onSubmit={handleSubmit}
        className="flex h-full w-full max-w-md flex-col bg-white p-5 shadow-xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold">Profile</h2>
            <p className="mt-1 text-sm text-slate-500">
              Update your display name and profile image.
            </p>
          </div>
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={handleClose}
          >
            <X className="size-4" />
          </Button>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <Avatar photo={previewUrl ?? player.photoUrl} name={displayName} />
          <div>
            <p className="text-sm font-semibold">{displayName}</p>
            <p className="text-xs text-slate-500">
              {photoFile?.name ?? "Current profile image"}
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4">
          <label className="grid gap-1.5 text-sm font-semibold">
            Display name
            <input
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              className="focus:border-brand-alt focus:ring-brand-alt/20 h-10 rounded-lg border border-slate-300 bg-slate-50 px-3 font-normal transition outline-none focus:bg-white focus:ring-3"
            />
          </label>

          <label className="grid gap-1.5 text-sm font-semibold">
            Profile image
            <input
              type="file"
              accept="image/*"
              onChange={(event) =>
                handlePhotoChange(event.target.files?.[0] ?? null)
              }
              className="file:bg-brand-main text-sm file:mr-3 file:rounded-lg file:border-0 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          </label>
        </div>

        {error ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
            {error}
          </p>
        ) : null}

        <div className="mt-auto flex justify-end gap-2 pt-5">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="bg-brand-main hover:bg-brand-main-light"
          >
            {isSaving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            Save Profile
          </Button>
        </div>
      </form>
    </div>
  );
}
