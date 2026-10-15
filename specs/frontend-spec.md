# Frontend Spec — PlanMyTrip

> Status: Draft | Owner: Surabhi Gupta | Last updated: 2026-10-16
> Related: [goal-spec.md](./goal-spec.md), [api-contract-spec.md](./api-contract-spec.md), [ai-spec.md](./ai-spec.md)

## 1. Overview
<!-- Purpose of the frontend and how it serves the goals. -->
The frontend is a responsive single-page app (SPA) that runs in the browser. It lets a user sign up, create trips, plan activities for each day, and print the itinerary as a PDF (goals G1–G4). Page layouts follow the hand-drawn mockups: [first screen and new trip screen](./mockups/first-and-new-trip-screens.jpg), and [saved trip](./mockups/saved-trip-screen.jpg). The mockups set the layout only; colors and type come from section 10, and the app is called PlanMyTrip (not the "Musafir Travels" written on the sketch). It talks to the backend only through the REST API in [api-contract-spec.md](./api-contract-spec.md). The PDF is generated entirely in the browser, so exporting needs no server call. On the Trip Page, a **trip assistant** (an AI chat for the whole trip) suggests activities and hotels, which the user adds with one click. Its behavior is specified in [ai-spec.md](./ai-spec.md), and its frontend parts in section 4.8.

Terms such as Trip, Day, Activity, and Itinerary are used as defined in the Glossary in [goal-spec.md](./goal-spec.md#13-glossary).

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
- Testing: Vitest + React Testing Library + MSW (to mock the API). End-to-end tests with Playwright are **future scope** (section 14)
- Build tool: Vite
- Linting / formatting: oxlint (ships with Vite's React template; much faster than ESLint, with React, hooks and accessibility rules built in). No separate formatter in the MVP; keep the existing code style.

## 3. Pages / Routes
| Route | Page | Auth Required | Description | Story |
|-------|------|---------------|-------------|-------|
| `/` | — | — | Redirects to `/trips` if logged in, otherwise to `/login` | — |
| `/signup` | Signup | No | Create an account | US1 |
| `/login` | Login | No | Log in | US2 |
| `/trips` | My Trips (home) | Yes | Welcome, "Add new trip", and the user's trip plans | US4 |
| `/trips/new` | New Trip | Yes | "Plan a new trip" form | US3 |
| `/trips/:tripId` | Trip Page | Yes | A trip's days and activities, plus Print, Delete, Edit, and the trip assistant | US5–US8 |
| `/trips/:tripId/edit` | Edit Trip | Yes | Change the trip's dates, destination, or Trip Type | US7 |
| `*` | Not Found | No | 404 page with a link back to My Trips | — |

**Route rules**
- A logged-out user who opens a page that needs login is sent to `/login?redirect=<original path>`. After logging in, they go back to that path.
- A logged-in user who opens `/login` or `/signup` is sent to `/trips`.
- A trip that doesn't exist, or that belongs to another user, shows the Not Found page (the API returns 404 in both cases).
- The trip assistant has no route of its own: it opens as a panel on the Trip Page (section 4.8).

## 4. Page Details

### 4.1 Signup
- **Route:** `/signup`
- **Purpose:** Create an account (US1).
- **Layout / sections:** The mountain banner with the logo at the top (section 10.1). Below it, directly on the light brown page (**no white card around the form**): the heading "Create an account", the signup form, and a link: "Already have an account? Log in". The column is centered and at most `max-w-md` wide.
- **Components used:** `AuthLayout`, `SignupForm`
- **Data needed (API calls):** `POST /auth/signup`
- **User interactions:** Fill in name (optional, labelled "Name (optional)"), username, password, and confirm password (in that order), then submit. On success, the user is logged in and taken to `/trips`.
- **Loading / empty / error states:** The submit button is disabled and shows a spinner while the request runs. If the username is taken (409), the error appears under the username field. Other errors appear above the form.

### 4.2 Login
- **Route:** `/login`
- **Purpose:** Log in (US2).
- **Layout / sections:** The same layout as Signup: the mountain banner with the logo, then the heading "Log in" and the form directly on the light brown page, with no white card around it. Below the form, a link: "New here? Create an account".
- **Components used:** `AuthLayout`, `LoginForm`
- **Data needed (API calls):** `POST /auth/login`
- **User interactions:** Fill in username and password, then submit. On success, go to the `redirect` path, or to `/trips` if there is none.
- **Loading / empty / error states:** Submit spinner as on Signup. Wrong credentials (401) show one message above the form: "Invalid username or password."

### 4.3 My Trips (home)
- **Route:** `/trips`
- **Purpose:** The first screen after logging in: see all trips and open one, or start a new one (US4).
- **Layout / sections** (follows the "First screen" sketch):
  1. A welcome heading with the user's first name: **"Surabhi, welcome to PlanMyTrip"**. **Greeting rule:** use the **first name**: the name trimmed, up to its first space ("Surabhi Gupta" → "Surabhi"). If the user has no name (they skipped it at signup, or their account was created before names existed), use the **username** instead ("surabhi, welcome to PlanMyTrip"). The `greetingName` helper in `src/lib/` implements this rule. "PlanMyTrip" is drawn with the same `Wordmark` as the logo ("Plan", handwritten "My", "Trip"), in `primary`, at the heading's size, so the brand looks the same everywhere. A long first name or username wraps naturally.
  2. An **"Add new trip"** button (main button)
  3. A **"Your trip plans"** section listing trip cards. Each card shows the **destination** as its title, the **dates** below it ("Oct 10 – Oct 14, 2026 · 5 days"), and a Trip Type badge. One column on mobile, two to three columns on wider screens.
- **Components used:** `AppLayout`, `TripCard`, `EmptyState`
- **Data needed (API calls):** `GET /trips`
- **User interactions:** Click a card to open the trip. Click "Add new trip" to go to `/trips/new`.
- **Sort order:** Upcoming and current trips first, by start date (soonest first), then past trips (most recent first).
- **Loading / empty / error states:** Skeleton cards while loading. With no trips, the "Your trip plans" section shows "No trips yet. Add your first trip to start planning." On an error, show a message with a Retry button.

### 4.4 New Trip
- **Route:** `/trips/new`
- **Purpose:** Create a trip (US3).
- **Layout / sections** (follows the "New trip screen" sketch): The title **"Plan a new trip"**, then `TripForm` with fields in this order: **From** (start date), **To** (end date), **Destination**, **Trip Type**. The submit button is labelled **"Plan"**. The form is one column, at most about 640px wide.
- **Components used:** `AppLayout`, `TripForm`
- **Data needed (API calls):** `POST /trips`
- **User interactions:** Pick the dates, type the destination, and choose a Trip Type (four buttons: Solo, Couple, Family, Friends). The date pickers don't offer dates before today. The form shows the trip length as you pick dates, e.g. "5 days". Clicking "Plan" creates the trip and opens its page, showing Day 1 through Day N ready for activities. "Cancel" goes back to `/trips`.
- **Loading / empty / error states:** Submit spinner. Validation errors appear under each field (see section 9). Server errors appear above the form.

### 4.5 Trip Page (Day-by-Day Plan)
- **Route:** `/trips/:tripId`
- **Purpose:** Plan activities for each day (US5), print the itinerary (US6), and edit or delete the trip (US7). This one page covers both the "Day 1 … Day N" and the "Saved trip" sketches.
- **Layout / sections** (follows the "Saved trip" sketch):
  1. **Trip header:** the destination as the page title, "From Oct 10 → To Oct 14, 2026 · 5 days" below it, the Trip Type badge, a small **"Edit"** link that opens `/trips/:tripId/edit`, and a **"Plan with assistant"** button that opens the trip assistant (section 4.8). Day cards have no assistant button.
  2. **Day chips:** a strip of chips ("Day 1 · Oct 10", …) that scrolls sideways on mobile. Clicking a chip scrolls to that day.
  3. **Days:** a `DayCard` for each day, from Day 1 to Day N, stacked vertically. Each card lists its activities and has an "+ Add activity" button.
  4. **Action bar** at the bottom: **"Print"** (main button) and **"Delete"** (danger button). On mobile, the bar sticks to the bottom of the screen, so both are always reachable even on a 14-day trip.
- **Components used:** `AppLayout`, `TripHeader`, `DayNav`, `DayCard`, `ActivityItem`, `ActivityForm`, `TripActions`, `ConfirmDialog`, `PrintButton`, `AssistantPanel`
- **Data needed (API calls):** `GET /trips/:tripId` (the trip with its activities), `POST /trips/:tripId/activities`, `PATCH /trips/:tripId/activities/:activityId`, `DELETE /trips/:tripId/activities/:activityId`, `DELETE /trips/:tripId`, and the assistant's calls (section 4.8)
- **User interactions:**
  - **Add:** "+ Add activity" opens an `ActivityForm` inside that day's card (title, optional time, optional notes). Save or Cancel.
  - **Edit an activity:** Clicking an activity's edit icon replaces it with an `ActivityForm` that is already filled in.
  - **Delete an activity:** The delete icon opens a `ConfirmDialog` ("Delete 'Visit the Louvre'?").
  - **Plan with assistant:** opens the trip assistant (section 4.8). Activities added from it appear in their day's card straight away.
  - **Print:** Builds the itinerary PDF in the browser and downloads it (section 7, flow 3). It does not open the browser's print window.
  - **Delete the trip:** Opens a `ConfirmDialog`: "Delete your trip to Paris, France (Oct 10 – Oct 14)? All its activities will be deleted too. This can't be undone." On success, go to `/trips` with a toast.
  - **Sort:** Within a day, activities with a time appear first, in time order. Activities without a time follow, in the order they were created (the `sortActivities` helper).
  - **Days:** The list of days is worked out from the trip's start and end dates (the `getTripDays` helper). The user never creates or deletes days.
  - **Day numbers:** Each activity belongs to a day number (Day 1, Day 2, …), not to a calendar date. If the trip's dates move, the activities move with them; e.g. Day 2's activities follow Day 2 to its new date.
- **Loading / empty / error states:** A skeleton header and cards while loading. A day with no activities shows "No activities planned" in muted text. If saving fails, a toast appears and the form stays open with what the user typed. A trip that isn't found shows the Not Found page.

### 4.6 Edit Trip
- **Route:** `/trips/:tripId/edit`
- **Purpose:** Change a trip's dates, destination, or Trip Type (US7).
- **Layout / sections:** The title "Edit trip", then the same `TripForm` as New Trip, filled in with the trip's details. The submit button is labelled "Save". (Deleting a trip is on the Trip Page, not here.)
- **Components used:** `AppLayout`, `TripForm`, `ConfirmDialog`
- **Data needed (API calls):** `GET /trips/:tripId`, `PATCH /trips/:tripId`
- **User interactions:**
  - **Save:** Before sending, the frontend counts the activities whose day number is greater than the new trip length (the `countActivitiesBeyondDay` helper). For example, going from 5 days to 3 removes Days 4 and 5. Moving the dates without changing the length removes nothing. If there are any, a `ConfirmDialog` shows: "Your new dates remove days that have 3 activities. They will be deleted." with "Delete and save" or "Cancel". Cancel changes nothing. If confirmed, or if no activities are affected, the trip is saved (PATCH) and the user goes back to `/trips/:tripId`. When the user confirmed, the PATCH includes `"confirmDeleteActivities": true`; the backend refuses to delete activities without it. If the backend still answers 409 `ACTIVITIES_WOULD_BE_DELETED` (for example, activities were added in another tab), the dialog is shown again with the count from the server.
  - **Cancel:** goes back to `/trips/:tripId` without saving.
- **Loading / empty / error states:** Same as New Trip. If the trip isn't found, show the Not Found page.

### 4.7 Not Found
- **Route:** `*`
- **Purpose:** Handle unknown or inaccessible URLs.
- **Layout / sections:** The mountain banner, then a "Page not found" message with a link to My Trips.

### 4.8 Trip assistant (panel on the Trip Page)
- **Purpose:** One AI conversation for the whole trip: the user asks in their own words, gets activity and hotel suggestions, and adds activities with one click (US8; [ai-spec.md §3–4](./ai-spec.md#3-user-stories)). The approved design is preview v2 of the assistant panel.
- **Opens from:** the **"Plan with assistant"** button in the trip header.
- **Layout / sections:**
  - **Laptops (`lg`, 1024px and up):** a 440px panel docked on the right, with the day plan still visible on the left. While it's open, the page's content width grows from `max-w-5xl` to `max-w-7xl` so both fit.
  - **Smaller screens:** a bottom sheet over the Trip Page, from just below the banner to the bottom of the screen, with a grab handle. Closing it returns to the plan.
  - **Header:** "Trip assistant", the destination and dates, **Start over**, and close (✕). Start over asks first with a `ConfirmDialog`: "Start over? This deletes the conversation. Activities you added stay."
  - **Quick-start prompts** under the header: "Plan a day", "Where to stay", "Rainy-day ideas", "Fill empty days". Tapping one puts a starter request in the message box; nothing is sent until the user taps Send.
  - **Messages:** the user's on the right (`primary` bubbles, white text), the assistant's on the left (white bubbles with a `line` border), on a `chat-bg` background. The reply appears word by word as it streams. A grey status line shows what the assistant is doing ("Searching Google Places: art museums in Paris").
  - **Activity cards:** time, title, note, address, rating, and a "Google Maps" link. Each card has a **day picker** (preset to the assistant's day; lists Day 1 … Day N with dates) and an **Add to Day N** button that follows the picker.
    - After adding: the button shows "✓ Added to Day N" (green), and the activity appears in that day's card, which is briefly highlighted.
    - **Add all** adds every card in that reply to its picked day.
    - A card whose title already exists on the picked day shows "✓ On Day N" instead of Add, so reopening the conversation doesn't invite duplicates.
    - A card for a day that's no longer in the trip shows "Day no longer in trip".
  - **Hotel cards:** name, area, rating with the number of reviews, price level ("$$ · moderate"), a note, and **Check prices ↗**, which opens Google Maps in a new tab. Hotel cards have no Add button.
  - **Message box:** up to 1,000 characters; Enter sends, Shift+Enter adds a line. While a reply streams, Send becomes **Stop**. Below the box: "Your trip details are sent to our AI provider to plan your trip." and "14 of 20 left today".
- **Components used:** `AssistantPanel`, `QuickPrompts`, `ChatMessageList`, `SuggestionCard`, `HotelCard`, `DayPicker`, `ChatInput`, `ConfirmDialog`
- **Data needed (API calls):** `GET /trips/:tripId/chat` when the panel first opens; `POST /trips/:tripId/chat/messages` (streamed) to send; `DELETE /trips/:tripId/chat` for Start over; `POST /trips/:tripId/activities` for Add (the same call as "+ Add activity").
- **Streaming:** The browser's `EventSource` only supports `GET`, so the app reads the `POST` response with `fetch` and a stream reader and splits it into events (`src/lib/sse.ts`). Stop cancels the request (`AbortController`); the partial reply disappears, and nothing is saved.
- **Loading / empty / error states:**
  - While the conversation loads: three grey placeholder bubbles.
  - An empty conversation shows a greeting written by the frontend from the trip and `greetingName(user)` ("Hi Surabhi! Your Paris trip has 5 days, and Days 2–4 are still open…"), plus the quick-start prompts. No API call is needed for it.
  - An `error` event, or 503 `AI_UNAVAILABLE`: an inline message in the chat, "The assistant isn't available right now. Try again in a moment.", with **Retry**, which resends the same text.
  - 429 `AI_LIMIT_REACHED`: the message box is disabled with "You've used today's 20 assistant messages. They reset at midnight UTC." 429 `AI_CAPACITY_REACHED`: "The assistant is fully booked for today. Please try again tomorrow."
  - 409 `CHAT_FULL`: "This conversation is full. Start over to keep planning.", with a Start over button.
  - If adding a card fails: a toast, and the card's button goes back to Add.

## 5. Component Inventory
| Component | Responsibility | Props | Used In |
|-----------|----------------|-------|---------|
| `AppLayout` | Page frame: `SiteBanner` (with the user's name and Log out on the right) above the content area | `children` | All logged-in pages |
| `AuthLayout` | `SiteBanner`, then a centered column (no card) with the page heading and form | `title`, `children` | Signup, Login |
| `SiteBanner` | The mountain image across the top of every page, with the logo top left and optional content top right (section 10.1) | `children?` (right side) | `AppLayout`, `AuthLayout`, Not Found |
| `Logo` | The PlanMyTrip logo: map-pin mark + `Wordmark`, as inline SVG; links home | `variant` (`onImage` / `onLight`) | `SiteBanner` |
| `Wordmark` | "Plan*My*Trip" with the handwritten "My"; inherits size and color from where it's placed | — | `Logo`, the My Trips welcome heading |
| `ProtectedRoute` | Redirects to `/login` if the user isn't logged in | `children` | Router |
| `PublicOnlyRoute` | Redirects to `/trips` if the user is logged in | `children` | Router |
| `SignupForm` / `LoginForm` | Auth forms with validation and error display | `onSuccess` | Signup, Login |
| `TripForm` | New/edit trip form (From, To, Destination, Trip Type); shows live trip length | `defaultValues?`, `onSubmit`, `submitLabel`, `isSubmitting` | New Trip, Edit Trip |
| `TripTypePicker` | Four-option selector for Trip Type | `value`, `onChange` | `TripForm` |
| `TripCard` | One trip in the list: destination, dates, Trip Type | `trip` | My Trips |
| `TripHeader` | Destination, dates, Trip Type badge, Edit link, and the Plan with assistant button | `trip`, `onOpenAssistant` | Trip Page |
| `DayNav` | Horizontal day chips that scroll to a day | `days` | Trip Page |
| `DayCard` | One day: heading, sorted activities, add button | `day`, `activities`, `tripId` | Trip Page |
| `ActivityItem` | Shows one activity with edit/delete icons | `activity`, `onEdit`, `onDelete` | `DayCard` |
| `ActivityForm` | Inline add/edit form for an activity | `defaultValues?`, `onSubmit`, `onCancel` | `DayCard` |
| `TripActions` | Bottom action bar with Print and Delete (sticky on mobile) | `trip`, `activities`, `onDelete` | Trip Page |
| `ConfirmDialog` | Accessible confirmation dialog (native `<dialog>`) | `open`, `title`, `message`, `confirmLabel`, `onConfirm`, `onCancel`, `destructive?` | Trip Page, Edit Trip |
| `PrintButton` | "Print": lazy-loads the PDF library, builds the PDF, downloads it | `trip`, `activities` | `TripActions` |
| `ItineraryPdf` | The PDF layout (react-pdf document) | `trip`, `days`, `activities` | `PrintButton` |
| `AssistantPanel` | The trip assistant: side panel on `lg` and up, bottom sheet below; header, prompts, messages, input (section 4.8) | `trip`, `activities`, `open`, `onClose` | Trip Page |
| `QuickPrompts` | Starter-request chips that fill the message box | `onPick` | `AssistantPanel` |
| `ChatMessageList` | Messages, the streaming reply, the status line, and cards | `messages`, `streaming`, `trip`, `activities` | `AssistantPanel` |
| `SuggestionCard` | One activity suggestion with `DayPicker` and Add | `item`, `trip`, `activities`, `onAdd` | `ChatMessageList` |
| `HotelCard` | One hotel suggestion with Check prices | `item` | `ChatMessageList` |
| `DayPicker` | A select of Day 1 … Day N with their dates | `days`, `value`, `onChange`, `label` | `SuggestionCard` |
| `ChatInput` | Message box with Send / Stop and the "left today" line | `onSend`, `onStop`, `streaming`, `usage`, `disabledReason?` | `AssistantPanel` |
| `EmptyState` | Message + optional action button | `title`, `message`, `action?` | My Trips |
| `Skeleton` / `Spinner` | Loading placeholders | — | Many |
| `ErrorState` | Error message with Retry | `message`, `onRetry` | Many |

## 6. State Management
- **Global state:** None. The logged-in user comes from the `['me']` query (`GET /auth/me`); `useAuth()` reads it. Nothing else needs to be shared across pages.
- **Server state / caching (TanStack Query):**
  - Query keys: `['me']`, `['trips']`, `['trip', tripId]`, `['chat', tripId]`
  - After creating, editing, or deleting a trip, the app refreshes `['trips']` and `['trip', tripId]`.
  - After adding, editing, or deleting an activity, the app refreshes `['trip', tripId]`. These changes are not shown before the server confirms them, because that's simpler and the API is fast enough.
  - The assistant's conversation and usage are `['chat', tripId]`, loaded when the panel first opens. The reply being streamed lives in the `useAssistantChat` hook's state. On `done`, the user's message and the saved reply are added to the cached conversation, and `usage` is updated; Start over empties it. Adding a card uses the existing activity mutation, so `['trip', tripId]` refreshes and the day card shows the new activity.
  - On logout, the app clears the whole query cache.
- **Local / persisted state:** Form state lives in React Hook Form. The login session is held in a cookie (section 8). The only thing the app stores in the browser is a `pmt-tab-logged-in` marker in **sessionStorage** (section 8), which says "this tab has logged in". Nothing is stored in localStorage.

## 7. User Flows
1. **First-time user**
   1. Opens `/` → redirected to `/login` → clicks "Create an account"
   2. Signs up with name (optional), username, and password → lands on My Trips ("Surabhi, welcome to PlanMyTrip", or "surabhi, welcome to PlanMyTrip" without a name) and sees the empty state
   3. Clicks "Add new trip" → picks From and To dates, enters the destination and Trip Type → clicks "Plan" → lands on the new trip's page with Day 1 … Day N
2. **Planning a day**
   1. On the Trip Page, taps "Day 2" in the day chips → page scrolls to Day 2
   2. Clicks "+ Add activity" → enters a title, time, and notes → Save
   3. The activity appears in Day 2 in the right order
3. **Printing**
   1. On the Trip Page, clicks "Print"
   2. The button shows a spinner while the PDF library loads and the PDF is built
   3. The browser downloads `<Destination>-<start date>-itinerary.pdf`, e.g. `Paris-France-2026-10-10-itinerary.pdf`
4. **Shortening a trip**
   1. Clicks "Edit" → moves the end date two days earlier → Save
   2. Sees the warning with how many activities will be deleted
   3. Confirms → returns to the plan, which now has fewer days. (Or cancels → nothing changes.)
5. **Closing and reopening**
   1. The user closes the tab while adding "Dinner cruise" (the form is filled in but not saved yet)
   2. The app saves "Dinner cruise" in the background as the page closes
   3. Later, the user opens the app again → the app logs out the old session → login page
   4. After logging in, "Dinner cruise" is on the plan
6. **Session expired**
   1. Any API call returns 401
   2. The app clears the cache and sends the user to `/login?redirect=<current path>` with a toast: "Please log in again."
7. **Planning with the assistant**
   1. On the Trip Page, clicks "Plan with assistant" → the panel opens with a greeting and quick-start prompts
   2. Types "On Sunday we want museums in the morning and something relaxed in the evening" → Send
   3. A status line shows the search, then the reply streams in with four cards preset to Day 2 (Sunday)
   4. Changes the cruise card's day to Day 4, then clicks "Add all" → each activity appears in its day's card
   5. Asks "Where should we stay?" → hotel cards with "Check prices" links

## 8. Authentication (Client Side)
- **Login / signup flow:** On success, the backend sets the session cookie and returns the user. The frontend stores that user in the `['me']` query and navigates.
- **Token storage:** The login token is kept in an `httpOnly`, `Secure` (except in local development, which runs on plain `http://localhost`), `SameSite=Lax` cookie set by the backend. Page scripts cannot read it, so it is safe from XSS. The frontend never stores or reads the token; it sends every request with `credentials: 'include'`. *(Matches [backend-spec.md §6](./backend-spec.md#6-authentication--authorization).)*
- **Logged out when the page closes:** Closing the tab or the browser logs the user out; the next visit asks them to log in. Refreshing the page keeps them logged in.
  - After a successful login or signup, the app sets `pmt-tab-logged-in` in **sessionStorage**. sessionStorage belongs to one tab: it survives a refresh, but the browser wipes it when the tab closes.
  - The app can't log out *at* the moment of closing, because browsers fire the same event for closing and for refreshing. Instead, the logout happens on the next visit (see Startup).
  - Opening the app in a new tab also asks for login, because the new tab has no marker.
  - On phones, if the browser closes a tab in the background to save memory, the user is asked to log in again.
- **Startup:** When the app loads, it shows a full-page spinner and then:
  1. **No `pmt-tab-logged-in` marker** (a fresh visit after the page was closed, or a new tab): calls `POST /auth/logout` to end any session left in the browser, then shows the login page.
  2. **Marker present** (a refresh): calls `GET /auth/me`. A 200 means logged in; a 401 means the session ended (e.g. after 12 hours idle), so the marker is removed and the login page is shown.
- **Protected route handling:** `ProtectedRoute` and `PublicOnlyRoute` apply the route rules in section 3.
- **Logout:** `POST /auth/logout`, then the app removes the `pmt-tab-logged-in` marker, clears the query cache, and goes to `/login`.
- **Saving the last edit when the page closes:** see section 12.

## 9. Forms & Validation
Each form's rules are written as a Zod schema in `src/lib/schemas.ts`. The backend enforces the same rules.

| Form | Fields | Validation Rules |
|------|--------|------------------|
| Signup | name, username, password, confirmPassword | name: optional, at most 50 characters, trimmed; any letters, spaces, and punctuation ("Name can be at most 50 characters."); empty is sent as `null`. username: required, 3–30 characters, only letters, numbers, and `_`; case-insensitive ("Surabhi" and "surabhi" are the same account; the backend stores it in lowercase). password: required, 8–72 characters. confirmPassword: must match password |
| Login | username, password | Both required (no other rules, so the form gives no hints about valid usernames) |
| Trip (create/edit) | startDate (From), endDate (To), destination, tripType | destination: required, 1–100 characters, trimmed. startDate, endDate: required, valid dates. startDate ≥ today (the user's local date) when creating; when editing, only if the start date was changed, so a trip that has already started can still be edited. endDate ≥ startDate. Trip length (both dates counted) ≤ 14 days. tripType: one of `solo`, `couple`, `family`, `friends` |
| Activity | title, time, notes | title: required, 1–100 characters, trimmed. time: optional, `HH:mm` (24-hour). notes: optional, ≤ 500 characters |
| Assistant message | text | text: required, 1–1,000 characters after trimming ("Type a message.", "Messages can be at most 1,000 characters."). A character count appears from 900 characters |

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
  | `ok` | `#1E6B45` | "Added" confirmations on assistant cards, the assistant's status dot (dark green) |
  | `ok-soft` | `#E2F1E8` | Background of "✓ Added" buttons; the brief highlight on a day card |
  | `chat-bg` | `#FBF8F3` | Background of the assistant's message area |

  - Main buttons are `primary` with white text. Secondary buttons are white with a `primary` border and text.
  - **Contrast checks (WCAG AA):** `primary` on white 11.5:1, on `sand` 9.8:1; `muted` on white 6.3:1, on `sand` 5.4:1; `field-border` on white 4.1:1 (form borders need at least 3:1); `danger` on white 6.5:1; `ok` on `ok-soft` 5.5:1, on white 6.5:1; `ink` on `chat-bg` 13.8:1. `line` is used only for decoration, never as the only way to see a control.
- **Typography:** Fira Sans (the logo's cursive "My" uses Dancing Script, section 10.1), self-hosted through the `@fontsource/fira-sans` npm package (no request to Google Fonts), in weights 400 (body), 500 (labels, buttons), and 600 (headings). Fallback: `system-ui, sans-serif`. Base text 16px, so mobile browsers don't zoom into form fields. Headings use `text-2xl` and `text-xl` with `font-semibold` in `primary`.
- **Spacing / grid:** Tailwind's spacing scale. Page content is centered at most `max-w-5xl` (`max-w-7xl` while the assistant panel is open on `lg` and up); forms are at most `max-w-xl`. Side padding is 16px on mobile and 24px on desktop.
- **Light / dark mode:** Light only in the MVP. Dark mode is a post-MVP item.
- **Responsive breakpoints:** Built mobile-first with Tailwind's default breakpoints (`sm` 640px, `md` 768px, `lg` 1024px). Every screen must work at 375px wide with no sideways scrolling, except the day chips, which scroll sideways on purpose.
- **Touch targets:** At least 44×44px on mobile.

### 10.1 Mountain banner and logo
Every page starts with the same banner: a mountain photo across the top, with the logo in its top-left corner. Only the top of the page shows the photo; everything below stays on the light brown (`sand`) background.

**Banner (`SiteBanner`)**
- **Pages:** all of them: Login, Signup, My Trips, New Trip, Trip Page, Edit Trip, and Not Found. (Not the PDF, and not the crash fallback page.)
- **Image:** `frontend/src/assets/header-mountains.jpg`: snow-capped Mount Fuji, Japan, with the red Chureito Pagoda on the right, framed by pine branches.
  - **Source and license:** photo by Tomáš Malík on Pexels (https://www.pexels.com/photo/3408354/), under the Pexels License: free to use in apps and websites, no permission needed. Credit isn't required, but the README credits the photographer.
  - **Prepared file:** the 5919×3946 original, cropped to the banner's wide shape (trimming empty sky at the top and the bottom edge) and resized to **1920×973 px**, JPEG, about **234 KB**.
  - Replaces the earlier Seiser Alm photo (Lukas Leitner, Unsplash), chosen from four candidates in the preview. The large originals uploaded for comparison (`option1.jpg`–`option3.jpg`, 3–5 MB each) are deleted when this is implemented; only the prepared file is kept.
- **Size:** full window width, edge to edge. Height: **260px on phones, 340px from `sm` (640px), 420px from `lg` (1024px)** (taller than the first version, at your request). The image fills the banner without stretching (`object-fit: cover`), positioned slightly left of center and a little below middle (`object-position: 45% 60%`), so Mount Fuji stays in view on narrow phones and the pagoda shows beside it on wider screens.
- **Readable text on the photo:** a dark blue gradient across the top of the banner, from `primary` at 55% opacity to fully transparent at about 60% of the banner's height. White text and the logo sit on it with at least 4.5:1 contrast.
- **Top bar inside the banner:** the logo on the left. On logged-in pages, the user's full **name** (e.g. "Surabhi Gupta"), or their **username** if they have no name, and a "Log out" button on the right, in white. (This replaces the white header bar.) On Login, Signup, and Not Found, the right side is empty.
  - **Always one line:** the logo, the name, and "Log out" never wrap onto a second line, at any width down to 375px. Neither the logo nor "Log out" shrinks or wraps (`white-space: nowrap`, no shrinking). If space runs out, only the **name** gives way: it's cut short with "…" (at most about 8rem wide on phones, 16rem from `sm`), and its full text is available as a tooltip and to screen readers.
- **Scrolling:** the banner scrolls away with the page; it doesn't stay pinned. The mobile Print/Delete bar on the Trip Page is unchanged.
- **Page content** starts below the banner, as before (page headings such as "Surabhi, welcome to PlanMyTrip" and "Plan a new trip" stay below it, on the light brown background).

**Logo (`Logo`)**
- **Mark:** a map pin (a place to go) with a two-peak mountain inside it (the trip), echoing the banner photo.
- **Wordmark:** "Plan*My*Trip" next to the mark: "Plan" in Fira Sans weight 500, **"My" in a handwritten (cursive) font, Dancing Script weight 700**, set about 1.3× larger so it reads at the same size as the other letters, and "Trip" in Fira Sans weight 600.
- **Script font:** Dancing Script, self-hosted through the `@fontsource/dancing-script` npm package (like Fira Sans, no request to Google Fonts), loaded in weight 700 only and used **only for "My" in the logo**. Fallback: `cursive`.
- **Two versions:**
  - `onImage` (in the banner): white pin with `primary` mountains inside, white wordmark.
  - `onLight` (for light backgrounds, e.g. the browser tab icon): `primary` pin with white mountains inside, `primary` wordmark.
- **Size:** the map-pin mark is 42px tall on phones and 48px from `sm`; the wordmark is about 1.3rem on phones and 1.45rem from `sm`. The link around the logo is at least 44px tall.
- **Built as** inline SVG in `components/Logo.tsx` (no image file), so it's sharp at every size. The mark alone, `onLight`, also replaces Vite's default browser-tab icon (`frontend/public/favicon.svg`).
- **Link:** goes to `/trips` when logged in, `/login` when not.

## 11. Accessibility
- **Target standard:** WCAG 2.1 AA
- **Keyboard navigation:** Everything works by keyboard. Focus is always visible (`focus-visible` rings). Dialogs keep focus inside while open and give it back afterwards; the native `<dialog>` does this. Escape closes dialogs and inline forms.
- **Screen reader considerations:** Every input has a `<label>`. Field errors are linked with `aria-describedby`. Icon-only buttons have an `aria-label` (e.g. "Edit Visit the Louvre"). Each page has one `<h1>`, and each day uses `<h2>`. Toasts are announced through a live region.
- **Color:** Text contrast is at least 4.5:1. Errors are never shown by color alone. White text on the banner relies on the gradient (section 10.1) for its contrast.
- **Trip assistant:** On smaller screens the sheet is a dialog (`role="dialog"`, labelled "Trip assistant") that keeps focus inside and closes on Escape. On laptops the docked panel is a labelled `<aside>`, and focus moves to the message box when it opens. The message list is a polite live region that announces each finished reply once, not every word. Buttons name their target ("Add Musée d'Orsay to Day 2"), and each day picker is labelled ("Day for Musée d'Orsay"). Links to Google Maps say they open in a new tab.
- **Banner and logo:** The banner photo is decorative: an `<img>` with empty `alt=""`, so screen readers skip it. The logo link's accessible name is "PlanMyTrip, home"; the SVG mark itself is hidden from screen readers. On Login and Signup, the form sits directly on the `sand` background: input borders (`field-border`) still meet the 3:1 minimum against it (3.5:1).

## 12. Error Handling & Notifications
- **API error display:** The API client turns non-2xx responses into an `ApiError` with `status`, `code`, `message`, and `details` (the error format in [api-contract-spec.md](./api-contract-spec.md#2-standard-error-response)).
  - 400: field errors on the form
  - 401 `UNAUTHORIZED`: the session-expired flow (section 7, flow 6), except for `GET /auth/me` at startup, where it just means "logged out"
  - 401 `INVALID_CREDENTIALS`: the login form's "Invalid username or password." message
  - 404: Not Found page
  - 409: shown on the related field (e.g. username taken), or the shortening warning on Edit Trip (`ACTIVITIES_WOULD_BE_DELETED`)
  - The assistant's errors (409 `CHAT_FULL`, 429 `AI_LIMIT_REACHED` / `AI_CAPACITY_REACHED`, 503 `AI_UNAVAILABLE`, and `error` events): shown inside the assistant panel, not as toasts (section 4.8)
  - 503: toast "The service is starting up or unavailable. Please try again in a moment."
  - 5xx or network error: toast "Something went wrong. Please try again."
- **Toasts / banners:** Success toasts for creating, editing, and deleting trips. Error toasts for saves that fail. Saving activities shows no success toast, because the change on screen is confirmation enough.
- **Saving the last edit when the page closes:** Edits are normally saved when the user clicks Save. If a form still has unsaved changes when the page is closed (or refreshed), the app saves them automatically:
  - The app listens for the browser's `pagehide` event. When it fires, every open form with unsaved changes **that passes validation** is sent with `fetch(..., { keepalive: true })`, which lets the request finish after the page is gone. The session is still valid at that moment, because logging out only happens on the next visit.
  - **Covered:** an activity being added (POST) or edited (PATCH), and the Edit Trip form (PATCH), unless saving it would delete activities. That needs the user's confirmation, so it is never sent automatically.
  - **Not covered:** the New Trip form (a half-filled new trip isn't created automatically), and forms that fail validation (e.g. an empty title). Those changes are lost.
  - The `useUnsavedFormRegistry` hook tracks which forms have unsaved changes, so the `pagehide` handler knows what to send.
- **Fallback / error boundary:** Each route has a React Router `errorElement` for unexpected crashes, with a "Reload" button.

## 13. Performance
- **Code splitting / lazy loading:** `@react-pdf/renderer` is loaded with `import()` only when the user clicks Print, keeping it out of the initial bundle. Pages are lazy-loaded per route. The assistant panel's code is lazy-loaded the first time it opens.
- **Image optimization:** The banner photo is the only image. It's imported through Vite (fingerprinted, cached long-term), given its width and height so the page doesn't jump while it loads, and marked `fetchpriority="high"`, since it's the largest thing on screen (it decides LCP). It must stay under 250 KB. Icons and the logo are inline SVG.
- **Targets:** Initial JavaScript ≤ 200 KB gzipped (not counting the PDF library). LCP < 2.5s on simulated 4G.

## 14. Testing Strategy
- **Unit:** `src/lib` helpers: `getTripDays`, `getTripDuration`, `sortActivities`, `countActivitiesBeyondDay`, `greetingName` (first name; username when there's no name; extra spaces), `lib/sse.ts` (events split across chunks, several events in one chunk), and the Zod schemas (especially the start-date, end-date, and 14-day rules).
- **Component:** `TripForm` (validation, live trip length), `DayCard` (sorting, empty day), the Edit Trip warning dialog, and `ProtectedRoute` redirects. API calls are mocked with MSW.
- **Assistant:** `useAssistantChat` and `AssistantPanel`, with MSW returning a scripted event stream. Covers: the reply appears as it streams; Stop removes the partial reply; cards are preset to the right day; the day picker changes the Add target; Add and Add all call the activities API; "✓ On Day N" for titles already on that day; and the limit, full, and unavailable states.
- **End-to-end — future scope (parked):** The Playwright tests are written but commented out in `e2e/planmytrip.spec.ts`, and the `npm run e2e` script is removed, because Chromium's system libraries aren't installed on this machine. To bring them back: run `sudo npx playwright install-deps chromium`, uncomment the file, and restore the script. Until then, the flows below are checked by hand in the browser. What they cover: one test for the whole flow (sign up → add new trip → add activities → Print, and check that a PDF downloads), run at desktop size and at 375px. A second test: refresh keeps the user logged in; closing the page with an unsaved activity, then reopening, asks for login and shows the activity saved.

## 15. Project Structure
```
frontend/                 # vercel.json lives at the repository root (see backend spec)
  index.html
  vite.config.ts          # dev proxy: /api → backend (keeps cookies same-site)
  .env.example            # VITE_API_BASE_URL=/api/v1
  src/
    main.tsx              # React root, QueryClientProvider, Toaster
    styles.css            # Tailwind import, @theme color tokens, Fira Sans
    assets/
      header-mountains.jpg  # the banner photo (section 10.1)
    router.tsx            # routes + ProtectedRoute / PublicOnlyRoute
    api/
      client.ts           # fetch wrapper, ApiError, credentials: 'include',
                          # Content-Type: application/json on every POST/PATCH/DELETE
      auth.ts             # signup, login, logout, me
      trips.ts            # trips + activities calls
      chat.ts             # assistant: history, streamed send, Start over
    hooks/                # useAuth, useTrips, useTrip, useActivityMutations, useAssistantChat
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
      sse.ts              # splits a streamed response into events
    types/
      index.ts            # User, Trip, Activity, TripType, ChatMessage, Suggestions, ChatUsage (match API shapes)
  tests/                  # Vitest setup, MSW handlers
  e2e/                    # Playwright tests (parked, commented out: future scope)
```

## 16. Deployment
The frontend and the FastAPI backend are deployed together as **one Vercel project**, at one address. The full setup, including `vercel.json`, is in [backend-spec.md §14](./backend-spec.md#14-deployment). For the frontend, that means:

- **Build:** With Vercel Services, `frontend/` is built as its own service (Vite: `npm run build`, output `dist`). The backend service builds separately and runs the database migrations (see the backend spec).
- **Automatic deploys:** Every push to `main` deploys to production. Every other branch and pull request gets its own preview URL.
- **API calls:** `vercel.json` sends every `/api/*` request to the FastAPI backend service in the same project. The browser only ever talks to one address, so the session cookie is a same-site cookie, even on the free `*.vercel.app` address. No proxy to another host is needed.
- **SPA fallback:** Inside the frontend service, every address returns `index.html`, so refreshing or opening a link like `/trips/42` works, and React Router shows the right page. Real files such as JavaScript, CSS, and fonts must still be served directly; this is checked during the "hello world" deploy.
- **Environment variables:** `VITE_API_BASE_URL=/api/v1` in every environment.
- **HTTPS:** Vercel serves every address over HTTPS, which the `Secure` session cookie requires.
- **Preview deployments:** Each preview runs its own copy of the backend, connected to its own Neon database branch (see the backend spec), so testing on a preview can't change real data.

## 17. Open Questions
- None right now.

### Resolved
| Question | Decision |
|----------|----------|
| One assistant per day, or one for the whole trip? | **One for the whole trip:** a single "Plan with assistant" button in the trip header. The assistant works out the day, and each card has a day picker (preview v2; [ai-spec.md](./ai-spec.md)) |
| Where does the assistant open? | A **docked side panel** on laptops (`lg` and up), a **bottom sheet** on smaller screens (section 4.8) |
| Banner photo: the 700×350 `mountains.jpg`, or a larger one? | First the Seiser Alm photo (Unsplash); then **Mount Fuji with the Chureito Pagoda by Tomáš Malík (Pexels)**, 1920×973, chosen from four candidates (section 10.1) |
| Banner height? | Taller: 260 / 340 / 420px on phones / tablets / laptops (section 10.1) |
| Name or username in the banner? | **Full name** ("Surabhi Gupta"), or the username if there's no name; shortened with "…" if long (section 10.1) |
| Greet by full name or first name? | **First name** ("Surabhi, welcome…"); by username when there's no name (section 4.3) |
| Should the welcome heading match the logo? | **Yes:** "PlanMyTrip" in the heading uses the logo's `Wordmark`, handwritten "My" included |
| Ask for a name at signup? | **Yes, optional:** up to 50 characters. Without one (or for accounts created before names), the app uses the username (backend-spec §4.1) |
| Login form: inside a white box or not? | **Not:** the form sits directly on the light brown page below the banner (sections 4.1–4.2) |
| Run the Playwright end-to-end tests now? | **No, future scope:** the tests stay in the repo, commented out (section 14) |
| ESLint + Prettier, or oxlint? | **oxlint**, which came with Vite's template (section 2) |
| Are activities tied to a calendar date or a day number? | **Day number.** Moving a trip's dates moves its plan with it; shortening a trip removes the last days (after the warning) |
| Session cookie or Bearer token? | **`httpOnly` session cookie** (section 8). The API contract uses the `session` cookie, with no `Authorization` header |
| Can a trip start in the past? | **No, not in the MVP.** The start date must be today or later; recording past trips is future work (see goal spec) |
| Are usernames case-insensitive? | **Yes.** Stored and compared in lowercase |
