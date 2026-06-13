# 501 Hub Demo

Demo Next.js/Supabase session dashboard for player profiles, match history,
score updates, and Cloudinary-hosted media.

## Environment

Create `.env.local` from `.env.example` and set:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

## Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Cloudinary Media

The app uses signed direct uploads. The browser asks
`/api/cloudinary/sign-upload` for signed parameters, uploads the selected image
or video directly to Cloudinary, then stores the returned `secure_url` and
`public_id` in Supabase.

Stored media fields:

- `players.photo_url`
- `players.photo_public_id`
- `sessions.video_url`
- `sessions.video_public_id`
- `sessions.video_source`

For this take-home, profile images and session videos can be uploaded through
the dashboard, while session video URLs can also be pasted directly.

In production, media handling should also include stricter signed-upload
policies, file type and size validation, folder and naming policies, moderation
or antivirus checks where appropriate, deletion/cleanup flows, and access
controls for private media.

## Checks

```bash
npm run format:check
npm run lint
npm run build
```
