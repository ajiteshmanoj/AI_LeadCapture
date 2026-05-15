# Session Log

A running log of work sessions on the tuition chatbot. Newest at the top.
Each session: short bullet list of what changed and why.

---

## 2026-05-15 — Phase 3 complete + Phase 4 (Lead Nurture + Payment Reminders)

- **WhatsApp integration** (Phase 3 completion): Twilio WhatsApp Business API wired end-to-end. Migration `011` adds `twilio_account_sid / twilio_auth_token / twilio_whatsapp_from` to `organisations`. `src/lib/integrations/whatsapp.ts` wraps the Twilio SDK. Webhook at `/api/webhooks/whatsapp/[orgSlug]` validates Twilio signature, runs chat engine via `waitUntil`. Connect/disconnect APIs at `/api/integrations/whatsapp/`. `WhatsAppConnection` component in settings mirrors the Telegram pattern.
- **`channels.ts`** now routes WhatsApp through the Twilio REST API alongside Telegram. Web remains a no-op (HTTP response).
- **Conversations page** got a channel filter bar (All | Website | WhatsApp | Telegram) via search params — server component, no client state added.
- **Lead Nurture sequences** (Phase 4): `lead_nurture` table (migration `011`). Vercel Cron at `/api/cron/lead-nurture` runs hourly; sends T+24h / T+3d / T+7d follow-up messages via the original channel. When a trial booking is marked `completed` via `/api/bookings` PATCH, a nurture entry is inserted automatically. Dashboard page `/dashboard/lead-nurture` shows pipeline (active/enrolled/closed) with step progress bars.
- **Payment Reminders** (Phase 4): `payment_reminders` table (migration `011`). Cron at `/api/cron/payment-reminders` runs daily 09:00 SGT; sends Day 1 / Day 5 reminders with PayNow details; escalates to admin Telegram on Day 10.
- **`vercel.json`** created with cron schedules (lead-nurture every hour, payment-reminders daily 1am UTC = 9am SGT).
- **Sidebar** adds Lead Nurture nav item.
- Both builds pass (Next.js type-check + widget esbuild). No `any` introduced.

## 2026-05-08 — Phase 3 (part 2): admin Telegram notifications

- Migration `007_admin_notifications.sql` adds `admin_telegram_chat_id` +
  `admin_link_code` + `admin_link_code_expires_at` to `organisations`.
- `src/lib/notifications/admin.ts` — `notifyAdmin(orgId, text)` plus
  `formatBookingNotification` / `formatWaitlistNotification`. Soft-fails on
  every error; a notification problem never blocks the booking flow.
- Telegram webhook intercepts `/linkadmin <code>` before the chat engine
  sees it; validates code + 10-min expiry; captures sender's chat_id.
- Booking + waitlist executors fire-and-forget admin pings after success.
- New "Admin notifications" card on Settings: 6-digit code, copy button for
  the exact `/linkadmin <code>` command, gated on bot-connected, shows
  linked status with unlink.
- Verified end-to-end: booking via test widget → Google Calendar event +
  parent invite → Telegram admin ping.

## 2026-05-08 — Phase 3 (part 1): Telegram channel live

- Locked the integrated 11-phase plan in `FEATURE_ROADMAP.md` + `CLAUDE.md`;
  deleted the original `claude_code_prompt_tuition_chatbot.md` spec — it was
  fully superseded.
- Built the channel-abstraction foundation that all of Phase 3+ rides on:
  `src/lib/chat/channels.ts` exposes `sendChannelReply(orgId, channel, …)`.
  Web is a no-op (caller handles HTTP response); Telegram dispatches via
  `src/lib/integrations/telegram.ts`; WhatsApp branch is stubbed but routable.
- Telegram pieces:
  - Migration `006_telegram_webhook_secret.sql` — adds per-org secret column.
  - Bot API wrapper: `getMe`, `sendMessage` (with Markdown→plaintext retry on
    parse errors), `setWebhook`, `deleteWebhook`.
  - Inbound webhook at `/api/webhooks/telegram/[orgSlug]` — secret-token
    validation, runs `handleChat`, replies via `sendChannelReply`. Always
    returns 200 OK so Telegram doesn't retry-loop on transient errors.
  - Admin connect/disconnect endpoints under `/api/integrations/telegram/*`.
    Connect validates token via `getMe`, mints a 24-byte secret, calls
    `setWebhook` against `${NEXT_PUBLIC_APP_URL}/...`, persists token + secret.
  - New "Telegram" card on `/dashboard/settings` with BotFather instructions
    inline + ngrok hint for local dev.
- Per-org bot model (one BotFather token per `organisations` row) — clean
  multi-tenancy from day one.
- Verified end-to-end: bot answered a "got P5 Math classes?" query via the
  same RAG/booking flow the widget uses.
- Deferred: WhatsApp (Twilio + Meta verification), unified inbox + Realtime.
  Decision driven by SG market reality — Telegram is dev-friendly but
  parents are on WhatsApp, so WhatsApp is the channel that actually sells.
  Channel abstraction is built so WhatsApp is a drop-in for a future sprint.

## 2026-05-07 — Locations / multi-branch support

- New `locations` table (org-scoped, RLS via `is_org_member`); nullable
  `location_id` FK on `classes` and `bookings`. Migrations `004_add_locations.sql`
  and `005_seed_zenith_locations.sql`. Seeded 3 Zenith centres (Tampines Hub,
  Bishan Junction 8, Jurong East JEM) and linked the 3 test classes one-each.
- Chat engine: `loadActiveLocations` + classes joined to location. System
  prompt now lists "OUR CENTRES" and tags each class line with its centre;
  bot asks for preferred branch when ambiguous and uses centre name in the
  booking confirmation. Booking executor uses the linked centre's address
  for the Calendar event (falls back to org address) and writes `location_id`
  on the booking row.
- Dashboard: new `/dashboard/locations` page (CRUD), sidebar entry "Centres",
  centre dropdown + table column added to Classes form, centre-filter pills
  + Centre column on Bookings page.
- Driven by Zenith's real 12-centre footprint — without a `locations` table
  the bot couldn't answer "got P5 Math at Tampines?" structurally and
  bookings had no centre tag for the front desk to filter.
- Earlier in the day: seeded 3 test classes for Zenith (P5 Math has slots,
  Sec 3 A-Math is full to exercise waitlist, JC1 H2 Math has slots) —
  migration `003_seed_zenith_test_classes.sql`.
- Set up Google OAuth client (web app, redirect to
  `/api/auth/google/callback`), pasted creds into `.env.local`, completed
  consent flow. Verified end-to-end: booking row written with
  `google_calendar_event_id` set, event landed on connected calendar with
  Tampines Hub address as venue.
- **Calendar invite polish:** parent now joins the event as an attendee
  when they give an email, with `sendUpdates: "all"` so Google emails them
  a one-tap invite. `createTrialBookingEvent` returns `invitedAttendee` so
  the engine appends a deterministic "calendar invite sent to X" line to
  the bot's reply (LLM is told NOT to promise this itself — avoids
  hallucinated calendar promises). Booking prompt now asks for email by
  default and explains why.
- Typecheck clean. End-to-end booking flow verified on localhost.

## 2026-05-06 — Phase 2: Booking system + Google Calendar + Waitlist

- Per-org Google Calendar OAuth: `/api/auth/google/start` and `/callback`
  routes; `google_refresh_token` and `google_calendar_id` stored on
  `organisations` row. Each centre connects their own calendar — fully
  multi-tenant.
- Google Calendar wrapper at `src/lib/integrations/google-calendar.ts`:
  `createTrialBookingEvent`, `listAvailableCalendars`, `deleteEvent`. Events
  use `Asia/Singapore` timezone with email + popup reminders.
- Booking executor (`actions.ts`) now creates calendar event before persisting
  the booking row, so the event id lands on the row in one write. Calendar
  failure is non-blocking — booking still saves if calendar isn't connected.
- New `[ADD_TO_WAITLIST]` action + `executeAddToWaitlist`. Engine handles
  both bookings and waitlist additions in one turn.
- System prompt rewritten for the booking flow: extracts already-given info,
  proposes specific class IDs, redirects to waitlist when class is full.
- Bookings page: status filter (all/confirmed/completed/no-show/cancelled),
  inline status dropdown that calls `PATCH /api/bookings`. Cancelling also
  removes the calendar event.
- New `/dashboard/waitlist` page: per-class groups with "Open a slot &
  notify" button, mark notified entries as enrolled or expired.
- Settings page: "Connect Google Calendar" card with OAuth flow + disconnect
  option, showing success/error feedback from query params.
- Permissive `Database` type stub at `src/lib/supabase/database.ts` to keep
  Supabase v2 client typings sane until we generate proper types.
- Typecheck passes clean.
- Note: Zenith currently has no rows in `classes`. Booking flow needs at
  least one active class to match against; populate via dashboard before
  testing the booking happy-path.

## 2026-05-06 — Phase 1 polish + Zenith test data

- Switched test org from BrightMinds to Zenith Education Studio (12 centres,
  fee schedule from real PDFs).
- Uploaded 5 Zenith PDFs (centre details, fees, policies, programmes, teachers)
  and a complete knowledge-base PDF; verified RAG retrieval end-to-end.
- Rewrote system prompt to sound like a real person, not a bot:
  removed per-message emoji habit, varied openings, added explicit "humans
  don't sign off every message" rule.
- Added strict topic-scope guard — bot now politely refuses any question not
  about the tuition centre.
- Bumped chat temperature 0.3 → 0.7 for natural variation.
- RAG tuning: similarity threshold 0.4 → 0.3, k 5 → 8 to surface more chunks
  for short queries.
- UI: added trash-can delete button for documents (`DeleteDocumentButton.tsx`),
  added reset (↻) button to the widget header to start a fresh conversation.
- Built test harness: `public/test.html` for browser testing,
  `test-chat.sh` for shell testing.
- Commits: `78306ab` (polish).

## 2026-05-05 — Phase 1 MVP scaffold

- Initial project scaffold under `tuition_centres/tuition-chatbot/`.
- Supabase schema with pgvector, RLS via `is_org_member()`, RPC for
  cosine-similarity vector search. Two migrations: schema + BrightMinds seed.
- Chat engine: RAG retrieval, intent classifier, prompt builder, action parser
  for `[BOOK_TRIAL]` / `[SEND_PAYMENT_LINK]`, trial booking executor
  (`src/lib/chat/`).
- API routes: `/api/chat` (Zod-validated, rate-limited, CORS-open),
  `/api/documents` (PDF/TXT/CSV upload + chunking + embedding).
- Embeddable widget: vanilla TS, Shadow DOM, mobile-responsive, Bun + esbuild
  build path (`widget/`).
- Admin dashboard: login (Supabase Auth), conversations list + viewer,
  document upload, classes CRUD, FAQ editor, settings, bookings list,
  basic analytics.
- Setup notes: env vars wired (Supabase + OpenAI), migrations applied to
  hosted Supabase, admin user created and linked to org_members.
- Stack notes: Next 14.2.x (config moved from `.ts` → `.mjs`),
  ESLint 8 (Next 14 doesn't support ESLint 9 yet), `next.config.ts`
  not supported in Next 14.
- Commits: `934bbd7` (MVP).
