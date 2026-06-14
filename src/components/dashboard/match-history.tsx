"use client";

import { History, Menu, X } from "lucide-react";

import { Button } from "@/components/ui/button";

import { MatchList, MatchTabButton, type MatchTab } from "./dashboard-widgets";
import type { MatchSummary } from "./types";

type MatchHistoryProps = {
  activeId: string | null;
  activeTab: MatchTab;
  fillHeight?: boolean;
  isLoading: boolean;
  matches: MatchSummary[];
  onSelect: (id: string) => void;
  onTabChange: (tab: MatchTab) => void;
};

export function MatchHistoryPanel({
  activeId,
  activeTab,
  fillHeight = false,
  isLoading,
  matches,
  onSelect,
  onTabChange,
}: MatchHistoryProps) {
  return (
    <div
      className={
        fillHeight
          ? "flex h-full min-h-0 flex-col gap-4"
          : "flex flex-col gap-4"
      }
    >
      <div className="grid h-10 grid-cols-2 rounded-lg bg-slate-100 p-1">
        <MatchTabButton
          isActive={activeTab === "my"}
          label="My Matches"
          onClick={() => onTabChange("my")}
        />
        <MatchTabButton
          isActive={activeTab === "latest"}
          label="Latest Matches"
          onClick={() => onTabChange("latest")}
        />
      </div>

      <MatchList
        activeId={activeId}
        fillHeight={fillHeight}
        isLoading={isLoading}
        matches={matches}
        tab={activeTab}
        onSelect={onSelect}
      />
    </div>
  );
}

export function MobileMatchHistoryToolbar({
  activeTab,
  count,
  onOpen,
}: {
  activeTab: MatchTab;
  count: number;
  onOpen: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3 lg:hidden">
      <div className="min-w-0">
        <p className="text-sm font-semibold">Match History</p>
        <p className="truncate text-xs text-slate-500">
          {activeTab === "my" ? "My Matches" : "Latest Matches"} · {count}{" "}
          {count === 1 ? "session" : "sessions"}
        </p>
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={onOpen}
        className="gap-1.5"
      >
        <Menu className="size-4" />
        Browse
      </Button>
    </div>
  );
}

export function MobileMatchHistoryDrawer({
  activeId,
  activeTab,
  isLoading,
  isOpen,
  matches,
  onClose,
  onSelect,
  onTabChange,
}: MatchHistoryProps & {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) {
    return null;
  }

  function handleSelect(id: string) {
    onSelect(id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-30 lg:hidden">
      <button
        type="button"
        aria-label="Close match history"
        className="absolute inset-0 bg-slate-950/45"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="match-history-title"
        className="relative flex h-full w-[min(88vw,360px)] flex-col bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 p-4">
          <div>
            <div className="flex items-center gap-2">
              <History className="text-brand-main size-5" />
              <h2 id="match-history-title" className="text-lg font-bold">
                Match History
              </h2>
            </div>
            <p className="mt-1 text-sm text-slate-500">
              Select a session to view its dashboard.
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

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <MatchHistoryPanel
            activeId={activeId}
            activeTab={activeTab}
            fillHeight
            isLoading={isLoading}
            matches={matches}
            onSelect={handleSelect}
            onTabChange={onTabChange}
          />
        </div>
      </aside>
    </div>
  );
}
