# PlanMyTrip

Plan a trip day by day and print a clean itinerary. Specs live in [`specs/`](./specs).

| Part | Stack | Spec |
|------|-------|------|
| `frontend/` | React + TypeScript + Vite + Tailwind | [frontend-spec.md](./specs/frontend-spec.md) |
| `backend/` | Python 3.14 + FastAPI + SQLAlchemy + Alembic | [backend-spec.md](./specs/backend-spec.md) |
| API | REST JSON under `/api/v1` | [api-contract-spec.md](./specs/api-contract-spec.md) |
| Hosting | Vercel (Services) + Neon PostgreSQL | [backend-spec.md §14](./specs/backend-spec.md#14-deployment) |

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

Open http://localhost:5173. The Vite dev server forwards `/api` requests to the backend.

## Tests

```bash
cd backend && uv run pytest     # needs the Docker database running
```

## Useful commands

| Command | What it does |
|---------|--------------|
| `docker compose down` (in `backend/`) | Stop the database, keep its data |
| `docker compose down -v` (in `backend/`) | Stop the database and delete all its data |
| `uv run alembic revision -m "..."` (in `backend/`) | Create a new migration |
| http://localhost:8000/api/v1/docs | Interactive API docs (while the backend runs) |
