"use client";

import { AlertCircle, History, LoaderCircle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

export function MatchListSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-lg border border-slate-200 bg-white p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="h-4 w-28 animate-pulse rounded bg-slate-200" />
            <span className="h-7 w-16 animate-pulse rounded-full bg-slate-100" />
          </div>
          <span className="mt-3 block h-3 w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-3 flex gap-3">
            <span className="h-3 w-20 animate-pulse rounded bg-slate-100" />
            <span className="h-3 w-10 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SessionLoadingState() {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-slate-200 bg-white p-8 text-center">
      <LoaderCircle className="text-brand-main size-9 animate-spin" />
      <h2 className="mt-4 text-xl font-bold">Loading session</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        Pulling in the session details, player cards, and media.
      </p>
    </div>
  );
}

export function SessionUnavailableState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex min-h-80 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white p-8 text-center">
      <AlertCircle className="size-10 text-red-500" />
      <h2 className="mt-4 text-xl font-bold">Session not found</h2>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        This session could not be loaded. It may have been removed, or the
        connection may have dropped.
      </p>
      <Button
        type="button"
        variant="outline"
        onClick={onClear}
        className="mt-5"
      >
        <RotateCcw className="size-4" />
        Back to dashboard
      </Button>
    </div>
  );
}

export function EmptyListState({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-white p-4 text-sm text-slate-500">
      <div className="mb-2 flex items-center gap-2 font-semibold text-slate-700">
        <History className="text-brand-main size-4" />
        No sessions found
      </div>
      {label}
    </div>
  );
}
