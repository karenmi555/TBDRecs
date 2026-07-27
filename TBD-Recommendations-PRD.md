# TBD Recommendations — Product Requirements Document

## Overview

TBD Recommendations is a private, invite-by-URL group app for a circle of friends to share and browse recommendations across books, movies, TV shows, restaurants, hotels, and anything else worth sharing. It is intentionally simple: no passwords, no likes, no algorithms — just a cozy shared list with comments.

---

## Core Principles

- **Open by URL** — anyone with the link can participate; no account creation or passwords
- **Name-only identity** — users identify by first name only, stored in the browser
- **No voting or ranking** — recommendations stand on their own; comments are the only form of engagement
- **Beautiful and minimal** — blues, purples, and white palette; clean typography; feels like a well-designed notes app

---

## Tech Stack

You are free to choose your own stack, but the following is a reference implementation that works well:

| Layer | Choice |
|---|---|
| Frontend | React + Vite |
| Routing | Wouter (or React Router) |
| Data fetching | TanStack Query |
| Styling | Tailwind CSS + shadcn/ui |
| Icons | Lucide React |
| Backend | Node.js + Express |
| Validation | Zod |
| ORM | Drizzle ORM |
| Database | PostgreSQL |
| Export | `xlsx` (SheetJS) + `docx` |

---

## Database Schema

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | serial | Primary key |
| `name` | text | Unique, not null |
| `createdAt` | timestamp | Default now() |

### `suggestions`
| Column | Type | Notes |
|---|---|---|
| `id` | serial | Primary key |
| `userId` | integer | FK → users.id, cascade delete |
| `category` | text | One of: `book`, `movie`, `tv`, `restaurant`, `hotel`, `other` |
| `title` | text | Not null |
| `description` | text | Not null — the recommendation text / "why you should try it" |
| `city` | text | Nullable — only used for `restaurant` and `hotel` categories |
| `createdAt` | timestamp | Default now() |

### `comments`
| Column | Type | Notes |
|---|---|---|
| `id` | serial | Primary key |
| `suggestionId` | integer | FK → suggestions.id, cascade delete |
| `userId` | integer | FK → users.id, cascade delete |
| `content` | text | Not null |
| `createdAt` | timestamp | Default now() |

**All foreign keys should use `ON DELETE CASCADE`.**

---

## API

All routes are prefixed with `/api`.

### Health

| Method | Path | Response |
|---|---|---|
| GET | `/healthz` | `{ status: "ok" }` |

### Users

| Method | Path | Body | Response |
|---|---|---|---|
| GET | `/users` | — | `User[]` |
| POST | `/users` | `{ name: string }` | `User` (201) — upsert by name (find or create) |
| DELETE | `/users/:id` | — | 204 — deletes user and all their suggestions + comments |

`User` shape:
```json
{ "id": 1, "name": "Sarah", "createdAt": "2024-01-01T00:00:00Z" }
```

### Suggestions

| Method | Path | Query / Body | Response |
|---|---|---|---|
| GET | `/suggestions` | `?category=book` (optional) | `Suggestion[]` |
| POST | `/suggestions` | `{ userId, category, title, description, city? }` | `Suggestion` (201) |
| GET | `/suggestions/:id` | — | `SuggestionDetail` (includes comments array) |
| DELETE | `/suggestions/:id` | — | 204 |

`Suggestion` shape:
```json
{
  "id": 1,
  "userId": 2,
  "userName": "Sarah",
  "category": "book",
  "title": "The Midnight Library",
  "description": "Changed how I think about regret.",
  "city": null,
  "commentCount": 3,
  "createdAt": "2024-01-01T00:00:00Z"
}
```

`SuggestionDetail` extends `Suggestion` with:
```json
{
  "comments": [
    {
      "id": 1,
      "suggestionId": 1,
      "userId": 3,
      "userName": "Emma",
      "content": "On my list!",
      "createdAt": "2024-01-02T00:00:00Z"
    }
  ]
}
```

**Sorting:** When fetching suggestions with `category=restaurant` or `category=hotel`, sort by `city` ASC then `title` ASC. All other categories sort by `createdAt` DESC.

### Comments

| Method | Path | Body | Response |
|---|---|---|---|
| POST | `/comments` | `{ suggestionId, userId, content }` | `Comment` (201) |
| DELETE | `/comments/:id` | — | 204 |

### Summary

| Method | Path | Response |
|---|---|---|
| GET | `/summary` | `{ total, books, movies, tv, restaurants, hotels, others }` |

All values are integer counts of suggestions in that category.

---

## Frontend Pages & Routes

### `/` — Welcome / Login
The first screen every visitor sees.

**Behaviour:**
- If the user has `tbd_userId` and `tbd_userName` in `localStorage`, redirect to `/home` immediately
- Otherwise show two tabs: **"I'm returning"** and **"I'm new"**
  - **Returning:** dropdown of all existing users fetched from `GET /users`, select name → save to localStorage → go to `/home`
  - **New:** text input for a name → call `POST /users` → save returned id + name to localStorage → go to `/home`

**Session hook** (`useSession`):
- Reads `tbd_userId` / `tbd_userName` from localStorage
- Exposes `{ user: { id, name } | null, isLoaded: boolean, logout: () => void }`
- `logout()` clears localStorage and redirects to `/`

---

### `/home` — Category Dashboard
The main hub. Requires a session (redirect to `/` if none).

**UI elements:**
- Sticky header: app logo/name on left; greeting ("Hello, [Name]"), **Export** button, and **Switch user** button on right
- Page heading: "What are we enjoying?"
- Grid of category cards (3 columns on desktop, 1 on mobile): Books, Movies, TV Shows, Restaurants, Hotels, Other
- Each card shows: icon, category title, tagline, recommendation count badge
- Clicking a card navigates to `/category/:category`

**Category cards:**

| Category | Icon | Colour | Tagline |
|---|---|---|---|
| Books | BookOpen | Blue | Stories that kept us turning pages |
| Movies | Film | Purple | Films we couldn't stop thinking about |
| TV Shows | Tv | Indigo | Series we binged in one weekend |
| Restaurants | UtensilsCrossed | Violet | Meals worth traveling for |
| Hotels | BedDouble | Rose | Places we loved waking up in |
| Other | Sparkles | Amber | Everything else worth sharing |

**Export dialog** (triggered by "Export" button):
- Shows total recommendation count
- Two options: **Excel spreadsheet** and **Word document**
- See [Export Feature](#export-feature) section below

---

### `/category/:category` — Category List
Valid values for `:category`: `book`, `movie`, `tv`, `restaurant`, `hotel`, `other`. Redirect to `/home` for anything else.

**UI elements:**
- Sticky header: back link ("← Back to Categories"), category title
- Page hero: category icon + title + recommendation count
- **Add Recommendation** button (opens dialog)
- Controls row (only visible when there are recommendations):
  - **Left:** City filter pills (only for `restaurant` and `hotel`) — "All cities" + one pill per unique city present
  - **Right:** Sort dropdown with icon
- List of recommendation cards
- Empty state (if no recommendations yet)

**Sort dropdown options:**
- Most recent *(default)*
- Title A–Z *(books, movies, tv, other)*  /  Name A–Z *(restaurants, hotels)*
- City A–Z *(restaurants and hotels only)*
- Who shared it

Sorting is client-side on the already-fetched list.

**Add Recommendation dialog fields:**

| Category | Field 1 label | Field 1 placeholder | City field? | CTA |
|---|---|---|---|---|
| Books | Title | e.g., The Midnight Library | No | Add to list |
| Movies | Title | e.g., Past Lives | No | Add to list |
| TV Shows | Title | e.g., The Bear | No | Add to list |
| Restaurants | Restaurant name | e.g., Nobu | Yes (required) | Add to list |
| Hotels | Hotel name | e.g., Hôtel du Cap-Eden-Roc | Yes (required) | Add to list |
| Other | Title | e.g., Spotify playlist, yoga studio… | No | Add to list |

All categories also have a **"Why do you recommend it?"** textarea (placeholder: "Tell us what you loved about it…").

**Recommendation card** shows:
- Title (large, serif font)
- City with pin icon (if present), "Shared by [Name]", date
- First 2 lines of description (clipped)
- Comment count in footer
- Clicking navigates to `/suggestions/:id`

---

### `/suggestions/:id` — Suggestion Detail

**UI elements:**
- Sticky header: back link ("← Back to [Category name]"), category title
- Suggestion title (large, serif)
- Metadata: "Shared by [Name] · [Date]" and city (with pin icon, if applicable)
- Full description text in a card
- **Delete button** — only visible if `user.id === suggestion.userId`; opens a confirmation dialog before deleting (then navigates back to category)
- **Comments section:**
  - List of comments, each showing: user name, date, content, delete button (own comments only — with confirmation)
  - **Add a comment** form at the bottom: textarea + submit button

---

### `/TBDAdmin` — Admin Panel *(secret URL, no password)*

**UI elements:**
- Back link to `/home`
- Two tabs: **Recommendations** and **Members**

**Recommendations tab:**
- Lists every suggestion across all categories
- Each row: category icon, title, city (if applicable), "· recommended by [Name]", date, red delete button
- Delete opens a confirmation dialog; on confirm calls `DELETE /suggestions/:id` and refreshes the list

**Members tab:**
- Lists every user
- Each row: user name, join date, red delete button
- Delete opens a confirmation dialog; on confirm calls `DELETE /users/:id` (which cascades to all their suggestions and comments) and refreshes both lists

---

## Category Behaviour Details

### City-aware categories (Restaurants & Hotels)
- City is a **required** field when adding a recommendation
- City filter pills appear above the list when there are recommendations from 2+ cities
- City is displayed on cards and detail pages with a map-pin icon
- Default sort for these categories from the API is city A–Z then name A–Z (client-side sort overrides this when the user changes the sort dropdown)

### Other
- No city field
- Form label: "Title", placeholder: "e.g., Spotify playlist, yoga studio…"
- Dialog title: "Add a Recommendation" (not "Add an Other")
- Empty state: "Be the first to share something you love."

---

## Export Feature

Accessible via the **Export** button in the home page header. Opens a dialog that fetches all suggestions, then offers:

### Excel (`.xlsx`)
- One worksheet per category that has at least one recommendation, plus a **Summary** sheet
- **Non-city category columns:** Title, Recommended by, Date added, Description
- **City category columns:** Name, City, Recommended by, Date added, Description
- **Summary sheet:** Category name + count, total row
- Column widths: title/name ~30, city ~18, person ~20, date ~16, description ~60
- Filename: `TBD-Recommendations-YYYY-MM-DD.xlsx`

### Word (`.docx`)
- Document title: "TBD Recommendations"
- Subtitle: "Generated on [date]"
- Heading 1 for each category (skips empty categories)
- Each recommendation: bold title, metadata line (city · Shared by [Name] · date) in grey, description paragraph, thin divider
- Filename: `TBD-Recommendations-YYYY-MM-DD.docx`

---

## Design Tokens & Visual Style

- **Palette:** Blues, purples, white backgrounds; muted accent colours per category
- **Typography:** Serif font for headings and titles; sans-serif for body
- **Border radius:** Rounded cards, pill-shaped buttons and badges
- **Header:** Sticky, frosted-glass (`bg-background/80 backdrop-blur`)
- **Cards:** Subtle shadow, lift on hover (`hover:shadow-md`), faint border appears on hover
- **Buttons:** Primary uses brand purple; ghost/outline variants for secondary actions
- **Dialogs:** Centered modal with overlay, cancel + confirm buttons

---

## Authentication & Session

- **No passwords.** Identity is name-only.
- On first visit, user picks or creates a name. `POST /users` with `{ name }` does an upsert (returns existing user if name matches).
- `userId` and `userName` are stored in `localStorage` under keys `tbd_userId` and `tbd_userName`.
- All pages except `/` redirect to `/` if no session is found.
- "Switch user" clears localStorage and returns to `/`.
- The admin page at `/TBDAdmin` does **not** require any special auth — it is protected only by obscurity (secret URL). Do not link to it from anywhere in the app.

---

## Permissions & Deletion Rules

| Action | Who can do it |
|---|---|
| Add a recommendation | Any logged-in user |
| Delete own recommendation | The user who created it (on detail page) |
| Add a comment | Any logged-in user |
| Delete own comment | The user who wrote it (on detail page) |
| Delete any recommendation | Admin only (via `/TBDAdmin`) |
| Delete any user | Admin only (via `/TBDAdmin`) |

---

## Seed Data (Optional)

For development/demo purposes, seed the database with:
- 4–5 users (e.g., Sarah, Emma, Olivia, Maya)
- 2–3 recommendations per category spread across users
- A handful of comments on various suggestions

---

## Self-Hosting Notes

- The app is a standard Node.js + PostgreSQL stack and can be hosted on any VPS, Railway, Render, Fly.io, etc.
- The frontend is a Vite SPA and can be served as static files from the same Express server or a separate CDN
- Required environment variable: `DATABASE_URL` (PostgreSQL connection string)
- Recommended: `SESSION_SECRET` if you add server-side sessions in future
- The backend should serve the built frontend static files in production (`express.static`)
- Set `NODE_ENV=production` in your hosting environment

---

## Out of Scope (Deliberately Not Built)

- Email / push notifications
- Likes, upvotes, or any ranking system
- User avatars or profile photos
- Search across recommendations
- Private recommendations
- Mobile app (responsive web only)
- Rate limiting or abuse prevention (assumed small trusted group)
