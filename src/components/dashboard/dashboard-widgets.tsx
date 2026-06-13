"use client";

import Image from "next/image";
import {
  CalendarDays,
  History,
  LogOut,
  Play,
  Plus,
  X,
  User,
  Users,
  SquareStop,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  getOptimizedImageUrl,
  getOptimizedVideoUrl,
} from "@/lib/media/cloudinary-url";

import type {
  CurrentPlayer,
  MatchSummary,
  RealtimeStatus,
  SessionDetail,
} from "./types";
import { EmptyListState, MatchListSkeleton } from "./dashboard-states";
import { RealtimeStatusBadge } from "./realtime-status";

export type MatchTab = "my" | "latest";

export function TopNav({
  onOpenProfile,
  onSignOut,
  player,
}: {
  onOpenProfile: () => void;
  onSignOut: () => void;
  player: CurrentPlayer | null;
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-18 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
      <div className="flex items-center gap-3">
        <Image
          src="/fun501Logo.png"
          alt="501 Hub logo"
          width={40}
          height={40}
          className="size-10 rounded-full object-contain"
          priority
        />
        <div className="min-w-0">
          <p className="text-brand-main text-base font-bold">501 Hub Demo</p>
          <p className="hidden text-xs text-slate-500 sm:block">
            Session dashboard
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpenProfile}>
          <Avatar photo={player?.photoUrl ?? null} name={player?.displayName} />
        </button>
        <div className="hidden min-w-0 sm:block">
          <p className="truncate text-sm font-semibold">
            {player?.displayName ?? "Loading player"}
          </p>
          <p className="text-xs text-slate-500">
            High {player?.highScore ?? 0} &middot; Lifetime{" "}
            {player?.lifetimeScore ?? 0}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onSignOut}
          className="gap-1.5"
        >
          <LogOut className="size-4" />
          <span className="hidden sm:inline">Logout</span>
        </Button>
      </div>
    </header>
  );
}

export function MatchTabButton({
  isActive,
  label,
  onClick,
}: {
  isActive: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={onClick}
      className={cn(
        "focus-visible:ring-brand-alt/25 rounded-md text-sm font-semibold transition focus-visible:ring-3 focus-visible:outline-none",
        isActive
          ? "text-brand-main bg-white shadow-sm"
          : "hover:text-brand-main text-slate-500",
      )}
    >
      {label}
    </button>
  );
}

export function MatchList({
  activeId,
  isLoading,
  matches,
  onSelect,
  tab,
}: {
  activeId: string | null;
  isLoading: boolean;
  matches: MatchSummary[];
  onSelect: (id: string) => void;
  tab: MatchTab;
}) {
  if (isLoading) {
    return <MatchListSkeleton />;
  }

  if (matches.length === 0) {
    return (
      <EmptyListState
        label={
          tab === "my"
            ? "You are not attached to any matches yet."
            : "No latest matches have been created yet."
        }
      />
    );
  }

  return (
    <div className="flex max-h-80 flex-col gap-2 overflow-y-auto pr-1 lg:max-h-none">
      {matches.map((match) => (
        <button
          key={match.id}
          type="button"
          onClick={() => onSelect(match.id)}
          className={cn(
            "rounded-lg border p-3 text-left transition",
            activeId === match.id
              ? "border-brand-alt bg-brand-alt/10"
              : "hover:border-brand-main/30 border-slate-200 bg-white hover:bg-slate-50",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="truncate text-sm font-semibold">{match.title}</p>
            <StatusPill status={match.status} />
          </div>
          <p className="mt-1 truncate text-xs text-slate-400">{match.id}</p>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="size-3.5" />
              {formatDate(match.startedAt)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Users className="size-3.5" />
              {match.playerCount}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

export function EmptySessionState({
  onStartSession,
}: {
  onStartSession: () => void;
}) {
  return (
    <div className="flex min-h-105 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <History className="text-brand-main size-10" />
      <h2 className="mt-4 text-2xl font-bold">No session selected</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Choose a match from the sidebar or start a new active session.
      </p>
      <Button
        type="button"
        onClick={onStartSession}
        className="bg-brand-main hover:bg-brand-main-light mt-5"
      >
        <Plus className="size-4" />
        Start Session
      </Button>
    </div>
  );
}

export function SessionHeader({
  isLoading,
  onClose,
  session,
  realtimeStatus,
}: {
  isLoading: boolean;
  onClose: () => void;
  session: SessionDetail;
  realtimeStatus: RealtimeStatus;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <History className="text-brand-main size-5" />
            <h2 className="text-xl font-bold">
              {isLoading ? "Loading..." : session.title}
            </h2>
          </div>
          <p className="mt-1 truncate text-sm text-slate-500">{session.id}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-slate-500">
            <span>Started {formatDateTime(session.startedAt)}</span>
            {session.endedAt ? (
              <span>Completed {formatDateTime(session.endedAt)}</span>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 sm:items-end">
          <div className="flex flex-wrap items-center gap-2">
            <StatusPill status={session.status} />
            <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-slate-200 px-3 text-sm font-medium">
              <Users className="size-4" />
              {session.players.length} players
            </span>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              {session.status === "completed" ? (
                <X className="size-4" />
              ) : (
                <SquareStop className="size-4" />
              )}
              {session.status === "completed" ? "Close" : "End"}
            </Button>
          </div>
          <RealtimeStatusBadge status={realtimeStatus} />
        </div>
      </div>
    </div>
  );
}

export function VideoPanel({
  isLoading,
  videoSource,
  videoUrl,
}: {
  isLoading: boolean;
  videoSource: SessionDetail["videoSource"];
  videoUrl: string | null;
}) {
  const resolvedVideoUrl = getOptimizedVideoUrl(videoUrl, videoSource);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <Play className="text-brand-main size-5" />
        <h3 className="font-semibold">Session Video</h3>
      </div>

      {resolvedVideoUrl && !isLoading ? (
        <video
          controls
          src={resolvedVideoUrl}
          className="aspect-video w-full rounded-lg bg-black"
        />
      ) : (
        <div className="flex aspect-video w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 text-center text-sm text-slate-500">
          <Play className="mb-2 size-7 text-slate-300" />
          {isLoading ? "Loading video..." : "No video available."}
        </div>
      )}
    </div>
  );
}

export function Avatar({
  name,
  photo,
}: {
  name?: string;
  photo: string | null;
}) {
  const optimizedPhoto = getOptimizedImageUrl(photo);

  if (optimizedPhoto) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={optimizedPhoto}
        alt={name ? `${name} avatar` : "Player avatar"}
        className="size-10 rounded-full border border-slate-200 object-cover"
      />
    );
  }

  return (
    <span className="text-brand-main flex size-10 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-sm font-bold uppercase">
      {name ? getInitials(name) : <User className="size-5" />}
    </span>
  );
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function StatusPill({ status }: { status: MatchSummary["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex h-8 items-center rounded-full px-4 text-xs font-semibold capitalize",
        status === "active"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-slate-100 text-slate-600",
      )}
    >
      {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
