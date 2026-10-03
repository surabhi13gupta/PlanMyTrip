# Goal Spec — PlanMyTrip

> Status: Draft | Owner: Surabhi Gupta | Last updated: 2026-10-04

## 1. Problem Statement
<!-- What problem are we solving, and for whom? -->
Travelers planning a trip typically scatter their day-by-day plans across notes apps, spreadsheets, or chat threads. This makes it hard to keep an itinerary organized, to share it, or to look things up while traveling.

## 2. Vision
<!-- One or two sentences describing the end state. -->
A single place where any traveler can plan a trip day by day and walk away with a clean, printable itinerary.

## 3. Target Users / Personas
Any traveler planning a trip, regardless of who they're traveling with: solo, as a couple, with family, or with a group of friends.

In the MVP, one user plans the trip on their own. Who they travel with is stored as the trip's **Trip Type**, which is a label only and does not change how the app behaves.

## 4. Goals
<!-- Measurable outcomes this product must achieve. -->
- G1: A traveler can keep a whole trip plan in one place instead of across several apps.
- G2: A traveler can organize activities by day, from the first day of the trip to the last.
- G3: A traveler can produce a clean, printable PDF of the itinerary.
- G4: The app is easy to use on both desktop and mobile browsers.

## 5. Non-Goals (Out of Scope)
- Pre-filling the day-by-day plan from dropdown choices
- Suggesting activities based on Trip Type or destination
- Multiple destinations in one trip
- Sharing a trip or editing it together with other users
- Bookings, payments, maps, or weather
- A native mobile app or offline mode
- Email verification or password reset

## 6. Core Features (MVP)
| ID | Feature | Description | Priority |
|----|---------|-------------|----------|
| F1 | Authentication | Sign up with a username and password, log in, and log out | P0 |
| F2 | Create trip | Create a trip with a name, destination, start date, end date, and Trip Type | P0 |
| F3 | My Trips | View a list of the trips you created | P0 |
| F4 | Day-by-day plan | Open a trip and add, edit, or delete activities for each day, Day 1 through Day N (based on the trip's start and end dates) | P0 |
| F5 | Export PDF | Download the trip's itinerary as a PDF | P0 |
| F6 | Edit / delete trip | Change a trip's details, or delete the trip | P1 |
| F7 | Responsive UI | Every screen is usable on desktop and on mobile browsers | P0 |

## 7. User Stories
<!-- Format: As a <persona>, I want <action> so that <benefit>. -->
- **US1:** As a new traveler, I want to sign up with a username and password so that my trips are saved to my own account.
  - Acceptance criteria:
    - [ ] Signup requires a unique username and a password of at least 8 characters
    - [ ] Usernames are case-insensitive ("Surabhi" and "surabhi" are the same account)
    - [ ] If the username is already taken, a clear error is shown
    - [ ] After a successful signup, the user is logged in and taken to My Trips

- **US2:** As a returning traveler, I want to log in and log out so that only I can see my trips.
  - Acceptance criteria:
    - [ ] Wrong credentials show one generic "invalid username or password" error
    - [ ] A logged-out user who opens any trip page is sent to the login page
    - [ ] After logout, the user cannot reach their trips without logging in again

- **US3:** As a traveler, I want to create a trip with a destination, dates, and trip type so that I can start planning it.
  - Acceptance criteria:
    - [ ] Name, destination, start date, end date, and Trip Type are all required
    - [ ] The start date cannot be earlier than today
    - [ ] The end date cannot be earlier than the start date
    - [ ] A trip can be at most 14 days long
    - [ ] Trip Type is one of: Solo, Couple, Family, Friends
    - [ ] After the trip is created, the user lands on its day-by-day plan

- **US4:** As a traveler, I want to see all my trips in one list so that I can quickly open the one I need.
  - Acceptance criteria:
    - [ ] The list shows each trip's name, destination, dates, and Trip Type
    - [ ] Trips are sorted by start date, with upcoming trips first
    - [ ] A user with no trips sees an empty state with a "Create trip" button
    - [ ] A user only ever sees their own trips

- **US5:** As a traveler, I want to plan activities day by day so that I know what I'm doing on each day of the trip.
  - Acceptance criteria:
    - [ ] The plan shows Day 1 through Day N, each with its calendar date
    - [ ] On any day, the user can add, edit, and delete activities
    - [ ] Each activity has a title (required), and an optional time and notes
    - [ ] Activities with a time appear first, in time order; activities without a time follow, in the order they were added
    - [ ] Changes are saved and are still there after a page refresh

- **US6:** As a traveler, I want to export my itinerary as a PDF so that I can print it or keep it on my phone while traveling.
  - Acceptance criteria:
    - [ ] The PDF includes the trip name, destination, dates, and Trip Type, plus every day with its activities
    - [ ] Days with no activities still appear, marked "No activities planned"
    - [ ] The file name includes the trip name (e.g. `Paris-Getaway-itinerary.pdf`)
    - [ ] The PDF is generated in the browser; no server call is needed for the export

- **US7:** As a traveler, I want to edit or delete a trip so that my plans stay accurate.
  - Acceptance criteria:
    - [ ] The user can change a trip's name, destination, dates, and Trip Type
    - [ ] Deleting a trip asks for confirmation and also deletes its activities
    - [ ] Activities belong to a day number, so if the dates move, the plan moves with them (Day 2's activities stay on Day 2)
    - [ ] If the start date is changed, it cannot be earlier than today; a trip that has already started can still be edited if its start date is left alone
    - [ ] If shortening the dates would remove days that have activities, the user sees how many activities will be deleted and must confirm. If they confirm, those activities are deleted. If they cancel, nothing changes.

## 8. Future Enhancements (Post-MVP)
- Email-based signup, email verification, and password reset
- Recording past trips (trips with a start date before today)
- Multiple destinations in one trip
- Sharing a trip, or planning it together with other travelers
- Activity suggestions based on Trip Type or destination
- Maps, weather, and booking links for activities

## 9. Success Metrics
<!-- For this MVP, success means the definition of done is met. -->
| Metric | Target |
|--------|--------|
| Core flow works from start to finish | A new user can sign up → create a trip → add activities → export a PDF with no errors |
| Time to first itinerary | A first-time user gets from signup to a downloaded PDF in under 5 minutes |
| Works on mobile | Every P0 feature works on a 375px-wide mobile screen |
| Data stays private | No user can read or change another user's trips (checked by tests) |
| Deployed | The app runs at a public URL |

## 10. Constraints & Assumptions
- Timeline: 2 weekends
- Team size: 1 person
- Target platform: Web only, built responsively so it also works on mobile browsers (no native mobile app)
- Assumption: Each trip has exactly one destination
- Constraint: A trip lasts at most 14 days (keeps the plan screen and the PDF manageable)
- Assumption: Dates are calendar dates with no time zone; activity times are local times at the destination

## 11. Tech Stack (High Level)
- Frontend: React + TypeScript single-page app, built with Vite and styled with Tailwind CSS. Data from the API is loaded and cached with TanStack Query; forms use React Hook Form + Zod. Font: Fira Sans. Details in [frontend-spec.md](./frontend-spec.md#2-tech-stack).
- Backend: To be decided in [backend-spec.md](./backend-spec.md). It must provide a REST JSON API and log users in with an `httpOnly` session cookie.
- Database: To be decided in [backend-spec.md](./backend-spec.md). It stores users, login sessions, trips, and activities.
- Hosting / Deployment: The frontend is hosted on **Vercel**, deployed automatically from GitHub, with a proxy rule that sends `/api/*` to the backend so the session cookie stays same-site. Details in [frontend-spec.md](./frontend-spec.md#16-deployment). The backend host is to be decided in [backend-spec.md](./backend-spec.md).
- Third-party services (maps, weather, auth, etc.): None in the MVP. PDFs are generated in the browser (`@react-pdf/renderer`), login is built in, and Fira Sans is bundled with the app rather than loaded from Google Fonts.

## 12. Milestones
| Milestone | Scope | Target Date |
|-----------|-------|-------------|
| M1 | | |

## 13. Open Questions
- None right now.

### Resolved
| Question | Decision |
|----------|----------|
| What happens to activities on days removed when a trip's dates are shortened? | Warn the user with how many activities will be deleted; if they confirm, delete them (US7) |
| What is the maximum trip length? | 14 days (US3) |
| Is the PDF generated in the browser or on the server? | In the browser; the backend has no export endpoint (US6) |

## 14. Glossary
| Term | Definition |
|------|------------|
| User / Traveler | A person with an account who plans trips. In the MVP, every trip belongs to exactly one user. |
| Account | A user's login, made of a unique username and a password. |
| Trip | A planned journey to one destination, with a name, a start date, an end date, and a Trip Type. A trip belongs to the user who created it. |
| Destination | The place a trip is to, entered as free text (e.g. "Paris, France"). There is one destination per trip in the MVP. |
| Trip Type | A label for who the user is traveling with: Solo, Couple, Family, or Friends. It is a label only and does not change how the app behaves in the MVP. |
| Trip Duration | The number of days in a trip, counting both the start and end dates (e.g. Oct 10 to Oct 12 is 3 days). The maximum is 14 days. |
| Day (Day N) | One calendar date within a trip. Day 1 is the start date and the last day is the end date. Days are worked out from the trip's dates, not created by the user. |
| Activity | One planned item on a specific day of a trip, such as "Visit the Louvre". It has a title, and optionally a time and notes. It belongs to a day number (e.g. Day 2), not to a calendar date, so it moves with the trip if the dates change. |
| Day-by-Day Plan | The screen for a trip where the user adds and edits activities for each day. |
| Itinerary | The full, ordered view of a trip: its details plus every day and that day's activities. This is what gets exported. |
| PDF Export | Downloading the itinerary as a PDF file, generated in the browser, that can be printed or kept on a phone. |
| My Trips | The screen that lists all of the logged-in user's trips. |
