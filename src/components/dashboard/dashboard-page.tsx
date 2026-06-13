"use client";

import {
  EmptySessionState,
  MatchList,
  MatchTabButton,
  SessionHeader,
  TopNav,
  VideoPanel,
} from "./dashboard-widgets";
import { PlayerCards } from "./player-cards";
import { EndSessionConfirm, StartSessionModal } from "./session-flow";
import { useDashboardController } from "./use-dashboard-controller";

export function DashboardPage() {
  const dashboard = useDashboardController();
  const { actions } = dashboard;

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <TopNav player={dashboard.currentPlayer} onSignOut={actions.signOut} />

      <div className="grid min-h-[calc(100vh-72px)] grid-cols-1 lg:grid-cols-[320px_1fr]">
        <aside className="border-b border-slate-200 bg-white lg:border-r lg:border-b-0">
          <div className="sticky top-18 flex max-h-[calc(100vh-72px)] flex-col gap-4 p-4">
            <div className="grid h-10 grid-cols-2 rounded-lg bg-slate-100 p-1">
              <MatchTabButton
                isActive={dashboard.activeTab === "my"}
                label="My Matches"
                onClick={() => actions.setActiveTab("my")}
              />
              <MatchTabButton
                isActive={dashboard.activeTab === "latest"}
                label="Latest Matches"
                onClick={() => actions.setActiveTab("latest")}
              />
            </div>

            <MatchList
              activeId={dashboard.selectedSessionId}
              isLoading={dashboard.isLoading}
              matches={dashboard.displayedMatches}
              tab={dashboard.activeTab}
              onSelect={actions.selectSession}
            />
          </div>
        </aside>

        <section className="flex min-w-0 flex-col gap-5 p-4 sm:p-6">
          {dashboard.error ? (
            <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {dashboard.error}
            </p>
          ) : null}

          {!dashboard.selectedSessionId ? (
            <EmptySessionState
              onStartSession={() => actions.setIsCreateOpen(true)}
            />
          ) : null}

          {dashboard.selectedSessionId && !dashboard.selectedSession ? (
            <div className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
              {dashboard.isSessionLoading
                ? "Loading session..."
                : "Session unavailable."}
            </div>
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
          isOpen={dashboard.isCreateOpen}
          isSubmitting={dashboard.isSubmittingSession}
          players={dashboard.players}
          onClose={() => actions.setIsCreateOpen(false)}
          onSubmit={actions.createSession}
        />
      ) : null}

      <EndSessionConfirm
        isOpen={dashboard.isEndConfirmOpen}
        isSubmitting={dashboard.isEndingSession}
        onCancel={() => actions.setIsEndConfirmOpen(false)}
        onConfirm={actions.confirmEndSession}
      />
    </main>
  );
}
