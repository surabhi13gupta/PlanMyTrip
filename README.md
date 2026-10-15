# PlanMyTrip

Plan a trip day by day and print a clean itinerary.

**Live:** https://planmytrip-sur.vercel.app

Specs live in [`specs/`](./specs); a guided tour of the project is in [`docs/build-guide.html`](./docs/build-guide.html).

| Part | Stack | Spec |
|------|-------|------|
| `frontend/` | React 19 + TypeScript + Vite + Tailwind, React Router, TanStack Query, React Hook Form + Zod, react-pdf | [frontend-spec.md](./specs/frontend-spec.md) |
| `backend/` | Python 3.14 + FastAPI + SQLAlchemy + Alembic, Argon2 passwords, cookie sessions | [backend-spec.md](./specs/backend-spec.md) |
| API | REST JSON under `/api/v1` | [api-contract-spec.md](./specs/api-contract-spec.md) |
| Hosting | Vercel (Services) + Neon PostgreSQL | [backend-spec.md §14](./specs/backend-spec.md#14-deployment) |

## What it does

- Sign up with a username, password, and optional name (you're greeted by first name). Closing the page logs you out; refreshing doesn't.
- Add a trip (From, To, Destination, Trip Type; up to 14 days, not in the past).
- Plan each day: add, edit, and delete activities (title, optional time and notes).
- Edit a trip's dates; shortening it warns before deleting activities on removed days.
- Print: downloads the itinerary as a PDF, built in the browser.
- Unsaved activity edits are saved automatically if the page closes.

## Run locally

You need Node.js, [uv](https://docs.astral.sh/uv/), and Docker (Docker Desktop with WSL Integration on Windows).

```bash
# 1. Database (PostgreSQL 16 in Docker)
cd backend
docker compose up -d --wait db
cp -n .env.example .env

# 2. Backend: install, migrate, run on http://localhost:8000
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --port 8000

# 3. Frontend (second terminal): run on http://localhost:5173
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 and create an account. The Vite dev server forwards `/api` requests to the backend.

## Tests and checks

| Command | What it checks |
|---------|----------------|
| `cd backend && uv run pytest` | API: auth, sessions, trips, activities, ownership (needs the Docker database) |
| `cd backend && uv run ruff check .` | Backend lint |
| `cd frontend && npm test` | Date/sorting helpers, form rules, components (API mocked with MSW) |
| `cd frontend && npm run build` | Type check + production build |
| `cd frontend && npm run lint` | Frontend lint (oxlint) |

End-to-end browser tests (Playwright) are future scope: they're in `frontend/e2e/`, commented out.

**Low on memory?** Running every frontend test file at once can starve a small machine. Run one file at a time instead:

```bash
cd frontend && npx vitest run src/lib/greeting.test.ts --maxWorkers=1
```

## Deployment

The app runs on **Vercel** (one project, using Vercel Services for the frontend and the FastAPI backend at one address) with a **Neon** PostgreSQL database. Details: [backend-spec.md §14](./specs/backend-spec.md#14-deployment).

| What | How |
|------|-----|
| Production | Every push to `main` deploys to https://planmytrip-sur.vercel.app (also `plan-my-trip-six.vercel.app`) |
| Preview | Every other branch or pull request gets its own preview link **and its own Neon database branch**, so testing can't touch real data. Confirm this once before the first branch work (push a test branch, check Neon shows a new branch, delete both) |
| Database migrations | Run automatically in every build (`uv run alembic upgrade head` in the backend service), before the new version goes live |
| Database settings | Added by the Vercel–Neon integration with the prefix `DATABASE`: `DATABASE_URL` (pooled, used by the app) and `DATABASE_URL_UNPOOLED` (direct, used by migrations) |
| Production mode | Detected from Vercel's `VERCEL_ENV`, so the session cookie is `Secure` with no manual setup |
| Domains | Vercel project → Settings → Domains. `plan-my-trip.vercel.app` belongs to someone else |
| Health check | https://planmytrip-sur.vercel.app/api/v1/health → `{"status":"ok"}` |


## Useful commands

| Command | What it does |
|---------|--------------|
| `docker compose down` (in `backend/`) | Stop the database, keep its data |
| `docker compose down -v` (in `backend/`) | Stop the database and delete all its data |
| `uv run alembic revision --autogenerate -m "..."` (in `backend/`) | Create a migration from model changes (review it before committing) |
| http://localhost:8000/api/v1/docs | Interactive API docs (while the backend runs) |

## Credits

- Banner photo: Mount Fuji with the Chureito Pagoda, by [Tomáš Malík on Pexels](https://www.pexels.com/photo/3408354/) (Pexels License).
- Fonts: [Fira Sans](https://fontsource.org/fonts/fira-sans) and [Dancing Script](https://fontsource.org/fonts/dancing-script) (SIL Open Font License), self-hosted via Fontsource.
