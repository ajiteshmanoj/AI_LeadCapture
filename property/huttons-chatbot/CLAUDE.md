# Claude — project guide

This file is auto-loaded by Claude Code in every session. Treat it as standing
instructions for working in this repo.

## What this is

AI property concierge chatbot for **Huttons Asia** — Singapore's largest private
real estate agency (5,300+ agents). This is a vertical adaptation of the
tuition-chatbot codebase. The schema reuses the same tables but with
property-specific column extensions (migration 011) and seed data (migration 012).

## CRITICAL — Table Mapping (Property Vertical)

| Logical concept | Table used | Key columns |
|-----------------|-----------|-------------|
| Listing/viewing slot | `classes` | `subject` = property title, `level` = budget range, `teacher_name` = agent name, `property_type`, `tenure`, `asking_price`, `psf`, `floor_area_sqft`, `district` |
| Full listing detail | `property_listings` | Separate table (migration 011) with full property spec |
| Lead | `students` | Same table, with `lead_score`, `citizenship_status`, `budget_min/max`, `preferred_property_type`, `assigned_agent` |
| Viewing booking | `bookings` | `booking_type = 'viewing'` (not 'trial'), `agent_name`, `lead_qualified`, `follow_up_date` |
| Pipeline | `bookings` (filter) | `booking_type = 'viewing'` AND `status IN ('confirmed','pending')` — the waitlist table is NOT used for property |
| Office/branch | `locations` | Same table — renamed from "Centre" in UI |

**Waitlist table**: NOT used in the property vertical. What was "Waitlist" is now
"Pipeline" in the nav — tracked via `bookings` filtered by status. The
`/dashboard/waitlist` page renders the Pipeline view.

## ABSD Rule — Always Ask Citizenship First

Before quoting any residential property price, ALWAYS ask for citizenship status.
ABSD rates: SC = 0% (first property), PR = 5% (first property), Foreigner = 60%.
Factor ABSD into total cost when discussing budget with leads.

## HDB Eligibility Rule

HDB flats (BTO and resale) can ONLY be purchased by Singapore Citizens and PRs
(with restrictions). Foreigners CANNOT buy HDB. Always check citizenship status
before discussing HDB listings.

## Session log — KEEP IT UPDATED

`SESSIONS.md` at the repo root is a running log of what changed and why.

**At the end of every working session (or when the user says "save", "commit",
or "wrap up"), append a new dated entry to the top of `SESSIONS.md`.** Format:

```
## YYYY-MM-DD — short headline

- Bullet of what changed and why (not how — code already shows how).
- Note any commits made (`<short-sha>`).
- Flag anything left half-done, blocked, or worth picking up next session.
```

Rules:
- Newest entries at the **top**, under the `# Session Log` header.
- One entry per working day. If the same day has multiple distinct sessions,
  add sub-bullets rather than a second entry.
- Keep it tight — bullets, not prose. ~5-10 bullets per session is plenty.
- Don't repeat what's obvious from `git log`. Capture *intent* and
  *non-obvious decisions* (e.g. why a threshold was lowered, why we picked
  one library over another).
- Do not log secrets, env values, or sensitive data.

## Conventions in this repo

- **TypeScript strict.** No `any`. Server-side files use `nodejs` runtime.
- **Multi-tenant by `org_id`.** Tenant tables: `documents`, `document_chunks`,
  `classes`, `locations`, `students`, `bookings`, `waitlist`, `payments`,
  `conversations`, `faqs`. `messages` is scoped via parent `conversation_id`
  (no `org_id` column). RLS uses `is_org_member()`. Chat traffic uses the
  service-role key.
- **OpenAI only.** `gpt-4o` for chat, `text-embedding-3-small` for embeddings.
  Do NOT swap to Anthropic — the spec is OpenAI-based.
- **Widget is vanilla TS + Shadow DOM.** Build with esbuild (`build:widget`).
  Never import React or app code into `widget/`.
- **Migrations are append-only.** Add `00X_*.sql` files; never edit applied
  migrations.

## Stack pins (don't bump without a reason)

- Next.js `^14.2.33` — Next 15 needs different config; not yet ready.
- ESLint `^8.57.1` — Next 14 doesn't support ESLint 9.
- `next.config.mjs` (not `.ts`) — Next 14 doesn't accept TS configs.

## Where things live

- Chat engine: `src/lib/chat/{engine,prompts,rag,intents,actions}.ts`
- API routes: `src/app/api/{chat,documents,...}/route.ts`
- Dashboard: `src/app/dashboard/**`
- Widget: `widget/src/**` → build → `public/widget.js`
- Schema: `supabase/migrations/`
- Test page: `public/test.html`
- Test harness: `test-chat.sh`

## What's built today

A snapshot of capabilities so a fresh session can orient quickly. For *why*
decisions were made, see `SESSIONS.md`.

### Customer-facing chat
- Embeddable widget (vanilla TS, Shadow DOM, mobile-responsive) — drop one
  `<script>` tag onto any centre's site. Reset (↻) button starts a fresh
  conversation.
- Chat engine (`src/lib/chat/`):
  - RAG retrieval over `document_chunks` (pgvector, threshold 0.3, k=8).
  - Per-org system prompt — human Singaporean front-desk tone, varied
    openings, no per-message emoji, strict topic-scope guard (off-topic
    questions are politely redirected).
  - Live data injected into prompt every turn: org info, list of centres
    (locations), active classes (with seat counts + linked centre), matched
    FAQs, top RAG chunks.
  - Intent classifier + heuristic FAQ matcher.
  - PDPA opt-out: parent typing "STOP" closes the conversation.
- Conversations + messages persisted to Postgres (channel-aware for
  web/whatsapp/telegram).

### Trial bookings + waitlist (Phase 2)
- Per-org Google Calendar OAuth (`/api/auth/google/{start,callback}`),
  refresh token + chosen calendar id stored on `organisations`.
- Booking flow: bot extracts subject/level/centre/child/parent/phone/email
  from the conversation, proposes 1–2 specific class options, confirms
  before locking. On confirmation:
  1. Creates a Google Calendar event on the centre's connected calendar
     (timezone Asia/Singapore, email + popup reminders).
  2. Adds the parent as an attendee with `sendUpdates:"all"` — Google emails
     them a one-tap calendar invite.
  3. Writes the booking row with `class_id`, `location_id`,
     `google_calendar_event_id`.
  4. The system (not the LLM) appends a deterministic
     "calendar invite sent to X" line to the bot reply.
- Calendar failure is non-blocking — booking still saves.
- Waitlist path: when a class is `current_enrollment >= max_capacity`, the
  bot offers `[ADD_TO_WAITLIST]` instead and tells the parent their position.

### Multi-branch (locations)
- `locations` table per org (name, address, postal_code, mrt_nearest, phone).
- `classes.location_id` and `bookings.location_id` FKs.
- Chat engine asks for preferred centre when ambiguous and uses the linked
  centre's address as the calendar event venue.

### Admin dashboard (`/dashboard/*`)
- **Overview** — high-level stats.
- **Conversations** — list + viewer (full transcript).
- **Bookings** — date-sorted list, status filter, centre filter, inline
  status dropdown (cancelling deletes the calendar event), "synced" badge
  when an event exists.
- **Waitlist** — per-class groups, "open a slot & notify" action, mark
  notified entries as enrolled or expired.
- **Classes** — CRUD with centre picker, active/inactive toggle.
- **Centres** (`/dashboard/locations`) — CRUD for branches.
- **Documents** — PDF/TXT/CSV upload → server-side chunk + embed; per-row
  delete button.
- **FAQs** — curated Q&A editor (sort order, active toggle).
- **Settings** — bot name/welcome message/colour, contact person, Google
  Calendar connect/disconnect with calendar picker.
- **Bookings status** + **Analytics** + **Payments** pages exist; analytics
  + payments are stubs.

### Multi-tenant infra
- One Supabase project, one Next.js app. Every business table scoped by
  `org_id`; RLS via `is_org_member()`. Service-role key bypasses RLS for
  anonymous chat traffic from web/whatsapp/telegram.
- Dashboard auth via Supabase Auth + `org_members` membership.

### Integrations wired
- OpenAI: `gpt-4o` (chat, temp 0.7) + `text-embedding-3-small`.
- Supabase: Postgres, pgvector, Auth, RLS.
- Google Calendar: per-org OAuth, event create/delete, attendee invites.
- Telegram: per-org bot, inbound webhook with secret validation, channel
  abstraction (`src/lib/chat/channels.ts`) so the same `handleChat` powers
  web + telegram (and whatsapp once wired).

### Stubbed (directories exist, routes empty)
- Twilio WhatsApp inbound webhook (channel branch routable but not impl'd).
- Stripe webhook + payments routes.
- Cron reminders.

### Test data
- Seeded org: **Zenith Education Studio** (`org_id=...0002`) with 5 PDFs
  uploaded, KB indexed, 3 test classes (P5 Math @ Tampines Hub, Sec 3 A-Math
  @ Bishan Junction 8 (full → waitlist test), JC1 H2 Math @ Jurong East JEM).

## Phase status (high-level)

The build plan was restructured from the original 4-phase spec into an
**11-phase plan** (locked 2026-05-07). See `FEATURE_ROADMAP.md` for the full
phase table, sprint estimates, and per-feature specs.

| # | Phase | Status |
|---|-------|--------|
| 1 | MVP (chat + RAG + widget + dashboard) | ✅ |
| 2 | Booking + Google Calendar + Waitlist + Locations | ✅ |
| 3 | Messaging (WhatsApp + Telegram + unified inbox) | 🟡 Telegram done; WhatsApp + unified inbox pending |
| 4 | Lead Nurture (post-trial follow-ups + cron infra) | pending |
| 5 | Payments (PayNow QR + Stripe) | pending |
| 6 | Reminders (monthly fee + lesson) | pending |
| 7 | Class management (makeup booking + progress routing) | pending |
| 8 | Announcement broadcasts | pending |
| 9 | Lifecycle (re-enrolment + exam-season outreach) | pending |
| 10 | Growth (referrals + NPS pulse) | pending |
| 11 | Analytics (funnel + lifecycle metrics) | pending |

Two non-obvious calls in this ordering:
- **Lead Nurture (Phase 4) is before Payments** — highest revenue-impact per
  week of dev, and it builds the cron infrastructure Phases 5–10 all reuse.
- **Analytics is Phase 11 (last)** — depends on volume + final schema; building
  it earlier guarantees a rewrite.

When the user signs off a phase, log it in `SESSIONS.md`, flip ✅ here, and
update the "What's built today" section above.
