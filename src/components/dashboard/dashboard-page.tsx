"use client";

import { useState } from "react";

import {
  EmptySessionState,
  SessionHeader,
  TopNav,
  VideoPanel,
} from "./dashboard-widgets";
import {
  SessionLoadingState,
  SessionUnavailableState,
} from "./dashboard-states";
import {
  MatchHistoryPanel,
  MobileMatchHistoryDrawer,
  MobileMatchHistoryToolbar,
} from "./match-history";
import { PlayerCards } from "./player-cards";
import { ProfileDrawer } from "./profile-drawer";
import { EndSessionConfirm, StartSessionModal } from "./session-flow";
import { useDashboardController } from "./use-dashboard-controller";

export function DashboardPage() {
  const dashboard = useDashboardController();
  const { actions } = dashboard;
  const [isMatchHistoryOpen, setIsMatchHistoryOpen] = useState(false);

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <TopNav
        player={dashboard.currentPlayer}
        onOpenProfile={() => actions.setIsProfileOpen(true)}
        onSignOut={actions.signOut}
      />

      <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside className="hidden bg-white lg:block lg:border-r lg:border-slate-200">
          <div className="flex flex-col gap-4 p-4 lg:sticky lg:top-18 lg:max-h-[calc(100vh-72px)]">
            <MatchHistoryPanel
              activeId={dashboard.selectedSessionId}
              activeTab={dashboard.activeTab}
              isLoading={dashboard.isLoading}
              matches={dashboard.displayedMatches}
              onSelect={actions.selectSession}
              onTabChange={actions.setActiveTab}
            />
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
          <MobileMatchHistoryToolbar
            activeTab={dashboard.activeTab}
            count={dashboard.displayedMatches.length}
            onOpen={() => setIsMatchHistoryOpen(true)}
          />

          {dashboard.error ? (
            <p
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
            >
              {dashboard.error}
            </p>
          ) : null}

          {!dashboard.selectedSessionId ? (
            <EmptySessionState
              onStartSession={() => actions.setIsCreateOpen(true)}
            />
          ) : null}

          {dashboard.selectedSessionId && !dashboard.selectedSession ? (
            dashboard.isSessionLoading ? (
              <SessionLoadingState />
            ) : (
              <SessionUnavailableState onClear={actions.closeSessionDetails} />
            )
          ) : null}

          {dashboard.selectedSession ? (
            <>
              <SessionHeader
                isLoading={dashboard.isSessionLoading}
                session={dashboard.selectedSession}
                onClose={actions.closeSessionDetails}
                realtimeStatus={dashboard.realtimeStatus}
              />
              <PlayerCards
                isLoading={dashboard.isSessionLoading}
                players={dashboard.selectedSession.players}
                status={dashboard.selectedSession.status}
                onScoreChange={actions.changeScore}
              />
              <VideoPanel
                isLoading={dashboard.isSessionLoading}
                videoSource={dashboard.selectedSession.videoSource}
                videoUrl={dashboard.selectedSession.videoUrl}
              />
            </>
          ) : null}
        </section>
      </div>

      {dashboard.currentPlayer && dashboard.isCreateOpen ? (
        <StartSessionModal
          key="start-session"
          currentPlayer={dashboard.currentPlayer}
          error={dashboard.flowError}
          isLoadingPlayers={dashboard.isLoadingPlayers}
          isUploadingVideo={dashboard.isUploadingVideo}
          isOpen={dashboard.isCreateOpen}
          isSubmitting={dashboard.isSubmittingSession}
          players={dashboard.players}
          onClose={() => actions.setIsCreateOpen(false)}
          onSubmit={actions.createSession}
          onUploadVideo={actions.uploadSessionVideo}
        />
      ) : null}

      {dashboard.currentPlayer && dashboard.isProfileOpen ? (
        <ProfileDrawer
          key={dashboard.currentPlayer.id}
          error={dashboard.profileError}
          isOpen={dashboard.isProfileOpen}
          isSaving={dashboard.isSavingProfile}
          player={dashboard.currentPlayer}
          onClose={() => actions.setIsProfileOpen(false)}
          onSubmit={actions.saveProfile}
        />
      ) : null}

      <EndSessionConfirm
        isOpen={dashboard.isEndConfirmOpen}
        isSubmitting={dashboard.isEndingSession}
        onCancel={() => actions.setIsEndConfirmOpen(false)}
        onConfirm={actions.confirmEndSession}
      />

      <MobileMatchHistoryDrawer
        activeId={dashboard.selectedSessionId}
        activeTab={dashboard.activeTab}
        isLoading={dashboard.isLoading}
        isOpen={isMatchHistoryOpen}
        matches={dashboard.displayedMatches}
        onClose={() => setIsMatchHistoryOpen(false)}
        onSelect={actions.selectSession}
        onTabChange={actions.setActiveTab}
      />
    </main>
  );
}
