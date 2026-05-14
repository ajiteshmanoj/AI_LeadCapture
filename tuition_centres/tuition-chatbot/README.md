# Tuition Chatbot

AI front-desk assistant for Singapore tuition centres. Phases 1–2 are live:

- RAG-powered chat engine (OpenAI `gpt-4o` + `text-embedding-3-small`, pgvector)
- Embeddable website widget (single `<script>` tag, Shadow DOM, mobile-responsive)
- Trial booking + waitlist + Google Calendar invites (parent gets a one-tap invite)
- Multi-branch (`locations`) with centre-aware booking flow
- Admin dashboard (conversations, bookings, waitlist, classes, centres,
  documents, FAQs, settings, analytics)

Phases 3–11 (messaging, lead nurture, payments, reminders, makeup booking,
broadcasts, lifecycle, growth, analytics) are pending — see
[`FEATURE_ROADMAP.md`](./FEATURE_ROADMAP.md) for the full phase plan, sprint
estimates, and per-feature specs.

## Stack

| Layer       | Choice                                              |
|-------------|-----------------------------------------------------|
| Framework   | Next.js 14 App Router (TypeScript, strict)          |
| UI          | Tailwind + shadcn-style primitives                  |
| Auth + DB   | Supabase (Postgres + pgvector + Auth)               |
| LLM         | OpenAI `gpt-4o` (chat) + `text-embedding-3-small`   |
| Hosting     | Vercel (frontend + API) + Supabase (DB)             |

## Setup

### 1. Install

```bash
cd tuition-chatbot
npm install        # or: bun install
cp .env.example .env.local
```

Fill in at minimum:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run database migrations

In the Supabase SQL editor (or `supabase db push`), execute:

1. `supabase/migrations/001_initial_schema.sql` — tables, pgvector, RLS, RPC.
2. `supabase/migrations/002_seed_brightminds.sql` — seed BrightMinds Tuition demo data
   (Jurong East centre with Pri/Sec classes + FAQs). Skip in production.

### 3. Create your first admin user

In Supabase Auth, invite a user (or sign up). Then link them to the seeded org:

```sql
insert into org_members (org_id, user_id, role) values (
  '00000000-0000-0000-0000-000000000001',           -- BrightMinds (from seed)
  '<your-supabase-auth-user-id>',
  'admin'
);
```

### 4. Run

```bash
npm run dev                      # http://localhost:3000
```

Sign in at `/login`. The dashboard lives at `/dashboard`.

### 5. Build the embeddable widget

```bash
bun run build:widget             # writes public/widget.js
# or with esbuild:
npx esbuild widget/src/index.ts --bundle --minify --format=iife --outfile=public/widget.js
```

The dashboard "Overview" page shows the exact `<script>` snippet to paste into a
client website.

## Testing the chat engine

After uploading at least one document or relying on FAQs + classes, hit `/api/chat`:

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "org_id":"00000000-0000-0000-0000-000000000001",
    "channel":"web",
    "message":"How much is Sec 3 A-Math?"
  }'
```

The bot reads live class data from Postgres, retrieves the top-5 RAG chunks, and
calls `gpt-4o` with the system prompt in `src/lib/chat/prompts.ts`. Booking actions
trigger a `[BOOK_TRIAL]` JSON payload in the model output, which the engine parses
and executes (see `src/lib/chat/actions.ts`).

## Architecture notes

- **Multi-tenant by `org_id`**: every tenant table is scoped, RLS uses
  `is_org_member()`. The `service_role` key bypasses RLS for chat traffic where
  the user isn't authenticated (web widget, future WhatsApp/Telegram webhooks).
- **Hard rules in the system prompt**: never hallucinate, route complaints to a
  human, defer pricing to live class data, refuse academic advice.
- **Rate limit**: 30 messages/min/conversation (in-memory; swap for Upstash if you
  go multi-region).
- **PDPA**: every web session sees a disclaimer; typing `STOP` closes the
  conversation immediately.

## What's next

Phase 3 (messaging — Telegram first, then WhatsApp via Twilio, then unified
inbox) is up next. See [`FEATURE_ROADMAP.md`](./FEATURE_ROADMAP.md) for the
full integrated phase plan and `SESSIONS.md` for what shipped when.
