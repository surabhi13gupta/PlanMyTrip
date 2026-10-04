# PlanMyTrip

Plan a trip day by day and print a clean itinerary. Specs live in [`specs/`](./specs); a guided tour of the project is in [`docs/build-guide.html`](./docs/build-guide.html).

| Part | Stack | Spec |
|------|-------|------|
| `frontend/` | React 19 + TypeScript + Vite + Tailwind, React Router, TanStack Query, React Hook Form + Zod, react-pdf | [frontend-spec.md](./specs/frontend-spec.md) |
| `backend/` | Python 3.14 + FastAPI + SQLAlchemy + Alembic, Argon2 passwords, cookie sessions | [backend-spec.md](./specs/backend-spec.md) |
| API | REST JSON under `/api/v1` | [api-contract-spec.md](./specs/api-contract-spec.md) |
| Hosting | Vercel (Services) + Neon PostgreSQL | [backend-spec.md §14](./specs/backend-spec.md#14-deployment) |

## What it does

- Sign up / log in with a username and password. Closing the page logs you out; refreshing doesn't.
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
| `cd frontend && npm run e2e` | End-to-end in a real browser at desktop and 375px widths (needs the Docker database; first run: `npx playwright install chromium`) |

## Useful commands

| Command | What it does |
|---------|--------------|
| `docker compose down` (in `backend/`) | Stop the database, keep its data |
| `docker compose down -v` (in `backend/`) | Stop the database and delete all its data |
| `uv run alembic revision --autogenerate -m "..."` (in `backend/`) | Create a migration from model changes (review it before committing) |
| http://localhost:8000/api/v1/docs | Interactive API docs (while the backend runs) |
