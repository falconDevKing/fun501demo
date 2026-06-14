## Decision Making and Production Readiness

This document explains the main engineering decisions behind the 501 Hub demo
and what I would tighten before treating it as a production system. The goal of
the implementation was to keep the take-home focused and easy to review, while
still showing how the app could grow into a more secure, observable, and
scalable product.

### Technology Decisions

#### Why Next.js

I chose Next.js because it lets the React frontend and backend API route
handlers live in one TypeScript application. For a take-home project, that is a
good fit: the reviewer can see the UI, routing, backend endpoints, and data
flow in one place without needing to jump across multiple services.

The main benefits in this project are:

- A React-based UI for the auth flow and dashboard.
- File-based routing for pages and API route handlers.
- TypeScript across frontend and backend code.
- A compact full-stack structure that still satisfies the React and API
  requirements.

#### Why Supabase

I chose Supabase because the app needs authentication, persistence, and live
score updates. Supabase gives all three in one stack: Supabase Auth handles
email/password access, Postgres stores players and sessions, and Supabase
Realtime broadcasts score updates.

That kept the demo simpler than wiring together separate auth, database, and
WebSocket services. It also gives a good production path because Supabase
supports Row Level Security, managed Postgres, and server-side service-role
access for trusted API routes.

#### Database Design

The core schema is intentionally small:

- `players` stores registered player profiles.
- `sessions` stores game sessions.
- `session_players` connects players to sessions and stores each player's score
  for that specific session.

The join table matters because the relationship is many-to-many. A player can
participate in many sessions, and a session can contain many players. The score
belongs to the player inside one specific session, so it is stored on
`session_players` rather than directly on `players`.

I also chose not to store `high_score` or `lifetime_score` directly on
`players`. Those values are derived from session-player scores with a SQL
function. That keeps the profile table cleaner and avoids stale aggregate data.

For the assignment, I did not add a `score_events` table. The requirement was to
update the current score, so storing the current score on `session_players` is
enough. In a production product, I would add `score_events` to record each score
change for audit trails, replayable match history, analytics, and dispute
review.

#### Realtime And Score Updates

I used Supabase Realtime because the score UI should feel live. Polling would
have been simpler, but it would repeatedly fetch data even when nothing changed.
Realtime gives a closer simulation of live match updates while staying inside
the same Supabase stack.

I also scoped the Realtime subscription to the currently selected session. The
dashboard does not need every score update happening across the platform, so it
only listens to `session_players` rows for the active session detail view. That
reduces client-side noise, lowers bandwidth usage, improves performance, and
avoids exposing unrelated session activity to a connected client.

Score updates are handled through a Postgres RPC function. That keeps the
increment/decrement operation atomic and lets the database enforce important
rules, such as preventing scores below zero. On the frontend, score rendering is
isolated in a small score store, so updating one score does not force every
player card to rerender.

#### Frontend Data Flow

The app separates lightweight and heavier data on purpose. The match history
endpoint returns summary rows: title, ID, status, start date, and player count.
The heavier session details, including player cards and video metadata, are only
fetched when a user selects a session.

That keeps the dashboard responsive and avoids loading data that the user may
never open. On mobile, the match history sits in a left-side drawer, which keeps
the selected session dashboard in focus instead of pushing the session content
down the page.

#### Media Handling

The app stores media URLs and metadata in Supabase, while Cloudinary stores and
delivers the actual image and video files. This avoids putting large media
objects in the database or serving them through the application server.

For uploads, the browser requests signed parameters from the backend and then
uploads directly to Cloudinary. The important part is that the Cloudinary API
secret stays server-side. The frontend receives only what it needs to complete
the signed upload.

Cloudinary also gives the app a better delivery path through CDN-backed media,
responsive transformations, automatic format optimization, and video delivery
support.

### Production Readiness

#### Authorization And Data Access

For the demo, some API routes are intentionally open or lightly protected so the
assignment workflow is easy to exercise. In production, I would enforce
authorization more strictly at both the API layer and the database layer.

The main production changes would be:

- Add Supabase Row Level Security policies for `players`, `sessions`, and
  `session_players`.
- Check that a user belongs to a session before allowing score updates.
- Add role-based permissions for admins, players, and spectators.
- Keep service-role access limited to server-only code paths.

#### Input Validation

The current API routes validate the core fields they use, but production should
make that validation more formal and consistent. I would use a schema validation
library such as Zod for request bodies, query parameters, and route parameters.

That would make invalid inputs easier to reject consistently and would reduce
the chance of subtle bugs when the API grows.

#### Score Auditability

The current model stores the latest score on `session_players`, which keeps the
assignment implementation simple. For production, I would add a `score_events`
table.

That table would allow the system to answer questions like:

- Who changed a score?
- When did the change happen?
- Was the score incremented, decremented, reset, or corrected?
- Can the final scoreboard be replayed from individual events?

That extra history would be useful for auditing, analytics, replays, and support
cases.

#### Realtime At Scale

Supabase Realtime is a strong fit for this demo and for moderate live-update
needs. At much higher update frequency or larger concurrent sessions, I would
evaluate dedicated WebSocket infrastructure, event streaming, or a queue-backed
broadcast model.

That would make it easier to handle very noisy sessions, fan-out updates across
many clients, and apply backpressure when traffic spikes.

#### Media Security

Media upload handling should be stricter in production. Signed uploads are a
good baseline because they avoid exposing secrets, but the upload policy should
also control what users can upload and where those files can live.

I would add:

- File type and file size restrictions.
- Folder and naming policies tied to user/session ownership.
- Moderation or antivirus checks where appropriate.
- Cleanup flows for replaced or deleted media.
- Access controls for private or restricted media.

#### API Protection

The API should be protected against abuse before production launch. That means
adding rate limits, tightening CORS, and making sure write endpoints require the
right identity and permissions.

The highest-priority endpoints to protect would be auth-adjacent routes, score
updates, session creation, profile updates, and signed upload generation.

#### Observability

For production, I would add structured logs, metrics, tracing, and alerting. The
important operations to track are authentication issues, session creation,
score-update failures, Realtime connection health, Cloudinary upload failures,
and API error rates.

Good observability would make it much easier to understand whether a problem is
coming from the frontend, the API, Supabase, Realtime, or Cloudinary.

#### Testing

The next testing pass would focus on the flows that carry the most product risk:

- Auth sign-up, sign-in, forgot-password, and reset-password flows.
- API route validation and error responses.
- Session creation and session selection.
- Score update success and negative-score prevention.
- Realtime score synchronization.
- Responsive dashboard behavior, including the mobile match-history drawer.

Those tests would help protect the app as the product grows beyond the demo
scope.
