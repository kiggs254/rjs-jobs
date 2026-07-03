# RJS Coffee Shop — Job Application Portal

A single full-stack **Next.js 16** app: a public careers site where people apply to
jobs, and an admin dashboard where staff post jobs, generate tailored screening
questions with AI, and review applicants who are **auto-graded and ranked by DeepSeek**.

## Stack
- **Next.js 16** (App Router) + React 19, CSS via Tailwind v4
- **Prisma 7** + **PostgreSQL** (pg driver adapter)
- **DeepSeek** (OpenAI-compatible API) for question generation, grading, and ranking
- Auth: email + password admin, `jose` JWT session cookie, `proxy.ts` route guard

## What it does
- **Admin** (`/admin`) — sign in, create jobs, click **Generate with AI** to draft
  screening questions (each with a grading rubric), edit/add/delete questions,
  then review applicants sorted by AI score, open an applicant to see per-answer
  scores + strengths/concerns, set status, and **Rank candidates** for a shortlist.
- **Applicants** (`/`) — browse open roles, apply with a dynamic question form.
  On submit, DeepSeek grades the answers against each question's rubric.

## Setup

1. **Install**
   ```bash
   npm install
   ```

2. **Configure env** — copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — your Postgres connection string
   - `DEEPSEEK_API_KEY` — from https://platform.deepseek.com
   - `AUTH_SECRET` — `openssl rand -base64 48`
   - `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — your first admin login

3. **Create the schema + seed**
   ```bash
   npm run db:push     # creates tables (no migration files; Prisma db push)
   npm run seed        # creates the admin user + a sample "Barista" job
   ```

4. **Run**
   ```bash
   npm run dev         # http://localhost:3000  (admin at /admin)
   ```

## Commands
| Command | What |
|---|---|
| `npm run dev` | Dev server on :3000 |
| `npm run build` | `prisma generate` + production build |
| `npm run start` | Production server |
| `npm run db:push` | Apply `schema.prisma` to the DB |
| `npm run seed` | Seed admin + sample job |
| `npm run lint` / `npx tsc --noEmit` | Lint / type-check |

## Notes
- **No migration files** — schema reaches the DB via `prisma db push`.
- Grading is **failure-quiet**: if DeepSeek is unreachable, the application is still
  saved and can be re-graded from the admin later. It never blocks the applicant.
- Security headers, `poweredByHeader: false`, and no prod source maps are set in
  `next.config.ts`; login + apply endpoints are rate-limited.
