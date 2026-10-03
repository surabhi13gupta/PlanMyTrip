# Frontend Spec — PlanMyTrip

> Status: Draft | Owner: Surabhi Gupta | Last updated: 2026-10-04
> Related: [goal-spec.md](./goal-spec.md), [api-contract-spec.md](./api-contract-spec.md)

## 1. Overview
<!-- Purpose of the frontend and how it serves the goals. -->
The frontend is a responsive single-page app (SPA) that runs in the browser. It lets a user sign up, create trips, plan activities for each day, and export the itinerary as a PDF (goals G1–G4). It talks to the backend only through the REST API in [api-contract-spec.md](./api-contract-spec.md). The PDF is generated entirely in the browser, so exporting needs no server call.

Terms such as Trip, Day, Activity, and Itinerary are used as defined in the Glossary in [goal-spec.md](./goal-spec.md#14-glossary).

## 2. Tech Stack
- Framework: React 19
- Language: TypeScript (strict mode)
- Styling / UI library: Tailwind CSS, with no component library. Dialogs use the native `<dialog>` element.
- State management: TanStack Query for data from the server. React state (`useState`) for UI state. No global store.
- Routing: React Router
- Data fetching: `fetch` wrapped in a small API client (`src/api/client.ts`) and called through TanStack Query hooks
- Forms & validation: React Hook Form + Zod
- Dates: date-fns
- PDF: `@react-pdf/renderer`, loaded only when the user exports. The PDF uses Fira Sans too, registered with the PDF library's `Font.register`, and the same dark blue for headings.
- Notifications: `sonner` (toasts)
- Testing: Vitest + React Testing Library + MSW (to mock the API); Playwright for end-to-end tests
- Build tool: Vite
- Linting / formatting: ESLint + Prettier

## 3. Pages / Routes
| Route | Page | Auth Required | Description | Story |
|-------|------|---------------|-------------|-------|
| `/` | — | — | Redirects to `/trips` if logged in, otherwise to `/login` | — |
| `/signup` | Signup | No | Create an account | US1 |
| `/login` | Login | No | Log in | US2 |
| `/trips` | My Trips | Yes | List of the user's trips | US4 |
| `/trips/new` | Create Trip | Yes | Form to create a trip | US3 |
| `/trips/:tripId` | Day-by-Day Plan | Yes | A trip's days and activities, plus Export PDF | US5, US6 |
| `/trips/:tripId/edit` | Edit Trip | Yes | Change or delete the trip | US7 |
| `*` | Not Found | No | 404 page with a link back to My Trips | — |

**Route rules**
- A logged-out user who opens a page that needs login is sent to `/login?redirect=<original path>`. After logging in, they go back to that path.
- A logged-in user who opens `/login` or `/signup` is sent to `/trips`.
- A trip that doesn't exist, or that belongs to another user, shows the Not Found page (the API returns 404 in both cases).

## 4. Page Details

### 4.1 Signup
- **Route:** `/signup`
- **Purpose:** Create an account (US1).
- **Layout / sections:** A centered card with the app name, the signup form, and a link: "Already have an account? Log in".
- **Components used:** `AuthLayout`, `SignupForm`
- **Data needed (API calls):** `POST /auth/signup`
- **User interactions:** Fill in username, password, and confirm password, then submit. On success, the user is logged in and taken to `/trips`.
- **Loading / empty / error states:** The submit button is disabled and shows a spinner while the request runs. If the username is taken (409), the error appears under the username field. Other errors appear above the form.

### 4.2 Login
- **Route:** `/login`
- **Purpose:** Log in (US2).
- **Layout / sections:** The same card layout as Signup, with a link: "New here? Create an account".
- **Components used:** `AuthLayout`, `LoginForm`
- **Data needed (API calls):** `POST /auth/login`
- **User interactions:** Fill in username and password, then submit. On success, go to the `redirect` path, or to `/trips` if there is none.
- **Loading / empty / error states:** Submit spinner as on Signup. Wrong credentials (401) show one message above the form: "Invalid username or password."

### 4.3 My Trips
- **Route:** `/trips`
- **Purpose:** See all trips and open one (US4).
- **Layout / sections:** The header, a page title with a "Create trip" button, and a list of trip cards: one column on mobile, two to three columns on wider screens.
- **Components used:** `AppLayout`, `TripCard`, `EmptyState`
- **Data needed (API calls):** `GET /trips`
- **User interactions:** Click a card to open its plan. Click "Create trip" to go to `/trips/new`.
- **Sort order:** Upcoming and current trips first, by start date (soonest first), then past trips (most recent first).
- **Loading / empty / error states:** Skeleton cards while loading. With no trips, show "No trips yet" and a "Create trip" button. On an error, show a message with a Retry button.

### 4.4 Create Trip
- **Route:** `/trips/new`
- **Purpose:** Create a trip (US3).
- **Layout / sections:** A page title, then `TripForm`. The form is one column, at most about 640px wide.
- **Components used:** `AppLayout`, `TripForm`
- **Data needed (API calls):** `POST /trips`
- **User interactions:** Fill in name, destination, start date, end date, and Trip Type (four buttons: Solo, Couple, Family, Friends). The date pickers don't offer dates before today. The form shows the trip length as you pick dates, e.g. "5 days". On success, go to `/trips/:tripId`. "Cancel" goes back to `/trips`.
- **Loading / empty / error states:** Submit spinner. Validation errors appear under each field (see section 9). Server errors appear above the form.

### 4.5 Day-by-Day Plan
- **Route:** `/trips/:tripId`
- **Purpose:** Plan activities for each day (US5) and export the itinerary (US6).
- **Layout / sections:**
  - A trip header with the name, destination, dates, Trip Type badge, and the buttons "Edit trip" and "Export PDF".
  - A strip of day chips ("Day 1 · Oct 10", …) that scrolls sideways on mobile. Clicking a chip scrolls to that day.
  - A `DayCard` for each day, from Day 1 to Day N, stacked vertically. Each card lists its activities and has an "+ Add activity" button.
- **Components used:** `AppLayout`, `TripHeader`, `DayNav`, `DayCard`, `ActivityItem`, `ActivityForm`, `ConfirmDialog`, `ExportPdfButton`
- **Data needed (API calls):** `GET /trips/:tripId` (the trip with its activities), `POST /trips/:tripId/activities`, `PATCH /trips/:tripId/activities/:activityId`, `DELETE /trips/:tripId/activities/:activityId`
- **User interactions:**
  - **Add:** "+ Add activity" opens an `ActivityForm` inside that day's card (title, optional time, optional notes). Save or Cancel.
  - **Edit:** Clicking an activity's edit icon replaces it with an `ActivityForm` that is already filled in.
  - **Delete:** The delete icon opens a `ConfirmDialog` ("Delete 'Visit the Louvre'?").
  - **Sort:** Within a day, activities with a time appear first, in time order. Activities without a time follow, in the order they were created (the `sortActivities` helper).
  - **Days:** The list of days is worked out from the trip's start and end dates (the `getTripDays` helper). The user never creates or deletes days.
  - **Day numbers:** Each activity belongs to a day number (Day 1, Day 2, …), not to a calendar date. If the trip's dates move, the activities move with them; e.g. Day 2's activities follow Day 2 to its new date.
- **Loading / empty / error states:** A skeleton header and cards while loading. A day with no activities shows "No activities planned" in muted text. If saving fails, a toast appears and the form stays open with what the user typed. A trip that isn't found shows the Not Found page.

### 4.6 Edit Trip
- **Route:** `/trips/:tripId/edit`
- **Purpose:** Change or delete a trip (US7).
- **Layout / sections:** The same `TripForm`, filled in with the trip's details, and below it a "Danger zone" section with a "Delete trip" button.
- **Components used:** `AppLayout`, `TripForm`, `ConfirmDialog`
- **Data needed (API calls):** `GET /trips/:tripId`, `PATCH /trips/:tripId`, `DELETE /trips/:tripId`
- **User interactions:**
  - **Save:** Before sending, the frontend counts the activities whose day number is greater than the new trip length (the `countActivitiesBeyondDay` helper). For example, going from 5 days to 3 removes Days 4 and 5. Moving the dates without changing the length removes nothing. If there are any, a `ConfirmDialog` shows: "Your new dates remove days that have 3 activities. They will be deleted." with "Delete and save" or "Cancel". Cancel changes nothing. If confirmed, or if no activities are affected, the trip is saved (PATCH) and the user goes to `/trips/:tripId`.
  - **Delete trip:** A `ConfirmDialog` shows: "Delete 'Paris Getaway' and all its activities? This can't be undone." On success, go to `/trips` with a toast.
- **Loading / empty / error states:** Same as Create Trip. If the trip isn't found, show the Not Found page.

### 4.7 Not Found
- **Route:** `*`
- **Purpose:** Handle unknown or inaccessible URLs.
- **Layout / sections:** A "Page not found" message with a link to My Trips.

## 5. Component Inventory
| Component | Responsibility | Props | Used In |
|-----------|----------------|-------|---------|
| `AppLayout` | Page frame with header (app name links to `/trips`, username, Log out) and content area | `children` | All logged-in pages |
| `AuthLayout` | Centered card layout for auth pages | `title`, `children` | Signup, Login |
| `ProtectedRoute` | Redirects to `/login` if the user isn't logged in | `children` | Router |
| `PublicOnlyRoute` | Redirects to `/trips` if the user is logged in | `children` | Router |
| `SignupForm` / `LoginForm` | Auth forms with validation and error display | `onSuccess` | Signup, Login |
| `TripForm` | Create/edit trip form; shows live trip length | `defaultValues?`, `onSubmit`, `submitLabel`, `isSubmitting` | Create Trip, Edit Trip |
| `TripTypePicker` | Four-option selector for Trip Type | `value`, `onChange` | `TripForm` |
| `TripCard` | One trip in the list | `trip` | My Trips |
| `TripHeader` | Trip details plus Edit / Export buttons | `trip` | Day-by-Day Plan |
| `DayNav` | Horizontal day chips that scroll to a day | `days` | Day-by-Day Plan |
| `DayCard` | One day: heading, sorted activities, add button | `day`, `activities`, `tripId` | Day-by-Day Plan |
| `ActivityItem` | Shows one activity with edit/delete icons | `activity`, `onEdit`, `onDelete` | `DayCard` |
| `ActivityForm` | Inline add/edit form for an activity | `defaultValues?`, `onSubmit`, `onCancel` | `DayCard` |
| `ConfirmDialog` | Accessible confirmation dialog (native `<dialog>`) | `open`, `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel`, `destructive?` | Plan, Edit Trip |
| `ExportPdfButton` | Lazy-loads the PDF library, builds the PDF, downloads it | `trip`, `activities` | `TripHeader` |
| `ItineraryPdf` | The PDF layout (react-pdf document) | `trip`, `days`, `activities` | `ExportPdfButton` |
| `EmptyState` | Message + optional action button | `title`, `message`, `action?` | My Trips |
| `Skeleton` / `Spinner` | Loading placeholders | — | Many |
| `ErrorState` | Error message with Retry | `message`, `onRetry` | Many |

## 6. State Management
- **Global state:** None. The logged-in user comes from the `['me']` query (`GET /auth/me`); `useAuth()` reads it. Nothing else needs to be shared across pages.
- **Server state / caching (TanStack Query):**
  - Query keys: `['me']`, `['trips']`, `['trip', tripId]`
  - After creating, editing, or deleting a trip, the app refreshes `['trips']` and `['trip', tripId]`.
  - After adding, editing, or deleting an activity, the app refreshes `['trip', tripId]`. These changes are not shown before the server confirms them, because that's simpler and the API is fast enough.
  - On logout, the app clears the whole query cache.
- **Local / persisted state:** Form state lives in React Hook Form. Nothing is stored in localStorage; the login session is held in a cookie (section 8).

## 7. User Flows
1. **First-time user**
   1. Opens `/` → redirected to `/login` → clicks "Create an account"
   2. Signs up → lands on My Trips and sees the empty state
   3. Clicks "Create trip" → fills in the form → lands on the new trip's Day-by-Day Plan
2. **Planning a day**
   1. On the Day-by-Day Plan, taps "Day 2" in the day chips → page scrolls to Day 2
   2. Clicks "+ Add activity" → enters a title, time, and notes → Save
   3. The activity appears in Day 2 in the right order
3. **Exporting**
   1. On the Day-by-Day Plan, clicks "Export PDF"
   2. The button shows a spinner while the PDF library loads and the PDF is built
   3. The browser downloads `<Trip-Name>-itinerary.pdf`
4. **Shortening a trip**
   1. Clicks "Edit trip" → moves the end date two days earlier → Save
   2. Sees the warning with how many activities will be deleted
   3. Confirms → returns to the plan, which now has fewer days. (Or cancels → nothing changes.)
5. **Session expired**
   1. Any API call returns 401
   2. The app clears the cache and sends the user to `/login?redirect=<current path>` with a toast: "Please log in again."

## 8. Authentication (Client Side)
- **Login / signup flow:** On success, the backend sets the session cookie and returns the user. The frontend stores that user in the `['me']` query and navigates.
- **Token storage:** The login token is kept in an `httpOnly`, `Secure`, `SameSite=Lax` cookie set by the backend. Page scripts cannot read it, so it is safe from XSS. The frontend never stores or reads the token; it sends every request with `credentials: 'include'`. *(The backend and API contract specs must match this.)*
- **Startup:** When the app loads, it calls `GET /auth/me` and shows a full-page spinner until the answer arrives. A 200 means logged in; a 401 means logged out.
- **Protected route handling:** `ProtectedRoute` and `PublicOnlyRoute` apply the route rules in section 3.
- **Logout:** `POST /auth/logout`, then the app clears the query cache and goes to `/login`.

## 9. Forms & Validation
Each form's rules are written as a Zod schema in `src/lib/schemas.ts`. The backend enforces the same rules.

| Form | Fields | Validation Rules |
|------|--------|------------------|
| Signup | username, password, confirmPassword | username: required, 3–30 characters, only letters, numbers, and `_`; case-insensitive ("Surabhi" and "surabhi" are the same account; the backend stores it in lowercase). password: required, 8–72 characters. confirmPassword: must match password |
| Login | username, password | Both required (no other rules, so the form gives no hints about valid usernames) |
| Trip (create/edit) | name, destination, startDate, endDate, tripType | name: required, 1–100 characters, trimmed. destination: required, 1–100 characters, trimmed. startDate, endDate: required, valid dates. startDate ≥ today (the user's local date) when creating; when editing, only if the start date was changed, so a trip that has already started can still be edited. endDate ≥ startDate. Trip length (both dates counted) ≤ 14 days. tripType: one of `solo`, `couple`, `family`, `friends` |
| Activity | title, time, notes | title: required, 1–100 characters, trimmed. time: optional, `HH:mm` (24-hour). notes: optional, ≤ 500 characters |

- Errors appear under the field once the user leaves it, and on every field when they submit.
- Server validation errors (400 with a list of field errors) are shown on the matching fields.

**Date handling:** Trip dates and days are calendar dates without time zones. They are sent as `YYYY-MM-DD` strings and never converted to a time that includes a time zone. Date math lives in `src/lib/dates.ts` (`getTripDays`, `getTripDuration`, `formatDayLabel`) and is unit-tested.

## 10. Design System
- **Colors / theme:** White cards on a light brown page, with dark blue as the main color. The colors are defined once as Tailwind theme tokens (in `src/styles.css`, using `@theme`), so components use names like `bg-sand` or `text-primary`, never raw hex values.

  | Token | Hex | Used for |
  |-------|-----|----------|
  | `sand` | `#F4ECE1` | Page background (light brown) |
  | `surface` | `#FFFFFF` | Cards, forms, dialogs, header |
  | `primary` | `#1E3A5F` | Main buttons, links, active day chip, focus rings, headings (dark blue) |
  | `primary-hover` | `#152A45` | Hover / pressed state of main buttons and links |
  | `primary-soft` | `#E3EAF3` | Trip Type badges, selected Trip Type option, light highlights |
  | `ink` | `#1E293B` | Body text |
  | `muted` | `#6B5E4E` | Secondary text: dates, "No activities planned", hints |
  | `line` | `#E5D9C8` | Card borders and dividers (decorative) |
  | `field-border` | `#8C7B66` | Input and checkbox borders (dark enough to see clearly) |
  | `danger` | `#B91C1C` | Delete buttons, error messages |

  - Main buttons are `primary` with white text. Secondary buttons are white with a `primary` border and text.
  - **Contrast checks (WCAG AA):** `primary` on white 11.5:1, on `sand` 9.8:1; `muted` on white 6.3:1, on `sand` 5.4:1; `field-border` on white 4.1:1 (form borders need at least 3:1); `danger` on white 6.5:1. `line` is used only for decoration, never as the only way to see a control.
- **Typography:** Fira Sans, self-hosted through the `@fontsource/fira-sans` npm package (no request to Google Fonts), in weights 400 (body), 500 (labels, buttons), and 600 (headings). Fallback: `system-ui, sans-serif`. Base text 16px, so mobile browsers don't zoom into form fields. Headings use `text-2xl` and `text-xl` with `font-semibold` in `primary`.
- **Spacing / grid:** Tailwind's spacing scale. Page content is centered at most `max-w-5xl`; forms are at most `max-w-xl`. Side padding is 16px on mobile and 24px on desktop.
- **Light / dark mode:** Light only in the MVP. Dark mode is a post-MVP item.
- **Responsive breakpoints:** Built mobile-first with Tailwind's default breakpoints (`sm` 640px, `md` 768px, `lg` 1024px). Every screen must work at 375px wide with no sideways scrolling, except the day chips, which scroll sideways on purpose.
- **Touch targets:** At least 44×44px on mobile.

## 11. Accessibility
- **Target standard:** WCAG 2.1 AA
- **Keyboard navigation:** Everything works by keyboard. Focus is always visible (`focus-visible` rings). Dialogs keep focus inside while open and give it back afterwards; the native `<dialog>` does this. Escape closes dialogs and inline forms.
- **Screen reader considerations:** Every input has a `<label>`. Field errors are linked with `aria-describedby`. Icon-only buttons have an `aria-label` (e.g. "Edit Visit the Louvre"). Each page has one `<h1>`, and each day uses `<h2>`. Toasts are announced through a live region.
- **Color:** Text contrast is at least 4.5:1. Errors are never shown by color alone.

## 12. Error Handling & Notifications
- **API error display:** The API client turns non-2xx responses into an `ApiError` with `status`, `code`, `message`, and `details` (the error format in [api-contract-spec.md](./api-contract-spec.md#2-standard-error-response)).
  - 400: field errors on the form
  - 401: the session-expired flow (section 7, flow 5)
  - 404: Not Found page
  - 409: shown on the related field (e.g. username taken)
  - 5xx or network error: toast "Something went wrong. Please try again."
- **Toasts / banners:** Success toasts for creating, editing, and deleting trips. Error toasts for saves that fail. Saving activities shows no success toast, because the change on screen is confirmation enough.
- **Fallback / error boundary:** Each route has a React Router `errorElement` for unexpected crashes, with a "Reload" button.

## 13. Performance
- **Code splitting / lazy loading:** `@react-pdf/renderer` is loaded with `import()` only when the user clicks Export, keeping it out of the initial bundle. Pages are lazy-loaded per route.
- **Image optimization:** No images in the MVP. Icons are inline SVG.
- **Targets:** Initial JavaScript ≤ 200 KB gzipped (not counting the PDF library). LCP < 2.5s on simulated 4G.

## 14. Testing Strategy
- **Unit:** `src/lib` helpers: `getTripDays`, `getTripDuration`, `sortActivities`, `countActivitiesBeyondDay`, and the Zod schemas (especially the start-date, end-date, and 14-day rules).
- **Component:** `TripForm` (validation, live trip length), `DayCard` (sorting, empty day), the Edit Trip warning dialog, and `ProtectedRoute` redirects. API calls are mocked with MSW.
- **End-to-end:** One Playwright test for the whole flow (sign up → create trip → add activities → export PDF and check that a file downloads), run at desktop size and at 375px.

## 15. Project Structure
```
frontend/
  index.html
  vite.config.ts          # dev proxy: /api → backend (keeps cookies same-site)
  .env.example            # VITE_API_BASE_URL=/api/v1
  src/
    main.tsx              # React root, QueryClientProvider, Toaster
    styles.css            # Tailwind import, @theme color tokens, Fira Sans
    router.tsx            # routes + ProtectedRoute / PublicOnlyRoute
    api/
      client.ts           # fetch wrapper, ApiError, credentials: 'include'
      auth.ts             # signup, login, logout, me
      trips.ts            # trips + activities calls
    hooks/                # useAuth, useTrips, useTrip, useActivityMutations
    pages/                # SignupPage, LoginPage, TripsPage, NewTripPage,
                          # TripPlanPage, EditTripPage, NotFoundPage
    components/           # components from section 5
    pdf/
      ItineraryPdf.tsx
      exportItinerary.ts  # lazy entry point: builds blob + triggers download
    lib/
      dates.ts
      activities.ts       # sortActivities, countActivitiesBeyondDay
      schemas.ts          # Zod schemas
    types/
      index.ts            # User, Trip, Activity, TripType (match API shapes)
  tests/                  # Vitest setup, MSW handlers
  e2e/                    # Playwright tests
```

## 16. Open Questions
- None right now.

### Resolved
| Question | Decision |
|----------|----------|
| Are activities tied to a calendar date or a day number? | **Day number.** Moving a trip's dates moves its plan with it; shortening a trip removes the last days (after the warning) |
| Session cookie or Bearer token? | **`httpOnly` session cookie** (section 8). The API contract will use a cookie instead of an `Authorization` header |
| Can a trip start in the past? | **No, not in the MVP.** The start date must be today or later; recording past trips is future work (see goal spec) |
| Are usernames case-insensitive? | **Yes.** Stored and compared in lowercase |
