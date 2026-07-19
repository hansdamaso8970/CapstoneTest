# PROGRESS.md

This file gives anyone reading it the context needed to work on this project without re-explaining it from scratch.
Always change this file for any further changes, and document it.

## Project

**AssetSENSE** — an IoT-based smart asset management system built for DLSU-D's AAMO (Asset and Materials Office) warehouse. Assets in the warehouse are tagged with Ntag215 NFC tags; an ESP32 fitted with a PN532 NFC module reads a tag when an item is checked in or out, and the reading is logged so staff can see what's in the warehouse, what's on loan, and what's overdue.

Full intended stack: ESP32 + PN532 (hardware reader) → Node.js/Express backend → MongoDB Atlas (data store) → a BYOD (bring-your-own-device) web interface staff and faculty use from any browser.

This phase covers **frontend only**. No backend, no database, no live hardware connection yet — `js/mockData.js` stands in for all of that.

## Current architecture

```
assetsense/
├── PROGRESS.md              ← this file
├── index.html                ← app shell: sidebar nav + 5 views, markup only
├── css/
│   └── style.css             ← full design system (DLSU-D green, Space Grotesk/Inter/IBM Plex Mono, cards, tables, drawer, scan animation, charts)
└── js/
    ├── mockData.js            ← placeholder ASSETS / USERS / ACTIVITY / DEMO_SCAN_TAGS, shaped like the future API responses
    └── app.js                 ← all client logic (see breakdown below)
```

Single-page structure: one `index.html` with five `<section class="view">` blocks (Dashboard, Assets, Scan Tag, Reports, Users & Admin), toggled by `switchView()` in `app.js`. No routing library — this is a class/capstone-scale frontend, not a production SPA, so a simple `data-view` attribute + `classList.toggle` is enough and keeps everything in three files.

## Known gaps / not yet built

Frontend-only by design at this stage:
1. **No backend calls.** `mockData.js` is static; nothing here talks to Express or MongoDB Atlas yet.
2. **No real NFC integration.** The Scan Tag page simulates a read with a dropdown + timeout; the actual ESP32/PN532 event stream isn't wired in.
3. **Check-in/check-out buttons are not functional.** They render correctly but don't mutate `ASSETS` — wiring them to real state (local first, then API) is a Phase 2 task.
4. **Add user / manage user buttons on the Admin page are UI only.**
5. **No auth/login screen yet.** The topbar shows a static avatar; there's no session or role gate, so every visitor currently sees the Admin view and all data.
6. **No responsive testing beyond the CSS breakpoint at 980px** — should get a real pass on a phone-width viewport once content is closer to final.

## Not yet decided

- Whether the backend keeps the current five-view SPA shape or moves to separate pages per role (Admin vs Warehouse Staff vs Faculty Requester) once auth is added.
- Exact MongoDB schema for `assets`, `users`, and `activity` — `mockData.js`'s shapes are a reasonable starting draft but not finalized against the capstone's data model documentation.
- Whether reports need a real charting library once there's live data volume, or whether the hand-built SVG/CSS charts here are enough for the capstone's scope.

## Next steps (planned order)

1. ~~Build the frontend shell: sidebar nav, five views, mock data~~ — **done**.
2. Design MongoDB Atlas schema for `assets`, `users`, `activity` (align with the capstone's data model docs / Chapter 3 write-up).
3. Build the Express backend: REST routes for assets (CRUD + status changes), users, and activity logging.
4. Wire `app.js` to the real API — replace `ASSETS`/`USERS`/`ACTIVITY` reads with `fetch()` calls, keep the render functions themselves mostly unchanged since they already take shaped data.
5. Connect the ESP32 + PN532 reader — define the event payload it pushes on a scan, replace the Scan Tag dropdown simulation with a live listener (WebSocket or short-poll).
6. Add auth (login screen + session) and gate views by role (Admin / Warehouse Staff / Faculty Requester), matching the permission cards already drafted on the Admin page.

## Working conventions

- Keep `css/`, `js/` separated from `index.html` — matches the MultiFile pattern used on other coursework (see Waypoint's PROGRESS.md for the same convention).
- Any new user-facing text inserted via `innerHTML` should stay consistent with the existing chip/badge vocabulary (`STATUS_LABEL`, role badge classes) rather than introducing new ad hoc labels.
- New views should follow the existing pattern: add a `<section class="view" id="view-X">` in `index.html`, a nav button with `data-view="X"`, an entry in `PAGE_META`, and a `renderX()` function called once at init.
- Once the backend lands, `mockData.js` should stay in the repo (renamed or moved to `/dev`) as fixture data for local frontend work without a live database.
