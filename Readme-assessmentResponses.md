## Assessment Questions

### Frontend Performance Optimisation

The frontend is split into focused dashboard components, and the data flow is
designed so the app does not fetch or rerender more than it needs to.

The match history endpoint returns lightweight summary data, while the selected
session endpoint returns the heavier player and video data only when a user
chooses a session. That keeps the initial dashboard load smaller and avoids
moving full session details around unnecessarily.

Other performance choices include:

- Componentized dashboard sections for navigation, match history, player cards,
  session header, video, and profile editing.
- Isolated score rendering through a shared score store so a single score update
  does not rerender every player card.
- Loading, empty, and error states that keep the interface responsive while work
  is in progress.
- Supabase Realtime subscriptions scoped to the currently selected session.
- Cloudinary media delivery instead of storing or serving large files through
  the frontend or database.

### Efficient Handling Of Images And Video

The database stores only media URLs and useful metadata, not the raw image or
video files. Cloudinary is responsible for upload storage, CDN delivery, and
runtime optimization.

This gives the app a cleaner media path:

- Profile images and uploaded videos go directly from the browser to Cloudinary.
- The server signs upload parameters without exposing the API secret.
- Supabase stores `secure_url`, `public_id`, and source metadata.
- The UI renders optimized Cloudinary URLs for uploaded media.
- Provided video links remain supported for quick demo data entry.

In production, I would tighten this further with upload presets, stricter file
size/type checks, folder policies, moderation or antivirus checks where needed,
and cleanup flows for deleted or replaced media.

### What I Would Do Differently At Scale

The current version stores the current score on `session_players`, which is
enough for the assignment because the requirement is to update player scores. At
scale, I would add a `score_events` table so every score change is auditable and
replayable. That would support match history, analytics, dispute resolution, and
event sourcing-style rebuilds.

I would also consider:

- Dedicated WebSocket infrastructure or event streaming for very high-frequency
  score updates.
- Pagination and caching for large match-history lists.
- Caching for player summaries and session lists.
- Role-based access control for admins, players, and spectators.
- Automated tests for API routes, auth flows, score controls, and critical UI
  states.
- Optimistic UI updates with rollback for score changes once the backend rules
  are fully hardened.
- Observability through structured logs, metrics, traces, and alerting.

### Security Concerns

The biggest security concern in the demo version is authorization. Some API
routes are intentionally open for the take-home version, and the service-role
client is used server-side for simple database access. That is acceptable for a
controlled demo, but it is not enough for production.

The main risks are:

- Users modifying sessions they do not own or belong to.
- Users updating scores for sessions they should not control.
- Permissive use of admin client for db updates.
- Abuse of open API endpoints.
- Unsafe or oversized media uploads.
- Overly broad CORS or client-side trust.
- Missing audit trails for sensitive changes.

### How I Would Address Security In Production

In production, I would move more of the authorization model into Supabase Row
Level Security and back it up with route-level checks and also middlewares. The API should verify who
the user is, what role they have, and whether they are allowed to perform the
specific action.

Concrete production hardening steps:

- Add RLS policies for `players`, `sessions`, and `session_players`.
- Add role-based permissions for admins, players, and spectators.
- Validate all API inputs with a schema library such as Zod.
- Add rate limiting to auth-sensitive and write-heavy endpoints.
- Add audit logging for profile changes, session changes, and score updates.
- Keep service-role usage limited to server-only modules and never expose
  server secrets to client components.
