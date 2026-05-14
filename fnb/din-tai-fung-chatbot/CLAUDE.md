# Claude — project guide (Din Tai Fung F&B fork)

This file is auto-loaded by Claude Code in every session. Treat it as standing
instructions for working in this repo.

## What this is

AI reservation chatbot for **Din Tai Fung Singapore**. This is an F&B fork of
the tuition-chatbot base. The bot persona is **Mei**, a reservation coordinator.
One Postgres database, one Next.js app — every business table is scoped by
`org_id`. The demo org id is `22000000-0000-0000-0000-000000000001`.

## F&B Schema Mapping (CRITICAL — read before touching any DB or UI)

The codebase reuses the tuition schema. F&B concepts map to existing columns as follows:

| F&B Concept | DB table / column | Notes |
|---|---|---|
| Reservation slot | `classes` table | `subject` = time slot name (e.g. "Lunch Service") |
| Max party size (display) | `classes.level` | Stored as text, e.g. "up to 8 pax" |
| Outlet | `locations` table | Same as "Centre" in tuition schema |
| Deposit Required ($) | `classes.monthly_fee` | Repurposed — stores deposit amount |
| Guest | `students` table | `student_name` = guest name, `parent_phone` = contact |
| Reservation | `bookings` table | `booking_type = 'reservation'` |
| Confirmed pax | `bookings.confirmed_pax` | Added in 011_fnb_schema.sql |
| Max pax (numeric) | `classes.max_pax` | Added in 011_fnb_schema.sql |
| Requires deposit (flag) | `classes.requires_deposit` | Added in 011_fnb_schema.sql |
| Menu items | `menu_items` table | New table from 011_fnb_schema.sql |

**NEVER rename DB columns.** UI labels have been changed in components — the DB
schema column names remain unchanged for migration safety.

## HALAL RULE — NEVER VIOLATE

Din Tai Fung Singapore is **NOT Halal-certified**. The kitchen uses pork products
including lard. The chatbot (Mei) must **always** state this clearly when asked
and must **never** suggest any dish is Halal or Halal-friendly. This is a legal
and brand risk — do not soften this answer in prompts or responses.

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
- One entry per working day.
- Keep it tight — bullets, not prose.
- Do not log secrets, env values, or sensitive data.

## Conventions in this repo

- **TypeScript strict.** No `any`. Server-side files use `nodejs` runtime.
- **Multi-tenant by `org_id`.** All business tables scoped. RLS via `is_org_member()`.
- **OpenAI only.** `gpt-4o` for chat, `text-embedding-3-small` for embeddings.
- **Widget is vanilla TS + Shadow DOM.** Build with esbuild (`build:widget`).
  Guard key: `window.__FNB_CHATBOT_LOADED`. Storage key: `dtf_conversation_id`.
- **Migrations are append-only.** Add `00X_*.sql` files; never edit applied migrations.

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
- Knowledge base: `knowledge_base/` — upload these as documents in the dashboard
- Test page: `public/test.html`

## Key action tokens (chat engine)

| Token | Purpose |
|---|---|
| `[BOOK_TABLE]` | Create a confirmed reservation |
| `[ADD_TO_WAITLIST]` | Add guest to waitlist for a full slot |
| `[SEND_CATERING_ENQUIRY]` | Log large-group / off-site catering enquiry |
| `[CHECK_AVAILABILITY]` | Check slot availability before committing |
| `[SEND_PAYMENT_LINK]` | Send deposit payment link (Phase 5) |

## Seed data

- Demo org: **Din Tai Fung Singapore** (`org_id = 22000000-0000-0000-0000-000000000001`)
- 3 locations: Paragon, ION Orchard, VivoCity
- 5 reservation slots: Lunch/Dinner at Paragon + ION, Private Dining Room at Paragon
- 5 FAQs: Halal policy, reservations, signature dishes, vegetarian options, catering

## Knowledge base files (upload to dashboard → Documents)

- `knowledge_base/dtf_restaurant_overview.md` — brand story, Michelin, 18 pleats
- `knowledge_base/dtf_menu.md` — full menu with prices and dietary tags
- `knowledge_base/dtf_outlets_hours.md` — all 7 outlets, hours, MRT directions
- `knowledge_base/dtf_reservations_policy.md` — reservation rules, private dining, catering
- `knowledge_base/dtf_faq.md` — 20 Q&A pairs

## Phase status

| # | Phase | Status |
|---|-------|--------|
| 1 | MVP (chat + RAG + widget + dashboard) | ✅ |
| 2 | Reservation flow + Google Calendar + Waitlist + Outlets | ✅ |
| 3 | Messaging (WhatsApp + Telegram) | 🟡 Telegram done; WhatsApp pending |
| 4 | Lead nurture / post-visit follow-ups | pending |
| 5 | Payments (deposit via PayNow/Stripe) | pending |
| 6 | Reminders (day-before reservation SMS) | pending |
| 7 | Menu management UI | pending |
| 8 | Analytics | pending |
