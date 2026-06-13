Feature 3: Match History

### What to build

A sidebar list of sessions.

Tabs:

My Matches
Latest Matches

#### My Matches

Shows sessions where the logged-in player appears in session_players.

#### Latest Matches

Shows recent sessions across the platform.

Each match item should show:

Session title
Session ID
Status badge
Started date
Number of players

### Behaviour

When the user clicks a session:

1. Fetch /api/sessions/[id]
2. Load the session into the main dashboard
3. Update player cards and video player

### Feature 4: Session Overview

What to build

A header section for the currently selected session.

Display:

Session title
Session ID
Status badge
Started time
Completed time, if applicable

Status badge styles:

Active: green badge
Completed: neutral/grey badge

Why it matters
The assignment specifically asks for session ID and active/completed status.

### Feature 5: Player Cards

What to build

Render one card per player in the selected session.

Each card should show:

Player photo
Player name
Current session score
Increase score button
Decrease score button
Score controls

Use simple buttons:

+1
-1

Optional:

Reset
Behaviour

When a user clicks +1:

1. Frontend calls PATCH /api/sessions/[id]/players/[playerId]
2. Backend updates session_players.score
3. Supabase Realtime pushes the update
4. UI updates with the latest score
   Important rule

Prevent negative scores.

Minimum score = 0

Note also:
So when no session is selectd, i want a button to start a session, if a session is selected i want it to have a close button, if active the buttioon brings a nd session confimation screen, if completed, it just closes the session detals,
the no of players and session video should only showin active/completed session details page
