# 501 Hub Demo

501 Hub Demo is a demo Next.js application for managing game sessions, player
profiles, score updates, match history, and Cloudinary-hosted media. It uses
Supabase Auth for email/password access, Supabase Postgres for session data,
Supabase Realtime for score updates, and signed Cloudinary uploads for profile
images and session videos.

## Development Access

Install dependencies:

```bash
npm install
```

Create `.env.local` from `.env.example` and fill in the required values:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SITE_URL=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Apply the Supabase migrations in `supabase/migrations` to the target Supabase
project. The migrations create player/session tables, score RPC functions,
auth-user profile creation, media metadata columns, and Realtime publication
setup for `session_players`.

Start the app:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up with an email and
password, confirm the email if your Supabase project requires confirmation, then
sign in. Successful auth redirects to `/dashboard`.

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: public Supabase project URL used by client and
  server helpers.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: public Supabase anon key used by browser
  auth and Realtime.
- `NEXT_PUBLIC_SITE_URL`: public site URL used for metadata/social URLs.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key used by API routes for database
  access.
- `CLOUDINARY_CLOUD_NAME`: Cloudinary cloud name for signed direct uploads.
- `CLOUDINARY_API_KEY`: Cloudinary API key returned to the browser for signed
  uploads.
- `CLOUDINARY_API_SECRET`: server-only Cloudinary secret used to generate upload
  signatures.

## App Features

### Authentication

The root page (`/`) provides sign-in and registration flows using Supabase
email/password auth. Registration stores the display name in Supabase auth
metadata, and a database trigger creates the matching `players` profile row.
Forgot-password and reset-password pages handle Supabase password recovery.

### Dashboard Layout

The dashboard shows a top navigation bar, match-history panel, and main session
area. The top nav includes the current player's avatar, display name, derived
high score, derived lifetime score, and logout action.

### Profile Management

Clicking the avatar opens a profile drawer. A user can update their display name
and upload a new profile image. Image uploads use signed Cloudinary direct
uploads, preview locally before saving, then persist the returned URL and public
ID on the player's profile.

### Match History

The sidebar has `My Matches` and `Latest Matches` tabs. `My Matches` lists
sessions where the current player appears in `session_players`; `Latest Matches`
lists recent sessions across the platform. Each item shows title, ID, status,
started date, and player count.

### Session Overview

Selecting a match loads the session detail panel with title, ID, status, started
time, completed time when available, player count, player cards, and video. An
active session can be ended with confirmation. A completed session can be closed
from the detail view.

### Session Creation

When no session is selected, `Start Session` opens a create-session flow. The
current player is preselected, other players can be added, and a video can be
provided either as a URL or uploaded to Cloudinary.

### Score Updates And Realtime

Active session player cards show `+1` and `-1` controls. Score updates call the
score PATCH endpoint, which delegates the update to a Postgres RPC function that
prevents negative scores. The UI keeps scores isolated in a small score store,
and Supabase Realtime updates the matching score display when
`session_players.score` changes. Completed sessions disable score controls and
highlight the highest-scoring player cards.

### Media Handling

Profile images and uploaded session videos use Cloudinary signed direct uploads.
The browser asks `/api/cloudinary/sign-upload` for signed parameters, uploads
directly to Cloudinary, then saves the returned `secure_url` and `public_id` in
Supabase.

Stored media fields:

- `players.photo_url`
- `players.photo_public_id`
- `sessions.video_url`
- `sessions.video_public_id`
- `sessions.video_source`

Uploaded Cloudinary media is rendered through optimized Cloudinary URLs.
Provided video URLs are stored and rendered unchanged.

### Responsive And State Handling

The layout is responsive: desktop uses a left sidebar and main session area,
while smaller screens stack match history above the session content. The app
includes loading, empty, unavailable, score-error, and no-video states.

## API Reference

All API routes live under `src/app/api` and use Next App Router route handlers.
Routes return JSON success payloads or `{ "error": string }` on failures.

### `GET /api/me`

Requires `Authorization: Bearer <access_token>`.

Returns the current player's profile plus derived score totals:

- Verifies the Supabase access token.
- Finds the matching row in `players` by `auth_user_id`.
- Calls `get_player_score_summary` to derive high and lifetime scores.
- Returns parsed player data for the dashboard top nav.

### `PATCH /api/me`

Requires `Authorization: Bearer <access_token>`.

Updates the current player's profile:

- Reads and validates `displayName`, `photoUrl`, and `photoPublicId`.
- Verifies the Supabase access token.
- Updates only the authenticated user's `players` row.
- Returns the updated profile fields.

### `GET /api/players`

Returns selectable players for session creation:

- Fetches player IDs, names, image URLs, and image public IDs.
- Sorts by display name.
- Returns a client-friendly list.

### `GET /api/sessions`

Returns match-history summaries. Supports `?playerId=<player_id>` for `My
Matches`.

- Optionally finds sessions where the provided player appears.
- Fetches matching or latest sessions ordered newest first.
- Counts players per session from `session_players`.
- Returns session ID, title, status, started date, and player count.

### `POST /api/sessions`

Creates a new session.

Accepted fields include `title`, `player_ids`, `status`, `video_url`,
`video_public_id`, and `video_source`.

- Reads and validates the request body.
- Validates title, status, video metadata, and player IDs.
- Inserts the session row.
- Inserts `session_players` rows with score `0`.
- Returns the created session summary.

### `GET /api/sessions/[id]`

Returns one session with its players.

- Reads the session ID from route params.
- Fetches session details and media metadata.
- Fetches joined session-player rows with player profile data.
- Returns session details, player cards, scores, and video metadata.

### `PATCH /api/sessions/[id]`

Updates session-level details.

Supported fields include `title`, `status`, `video_url`, `video_public_id`, and
`video_source`.

- Reads the session ID and JSON body.
- Builds a validated partial session update.
- Preserves the first `ended_at` timestamp when completing a session.
- Updates the session row and returns the updated session summary.

### `PATCH /api/sessions/[id]/players/[playerId]`

Updates a player's score in a session.

Request body:

```json
{ "delta": 1 }
```

- Reads session and player IDs from route params.
- Validates that `delta` is an integer.
- Calls `update_session_player_score` RPC to update atomically.
- Maps RPC errors like `not_found` and `negative_score` to API errors.
- Returns `{ "success": true, "score": number }`.

### `POST /api/cloudinary/sign-upload`

Requires `Authorization: Bearer <access_token>`.

Creates a signed upload payload for direct browser uploads.

- Verifies the Supabase access token.
- Reads and validates `resourceType` and `folder`.
- Generates a Cloudinary upload signature server-side.
- Returns upload URL, API key, timestamp, signature, folder, and resource type.

## Checks

Run these before handing off changes:

```bash
npm run format:check
npm run lint
npm run build
```
