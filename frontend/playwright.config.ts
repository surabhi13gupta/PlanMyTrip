import { defineConfig } from '@playwright/test'

// End-to-end tests against the real backend and database (frontend-spec.md §14).
// Needs the Docker database running: `cd backend && docker compose up -d --wait db`.
export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  fullyParallel: false,
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium', viewport: { width: 1280, height: 800 } } },
    // Every screen must work at 375px wide (frontend-spec.md §10).
    {
      name: 'mobile-375',
      use: { browserName: 'chromium', viewport: { width: 375, height: 740 }, hasTouch: true },
    },
  ],
  webServer: [
    {
      command: 'uv run alembic upgrade head && uv run uvicorn app.main:app --port 8000',
      cwd: '../backend',
      url: 'http://localhost:8000/api/v1/health',
      reuseExistingServer: true,
      timeout: 120_000,
    },
    {
      command: 'npm run dev -- --port 5173 --strictPort',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
})
