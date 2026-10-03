# API Contract Spec — PlanMyTrip

> Status: Draft | Owner: Surabhi Gupta | Last updated: 2026-10-04
> Version: v1
> Related: [goal-spec.md](./goal-spec.md), [frontend-spec.md](./frontend-spec.md), [backend-spec.md](./backend-spec.md)

This contract is the **single source of truth** between the frontend and the backend. The frontend (TypeScript + Zod) and the backend (Python + Pydantic) can't share code, so both follow the shapes and rules written here. If the two specs ever disagree with this file, this file wins.

## 1. Conventions
- **Base URL:** `/api/v1`, on the same address as the frontend (e.g. `https://planmytrip.vercel.app/api/v1`; `http://localhost:5173/api/v1` in development, through the Vite proxy).
- **Protocol / format:** REST over HTTPS, JSON request and response bodies (UTF-8).
- **Naming:** camelCase field names (`startDate`, `dayNumber`).
- **Dates:** Calendar dates with no time zone, as `YYYY-MM-DD` strings (e.g. `"2026-10-10"`).
- **Times of day:** 24-hour `HH:mm` strings (e.g. `"09:00"`), local to the destination.
- **Timestamps:** ISO 8601 in UTC with a `Z` (e.g. `"2026-10-04T14:30:00Z"`). Used only for `createdAt` and `updatedAt`.
- **IDs:** UUID strings. An ID that isn't a valid UUID is treated as "not found" (404), not as a validation error.
- **Authentication:** A session cookie named `session`, set by the backend at signup and login. The browser sends it automatically. There is **no** `Authorization` header. Endpoints marked "Auth: Yes" return 401 `UNAUTHORIZED` without a valid session.
- **Requests that change data:** Every `POST`, `PATCH`, and `DELETE` must send the header `Content-Type: application/json`, even when there is no body (this is part of the CSRF protection; see [backend-spec.md §6](./backend-spec.md#6-authentication--authorization)). Otherwise the response is 415 `UNSUPPORTED_MEDIA_TYPE`.
- **Unknown fields:** Request bodies may only contain the fields listed for that endpoint. Any other field is a 400 `VALIDATION_ERROR`.
- **Text input:** Text fields are trimmed of leading and trailing spaces before validation. For optional text fields, an empty string is stored as `null`.
- **Ownership:** A user can only reach their own trips and activities. Another user's trip or activity always returns 404 `NOT_FOUND`, exactly as if it didn't exist.
- **Pagination:** None. A user's trips are returned in one list; with at most a few dozen trips per user, this is fine for the MVP.
- **Sorting:** Trips are returned sorted by `startDate` (earliest first), then `createdAt`. Activities are sorted by `dayNumber`, then those with a `time` by time, then those without a time by `createdAt`.
- **Versioning strategy:** The version is in the URL (`/api/v1`). Adding new optional fields or new endpoints doesn't change the version. Removing or renaming fields, or changing their meaning, would need `/api/v2`.

## 2. Standard Error Response
Every error response has this shape:
```json
{
  "error": {
    "code": "STRING_CODE",
    "message": "Human readable message",
    "details": []
  }
}
```
- `code`: a stable, machine-readable code from the table below. The frontend decides what to do based on `code`, not `message`.
- `message`: a short English sentence, safe to show to the user.
- `details`: always an array, often empty. Its entries depend on the `code`, as shown below.

| HTTP Status | Code | When | `details` entries |
|-------------|------|------|-------------------|
| 400 | `VALIDATION_ERROR` | A request body or field breaks a rule in section 4 | `{ "field": "endDate", "message": "A trip can be at most 14 days long." }`, one per invalid field. `field` is the camelCase field name |
| 401 | `UNAUTHORIZED` | No session cookie, or the session has expired or been logged out | — |
| 401 | `INVALID_CREDENTIALS` | Login with a wrong username or password (the response doesn't say which) | — |
| 404 | `NOT_FOUND` | The trip or activity doesn't exist, isn't a valid ID, or belongs to another user | — |
| 409 | `USERNAME_TAKEN` | Signup with a username that already exists (in any letter case) | `{ "field": "username", "message": "This username is already taken." }` |
| 409 | `ACTIVITIES_WOULD_BE_DELETED` | A trip update would remove days that have activities, and `confirmDeleteActivities` isn't `true` | `{ "activitiesToDelete": 3, "newDurationDays": 3 }` |
| 415 | `UNSUPPORTED_MEDIA_TYPE` | A `POST`, `PATCH`, or `DELETE` without `Content-Type: application/json` | — |
| 429 | `TOO_MANY_ATTEMPTS` | Too many failed logins for one username (section 7) | `{ "retryAfterSeconds": 840 }` |
| 500 | `INTERNAL_ERROR` | An unexpected error on the server | — |
| 503 | `SERVICE_UNAVAILABLE` | The database can't be reached | — |

## 3. Shared Schemas
Fields marked `| null` are always present in responses, with the value `null` when empty.

### User
```json
{
  "id": "3f6c2a9e-8d1b-4e2f-9a7c-5b0d1e2f3a4b",
  "username": "surabhi",
  "createdAt": "2026-10-04T14:30:00Z"
}
```
`username` is always lowercase.

### TripType
One of: `"solo"`, `"couple"`, `"family"`, `"friends"`.

### Trip
```json
{
  "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "destination": "Paris, France",
  "startDate": "2026-10-10",
  "endDate": "2026-10-14",
  "tripType": "couple",
  "durationDays": 5,
  "createdAt": "2026-10-04T14:35:00Z",
  "updatedAt": "2026-10-04T14:35:00Z"
}
```
`durationDays` is calculated by the server: the number of days counting both `startDate` and `endDate`. It is read-only.

### TripDetail
A `Trip` plus all its activities (sorted as described in section 1):
```json
{
  "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
  "destination": "Paris, France",
  "startDate": "2026-10-10",
  "endDate": "2026-10-14",
  "tripType": "couple",
  "durationDays": 5,
  "createdAt": "2026-10-04T14:35:00Z",
  "updatedAt": "2026-10-04T14:35:00Z",
  "activities": [
    {
      "id": "7c8d9e0f-1a2b-4c3d-8e4f-5a6b7c8d9e0f",
      "dayNumber": 2,
      "title": "Visit the Louvre",
      "time": "09:00",
      "notes": "Tickets booked for the 9:00 slot. Start with the Denon wing.",
      "createdAt": "2026-10-04T14:40:00Z",
      "updatedAt": "2026-10-04T14:40:00Z"
    },
    {
      "id": "0e1f2a3b-4c5d-4e6f-9a7b-8c9d0e1f2a3b",
      "dayNumber": 2,
      "title": "Walk along the Seine",
      "time": null,
      "notes": null,
      "createdAt": "2026-10-04T14:42:00Z",
      "updatedAt": "2026-10-04T14:42:00Z"
    }
  ]
}
```

### Activity
```json
{
  "id": "7c8d9e0f-1a2b-4c3d-8e4f-5a6b7c8d9e0f",
  "dayNumber": 2,
  "title": "Visit the Louvre",
  "time": "09:00",
  "notes": "Tickets booked for the 9:00 slot. Start with the Denon wing.",
  "createdAt": "2026-10-04T14:40:00Z",
  "updatedAt": "2026-10-04T14:40:00Z"
}
```
| Field | Type |
|-------|------|
| `dayNumber` | integer, 1 to the trip's `durationDays` |
| `title` | string |
| `time` | `"HH:mm"` string \| null |
| `notes` | string \| null |

## 4. Validation Rules
Both the frontend (Zod) and the backend (Pydantic + services) enforce these rules. Breaking any of them returns 400 `VALIDATION_ERROR` with a `details` entry for the field, except where noted.

| Field | Rule | Example message |
|-------|------|-----------------|
| `username` (signup) | 3–30 characters; only letters, numbers, and `_` (`^[A-Za-z0-9_]{3,30}$`). Stored in lowercase | "Use 3–30 letters, numbers, or underscores." |
| `password` (signup) | 8–72 characters | "Password must be 8–72 characters." |
| `username`, `password` (login) | Required (not empty). No other rules, so login gives no hints | "Enter your username." |
| `destination` | Required; 1–100 characters after trimming | "Enter a destination." |
| `startDate` | Required; a valid date. Must not be before today (see note). On update, only checked if `startDate` changes | "The start date can't be in the past." |
| `endDate` | Required; a valid date; not before `startDate` | "The end date can't be before the start date." |
| trip length | `durationDays` ≤ 14. Reported on `endDate` | "A trip can be at most 14 days long." |
| `tripType` | One of `solo`, `couple`, `family`, `friends` | "Choose a trip type." |
| `dayNumber` | Integer from 1 to the trip's `durationDays` | "Choose a day within the trip." |
| `title` | Required; 1–100 characters after trimming | "Enter a title." |
| `time` | Optional; `HH:mm`, 24-hour (`^([01][0-9]\|2[0-3]):[0-5][0-9]$`), or `null` | "Use a time like 09:30." |
| `notes` | Optional; at most 500 characters, or `null` | "Notes can be at most 500 characters." |

**Note on "today":** The frontend checks against the user's local date. The server doesn't know the user's time zone, so it accepts any `startDate` ≥ (today in UTC − 1 day). This avoids rejecting valid trips for users ahead of or behind UTC.

Other errors that aren't field validation: `USERNAME_TAKEN` (409), `INVALID_CREDENTIALS` (401), `ACTIVITIES_WOULD_BE_DELETED` (409), `TOO_MANY_ATTEMPTS` (429).

## 5. Endpoint Summary
| Method | Path | Auth | Description | Story |
|--------|------|------|-------------|-------|
| POST | `/auth/signup` | No | Create an account and log in | US1 |
| POST | `/auth/login` | No | Log in | US2 |
| POST | `/auth/logout` | No | Log out (works even if already logged out) | US2 |
| GET | `/auth/me` | Yes | Get the logged-in user | US2 |
| GET | `/trips` | Yes | List the user's trips | US4 |
| POST | `/trips` | Yes | Create a trip | US3 |
| GET | `/trips/{tripId}` | Yes | Get a trip with all its activities | US5, US6 |
| PATCH | `/trips/{tripId}` | Yes | Change a trip's destination, dates, or Trip Type | US7 |
| DELETE | `/trips/{tripId}` | Yes | Delete a trip and its activities | US7 |
| POST | `/trips/{tripId}/activities` | Yes | Add an activity to a day | US5 |
| PATCH | `/trips/{tripId}/activities/{activityId}` | Yes | Change an activity's title, time, or notes | US5 |
| DELETE | `/trips/{tripId}/activities/{activityId}` | Yes | Delete an activity | US5 |
| GET | `/health` | No | Check that the API and database are up | — |

All paths are relative to `/api/v1`. There is no PDF endpoint: the PDF is built in the browser from `GET /trips/{tripId}`.

## 6. Endpoint Details

### 6.1 `POST /auth/signup`
- **Description:** Creates an account, logs the user in, and sets the session cookie.
- **Auth required:** No

**Request body**
```json
{
  "username": "Surabhi",
  "password": "correct-horse-42"
}
```
(The frontend's "confirm password" field is checked in the browser only and is not sent.)

**Success response** — `201 Created`
```json
{
  "user": { "id": "3f6c2a9e-8d1b-4e2f-9a7c-5b0d1e2f3a4b", "username": "surabhi", "createdAt": "2026-10-04T14:30:00Z" }
}
```
Header: `Set-Cookie: session=<token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800` (`Secure` is left out in local development.)

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Username or password breaks the rules |
| 409 | `USERNAME_TAKEN` | The username exists, in any letter case |

### 6.2 `POST /auth/login`
- **Description:** Checks the username (in any letter case) and password, then sets the session cookie.
- **Auth required:** No

**Request body**
```json
{
  "username": "surabhi",
  "password": "correct-horse-42"
}
```

**Success response** — `200 OK`
```json
{
  "user": { "id": "3f6c2a9e-8d1b-4e2f-9a7c-5b0d1e2f3a4b", "username": "surabhi", "createdAt": "2026-10-04T14:30:00Z" }
}
```
Header: `Set-Cookie: session=<token>; ...` (same as signup)

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Username or password is empty |
| 401 | `INVALID_CREDENTIALS` | Wrong username or password |
| 429 | `TOO_MANY_ATTEMPTS` | 10 failed logins for this username in the last 15 minutes |

### 6.3 `POST /auth/logout`
- **Description:** Ends the session and clears the cookie. Succeeds even if there is no session, so the frontend can always call it.
- **Auth required:** No
- **Request body:** None (still send `Content-Type: application/json`)

**Success response** — `204 No Content`
Header: `Set-Cookie: session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`

### 6.4 `GET /auth/me`
- **Description:** Returns the logged-in user. The frontend calls this on startup to know whether the user is logged in.
- **Auth required:** Yes

**Success response** — `200 OK`
```json
{
  "user": { "id": "3f6c2a9e-8d1b-4e2f-9a7c-5b0d1e2f3a4b", "username": "surabhi", "createdAt": "2026-10-04T14:30:00Z" }
}
```

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHORIZED` | Not logged in, or the session expired |

### 6.5 `GET /trips`
- **Description:** Lists all of the user's trips, without their activities, sorted by `startDate`, then `createdAt`. The frontend groups them into upcoming and past.
- **Auth required:** Yes

**Success response** — `200 OK`
```json
{
  "trips": [
    {
      "id": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
      "destination": "Paris, France",
      "startDate": "2026-10-10",
      "endDate": "2026-10-14",
      "tripType": "couple",
      "durationDays": 5,
      "createdAt": "2026-10-04T14:35:00Z",
      "updatedAt": "2026-10-04T14:35:00Z"
    }
  ]
}
```
A user with no trips gets `{ "trips": [] }`.

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHORIZED` | Not logged in |

### 6.6 `POST /trips`
- **Description:** Creates a trip with no activities.
- **Auth required:** Yes

**Request body**
```json
{
  "destination": "Paris, France",
  "startDate": "2026-10-10",
  "endDate": "2026-10-14",
  "tripType": "couple"
}
```
All four fields are required.

**Success response** — `201 Created`
A `TripDetail` with `"activities": []`.

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | Any field breaks the rules (start date in the past, end before start, more than 14 days, unknown trip type, …) |
| 401 | `UNAUTHORIZED` | Not logged in |

### 6.7 `GET /trips/{tripId}`
- **Description:** Returns a trip with all its activities. Used by the Trip Page, the Edit Trip page, and for building the PDF.
- **Auth required:** Yes
- **Path params:** `tripId` (UUID)

**Success response** — `200 OK`
A `TripDetail` (see section 3).

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHORIZED` | Not logged in |
| 404 | `NOT_FOUND` | No such trip, or it belongs to another user |

### 6.8 `PATCH /trips/{tripId}`
- **Description:** Changes any of the trip's destination, dates, or Trip Type. Only the fields sent are changed. The date rules are checked on the combination of new and existing values (e.g. sending only `endDate` is checked against the existing `startDate`).
- **Auth required:** Yes
- **Path params:** `tripId` (UUID)

**Request body** (all fields optional, at least one of the first four required)
```json
{
  "startDate": "2026-10-10",
  "endDate": "2026-10-12",
  "destination": "Paris, France",
  "tripType": "couple",
  "confirmDeleteActivities": true
}
```
- `confirmDeleteActivities` (boolean, default `false`): must be `true` when the change makes the trip shorter and there are activities on the days that would be removed (`dayNumber` > new `durationDays`). Those activities are then deleted in the same transaction as the update.
- Moving the dates without changing the length never deletes anything: activities keep their `dayNumber`.
- `startDate` is only checked against "today" if it changes, so a trip that has already started can still be edited.

**Success response** — `200 OK`
The updated `TripDetail`, without any deleted activities.

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | A field breaks the rules, or the body has none of the four trip fields |
| 401 | `UNAUTHORIZED` | Not logged in |
| 404 | `NOT_FOUND` | No such trip, or it belongs to another user |
| 409 | `ACTIVITIES_WOULD_BE_DELETED` | The trip would get shorter, activities exist on the removed days, and `confirmDeleteActivities` isn't `true`. Nothing is changed. `details`: `[{ "activitiesToDelete": 3, "newDurationDays": 3 }]` |

### 6.9 `DELETE /trips/{tripId}`
- **Description:** Deletes the trip and all its activities.
- **Auth required:** Yes
- **Path params:** `tripId` (UUID)
- **Request body:** None (still send `Content-Type: application/json`)

**Success response** — `204 No Content`

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHORIZED` | Not logged in |
| 404 | `NOT_FOUND` | No such trip, or it belongs to another user |

### 6.10 `POST /trips/{tripId}/activities`
- **Description:** Adds an activity to one day of the trip.
- **Auth required:** Yes
- **Path params:** `tripId` (UUID)

**Request body**
```json
{
  "dayNumber": 2,
  "title": "Visit the Louvre",
  "time": "09:00",
  "notes": "Tickets booked for the 9:00 slot."
}
```
`dayNumber` and `title` are required. `time` and `notes` are optional (leave them out or send `null`).

**Success response** — `201 Created`
The new `Activity`.

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | A field breaks the rules, including a `dayNumber` outside the trip |
| 401 | `UNAUTHORIZED` | Not logged in |
| 404 | `NOT_FOUND` | No such trip, or it belongs to another user |

### 6.11 `PATCH /trips/{tripId}/activities/{activityId}`
- **Description:** Changes an activity's title, time, or notes. Only the fields sent are changed. Send `null` to clear `time` or `notes`. An activity can't be moved to another day: `dayNumber` is not accepted here (sending it is a 400).
- **Auth required:** Yes
- **Path params:** `tripId` (UUID), `activityId` (UUID)

**Request body** (all optional, at least one required)
```json
{
  "title": "Visit the Louvre and Tuileries",
  "time": "10:00",
  "notes": null
}
```

**Success response** — `200 OK`
The updated `Activity`.

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 400 | `VALIDATION_ERROR` | A field breaks the rules, the body is empty, or it contains `dayNumber` |
| 401 | `UNAUTHORIZED` | Not logged in |
| 404 | `NOT_FOUND` | No such trip or activity, the activity isn't in this trip, or the trip belongs to another user |

### 6.12 `DELETE /trips/{tripId}/activities/{activityId}`
- **Description:** Deletes one activity.
- **Auth required:** Yes
- **Path params:** `tripId` (UUID), `activityId` (UUID)
- **Request body:** None (still send `Content-Type: application/json`)

**Success response** — `204 No Content`

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 401 | `UNAUTHORIZED` | Not logged in |
| 404 | `NOT_FOUND` | No such trip or activity, the activity isn't in this trip, or the trip belongs to another user |

### 6.13 `GET /health`
- **Description:** Confirms the API is running and can reach the database. Used to check deployments.
- **Auth required:** No

**Success response** — `200 OK`
```json
{ "status": "ok" }
```

**Error responses**
| Status | Code | Condition |
|--------|------|-----------|
| 503 | `SERVICE_UNAVAILABLE` | The database can't be reached |

## 7. Sessions & Rate Limits
- **Session lifetime:** 7 days. While the user stays active, the session is renewed: when a request arrives and less than 6 days remain, the server extends the session to 7 days from now **and re-sends the `Set-Cookie` header** with a fresh `Max-Age`, so the browser keeps the cookie too. This happens at most once a day.
- **Login rate limit:** After 10 failed logins for the same username within 15 minutes, `POST /auth/login` for that username returns 429 `TOO_MANY_ATTEMPTS` until the oldest failure is more than 15 minutes old. The response includes a `Retry-After` header (seconds) and `retryAfterSeconds` in `details`.
- **Other endpoints:** No limits in the MVP beyond Vercel's built-in protection.

## 8. Open Questions
- None right now.

### Resolved
| Question | Decision |
|----------|----------|
| How does the API know who is logged in? | `session` cookie (`HttpOnly`, `SameSite=Lax`); no `Authorization` header |
| Can an activity be moved to another day? | Not in the MVP. `dayNumber` is set when the activity is created and can't be changed; to move one, delete it and add it again on the other day |
| In what order are trips returned? | By `startDate` (earliest first), then `createdAt`. The frontend groups them into upcoming and past |
| Do trips have a name? | No. A trip is identified by its destination and dates (from the mockups) |

## 9. Changelog
| Date | Version | Change |
|------|---------|--------|
| 2026-10-04 | v1 | Initial contract: auth, trips, activities, health |
