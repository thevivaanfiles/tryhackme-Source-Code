# tryhackme coding club

A self-hosted, TryHackMe-style weekly capture-the-flag platform. Each week an
admin publishes **one challenge** with downloadable files and a flag. Players
solve it and submit the flag for **dynamic, decaying points** (a challenge is
worth less as more people solve it). A live leaderboard ranks everyone.

## Stack

- **Next.js 16** (App Router) + **TypeScript** + **Tailwind CSS v4**
- **PostgreSQL** + **Prisma 7** (driver-adapter `@prisma/adapter-pg`)
- **Auth.js (NextAuth v5)** — credentials (email + password), `USER` / `ADMIN` roles
- Challenge files stored on the **local filesystem**, served through an
  auth-gated API route
- Markdown challenge descriptions (sanitized with `rehype-sanitize`)

## Features

- Registration, login, sessions, role-based access (middleware-guarded `/admin`)
- Admin panel: create/edit/delete the weekly challenge, schedule release/close,
  upload attachments, configure scoring, and set the flag
- **Per-challenge flag matching** — exact (case-sensitive), exact
  (case-insensitive), regular expression, or multiple accepted answers. Flags are
  hashed (exact modes) and never sent to the client.
- Rate-limited flag submission with full submission audit trail
- Live leaderboard (scores reflect current decayed values; ties broken by speed)
- Per-user profile with solve history

## Run with Docker (recommended)

The fastest way to run the whole stack (app + PostgreSQL):

```bash
# 1. Set a real auth secret (and optionally admin creds) for compose to pick up
echo "AUTH_SECRET=$(openssl rand -base64 32)" >> .env

# 2. Build and start
docker compose up --build -d

# 3. Open http://localhost:3000  (admin: admin@ctf.local / changeme123)
```

What this does:

- Starts **Postgres 16** with a persistent `db-data` volume and a healthcheck.
- Builds the app image (multi-stage: installs deps → `prisma generate` → `next build`).
- On startup the app container runs **`prisma migrate deploy`**, then serves Next
  on port 3000. The default admin is the env credential — no seeding step.
- Uploaded challenge files persist in the `uploads` volume.

Configuration is via environment variables (compose reads `.env` for overrides):
`AUTH_SECRET`, `AUTH_URL`, `ADMIN_EMAIL/PASSWORD/USERNAME`,
`POSTGRES_USER/PASSWORD/DB`, `APP_PORT`, `SUBMIT_RATE_*`. Defaults work out of the
box for local use — **set a strong `AUTH_SECRET` and change the admin password
before exposing it publicly.**

```bash
docker compose logs -f app      # follow app logs
docker compose down             # stop (keeps volumes/data)
docker compose down -v          # stop and wipe the database + uploads
```

> Migrations run on every container start (single-instance friendly). If you run
> multiple app replicas, move `prisma migrate deploy` to a dedicated one-shot job.

## Getting started (local, without Docker)

### 1. Prerequisites

- Node.js 20+ (built with v24)
- PostgreSQL running locally (or any reachable Postgres)

### 2. Configure environment

Copy the example env and adjust values:

```bash
cp .env.example .env
```

Key variables (see `.env` / `.env.example`):

- `DATABASE_URL` — Postgres connection string
- `AUTH_SECRET` — generate with `openssl rand -base64 32`
- `UPLOAD_DIR` — where uploaded files are stored (default `uploads`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_USERNAME` — the **default admin** is a
  system account validated from these env vars (no database row). Log in with
  them to reach `/admin`. Change them for production.
- `SUBMIT_RATE_MAX` / `SUBMIT_RATE_WINDOW_SECONDS` — flag submission rate limit

### 3. Install & migrate

```bash
npm install
npm run db:migrate      # apply Prisma migrations
npm run db:generate     # generate the Prisma client (if needed)
```

No seeding needed — sign in with `ADMIN_EMAIL` / `ADMIN_PASSWORD` to access the
admin panel.

### 4. Run

```bash
npm run dev             # http://localhost:3000
```

Sign in with the seeded admin (default `admin@ctf.local` / `changeme123` —
change it after first login), open **Admin → Challenges → New**, create Week 1,
upload files, set the flag, mark it published, and you're live.

## Useful scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` / `npm start` | Production build / serve |
| `npm run db:migrate` | Create & apply migrations |
| `npm run db:studio` | Open Prisma Studio to inspect data |

## Project layout

```
prisma/schema.prisma     Data model (User, Challenge, Attachment, Submission, Solve)
prisma.config.ts         Prisma 7 connection + migration config
src/lib/                 db, auth, scoring, flag matching, file storage, validation
src/app/                 Public pages, admin panel, API routes
src/components/          NavBar, ChallengeForm, Markdown renderer
uploads/                 Stored challenge files (gitignored)
```

## Notes for deployment (self-hosted Node)

- Run `npm run build && npm start` behind a reverse proxy (e.g. nginx).
- Persist the `uploads/` directory and the Postgres database.
- Set a strong `AUTH_SECRET` and a real `AUTH_URL` for the production domain.
- Max upload size is 50 MB/file (`MAX_FILE_BYTES` in `src/lib/actions/admin.ts`
  and `serverActions.bodySizeLimit` in `next.config.ts`).
