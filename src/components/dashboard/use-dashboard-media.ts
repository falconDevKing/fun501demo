"use client";

import { useState, type Dispatch, type SetStateAction } from "react";

import { getAuthErrorMessage } from "@/lib/auth/errors";
import {
  uploadToCloudinary,
  type CloudinaryUploadResult,
} from "@/lib/media/cloudinary-client";

import { fetchJson } from "./fetch-json";
import type { ProfileValues } from "./profile-drawer";
import type { CurrentPlayer } from "./types";

type ProfileResponse = {
  player: Pick<
    CurrentPlayer,
    "displayName" | "id" | "photoPublicId" | "photoUrl"
  >;
};

export function useDashboardMedia({
  accessToken,
  currentPlayer,
  setCurrentPlayer,
  setFlowError,
}: {
  accessToken: string;
  currentPlayer: CurrentPlayer | null;
  setCurrentPlayer: Dispatch<SetStateAction<CurrentPlayer | null>>;
  setFlowError: Dispatch<SetStateAction<string>>;
}) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [profileError, setProfileError] = useState("");

  async function uploadSessionVideo(file: File) {
    if (!accessToken) {
      setFlowError("You must be signed in to upload video.");
      throw new Error("Missing session.");
    }

    setFlowError("");
    setIsUploadingVideo(true);

    try {
      return await uploadToCloudinary({
        file,
        folder: "sessions",
        resourceType: "video",
        token: accessToken,
      });
    } catch (uploadError) {
      setFlowError(getAuthErrorMessage(uploadError));
      throw uploadError;
    } finally {
      setIsUploadingVideo(false);
    }
  }

  async function saveProfile(values: ProfileValues) {
    if (!accessToken || !currentPlayer) {
      return;
    }

    const displayName = values.displayName.trim();

    if (!displayName) {
      setProfileError("Display name is required.");
      return;
    }

    setIsSavingProfile(true);
    setProfileError("");

    try {
      let upload: CloudinaryUploadResult | null = null;

      if (values.photoFile) {
        upload = await uploadToCloudinary({
          file: values.photoFile,
          folder: "profiles",
          resourceType: "image",
          token: accessToken,
        });
      }

      const data = await fetchJson<ProfileResponse>("/api/me", {
        body: {
          displayName,
          photoPublicId: upload?.publicId ?? currentPlayer.photoPublicId,
          photoUrl: upload?.secureUrl ?? currentPlayer.photoUrl,
        },
        method: "PATCH",
        token: accessToken,
      });

      setCurrentPlayer((current) =>
        current
          ? {
              ...current,
              displayName: data.player.displayName,
              photoPublicId: data.player.photoPublicId,
              photoUrl: data.player.photoUrl,
            }
          : current,
      );
      setIsProfileOpen(false);
    } catch (profileSaveError) {
      setProfileError(getAuthErrorMessage(profileSaveError));
    } finally {
      setIsSavingProfile(false);
    }
  }

  return {
    isProfileOpen,
    isSavingProfile,
    isUploadingVideo,
    profileError,
    saveProfile,
    setIsProfileOpen,
    uploadSessionVideo,
  };
}
