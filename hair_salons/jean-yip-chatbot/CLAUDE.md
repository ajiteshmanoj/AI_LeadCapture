# Claude — Jean Yip Chatbot project guide

This file is auto-loaded by Claude Code in every session. Treat it as standing
instructions for working in this repo.

## What this is

**Jean Yip Group** salon chatbot — a vertical of the tuition-chatbot base codebase,
adapted for Singapore's largest homegrown hair salon chain. Same multi-tenant Next.js +
Supabase + OpenAI stack; UI and chat logic retuned for salon appointment booking.

Commercial context: same productised-service model ($400–600 setup + $80–120/mo).
Jean Yip is the first salon vertical built on top of the tuition-chatbot base.

## Column Mapping — Tuition → Salon

The database columns retain their original names to avoid migrations. The display
labels are changed in the UI only (never in SQL queries or Supabase calls):

| DB column / concept | Tuition label | Salon label |
|---------------------|---------------|-------------|
| `classes` table | Classes | Services |
| `students` table | Students | Clients |
| `classes.subject` | Subject | Service name |
| `classes.level` | Level | Hair Length |
| `classes.teacher_name` | Teacher | Stylist |
| `classes.monthly_fee` | Monthly fee | Service Price |
| `bookings.booking_type='trial'` | Trial | First Visit |
| `bookings.booking_type='appointment'` | — | Appointment (new) |
| `locations` table | Centres | Salons |
| `waitlist` table | Waitlist | Queue |
| Nav "Bookings" | Bookings | Appointments |
| Nav "Classes" | Classes | Services |
| Nav "Centres" | Centres | Salons |
| Nav "Waitlist" | Waitlist | Queue |

**Rule**: never rename DB columns. Always translate in TSX/display layer only.

## Deposit Auto-Append Logic

When `executeBookAppointment()` is called and the fetched `classes` row has
`requires_deposit = true`:

1. The booking is created with `deposit_collected = false`.
2. The admin notification uses the header `"✂️ *New appointment — deposit pending*"`.
3. The bot's confirmation message must mention the deposit amount and say that the
   team will collect it before the appointment.
4. The `[COLLECT_DEPOSIT]` action token is parsed from the LLM reply if present, but
   the deposit flag on the booking row is set by `executeBookAppointment` directly —
   not gated on the LLM outputting the action token.

This means: even if the LLM forgets to emit `[COLLECT_DEPOSIT]`, the booking row
correctly records `deposit_collected = false` whenever the service requires a deposit.

## Salon-Specific Schema (011_salon_schema.sql)

New columns on existing tables:
- `classes`: `service_category`, `service_duration_minutes`, `requires_deposit`,
  `deposit_amount`, `hair_length_category`, `is_unisex`
- `students`: `preferred_stylist`, `hair_type`, `last_visited`, `loyalty_points`,
  `colour_allergies`
- `bookings`: `stylist_requested`, `deposit_collected`, `deposit_amount_collected`,
  `reschedule_count`

New table: `stylists` (id, org_id, location_id, name, tier, specialisation[],
years_experience, bio, is_active, created_at). RLS: `is_org_member(org_id)`.

## Seeded Demo Data (012_seed_jean_yip.sql)

- Org id: `44000000-0000-0000-0000-000000000001`, slug `jean-yip`, bot `Fiona`, colour `#C9A96E`
- 3 locations: Jurong Point, Tampines Mall, Bugis Junction
- 5 services: Haircut & Blow Dry (no deposit), Full Colour Short (deposit), Balayage+Toner Long (deposit), Keratin Medium (deposit), Digital Perm Short-Medium (deposit)
- 3 stylists: Kelly Tan (Senior, Jurong Point), Xiao Mei (Principal, Tampines), Ahmad Firdaus (Stylist, Bugis)
- 5 FAQs: booking, deposit, stylist request, cancellation, haircut pricing

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
- Keep it tight — bullets, not prose. ~5-10 bullets per session.
- Do not log secrets, env values, or sensitive data.

## Conventions in this repo

- **TypeScript strict.** No `any`. Server-side files use `nodejs` runtime.
- **Multi-tenant by `org_id`.** RLS via `is_org_member()`. Chat traffic uses service-role key.
- **OpenAI only.** `gpt-4o` for chat, `text-embedding-3-small` for embeddings.
- **Widget is vanilla TS + Shadow DOM.** Guard key: `window.__SALON_CHATBOT_LOADED`.
  Storage key: `jyg_conversation_id`. Never import React into `widget/`.
- **Migrations are append-only.** Add `00X_*.sql` files; never edit applied migrations.

## Stack pins (don't bump without a reason)

- Next.js `^14.2.33`
- ESLint `^8.57.1`
- `next.config.mjs` (not `.ts`)

## Where things live

- Chat engine: `src/lib/chat/{engine,prompts,rag,intents,actions}.ts`
- API routes: `src/app/api/{chat,documents,...}/route.ts`
- Dashboard: `src/app/dashboard/**`
- Widget: `widget/src/**` → build → `public/widget.js`
- Schema: `supabase/migrations/`
- Knowledge base: `knowledge_base/` (6 markdown files for RAG upload)

## Knowledge Base Files

Upload these to the dashboard Documents page after setup to power RAG:

| File | Content |
|------|---------|
| `jean_yip_overview.md` | Brand history, 1982 founding, 60+ outlets, awards |
| `jean_yip_services.md` | Full price menu: cuts, colour, balayage, chemical, scalp, nail, facial |
| `jean_yip_stylists.md` | Tier system (Junior→CD), pricing by tier, requesting a stylist |
| `jean_yip_salons.md` | 3 seeded outlets + island-wide note, hours, MRT, parking |
| `jean_yip_policies.md` | Deposit, cancellation, rescheduling, walk-in, Beauté Card loyalty |
| `jean_yip_faq.md` | 20 Q&A pairs covering all common client questions |

## Phase status

| # | Phase | Status |
|---|-------|--------|
| 1 | MVP (chat + RAG + widget + dashboard) | ✅ (inherited) |
| 2 | Appointment booking + Google Calendar + Queue + Salons | ✅ (adapted) |
| 3 | Deposit collection flow (PayNow / Stripe) | pending |
| 4 | Stylist availability management | pending |
| 5 | Messaging (WhatsApp + Telegram) | pending |
| 6 | Reminders (appointment + follow-up) | pending |
| 7 | Loyalty (Beauté Card point tracking) | pending |
| 8 | Analytics | pending |
