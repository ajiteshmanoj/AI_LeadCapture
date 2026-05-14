# Din Tai Fung Chatbot

AI reservation coordinator for Din Tai Fung Singapore. Bot persona: **Mei**.

Built on the tuition-chatbot base — RAG-powered chat, Google Calendar integration,
embeddable widget, and a multi-outlet admin dashboard — adapted for F&B reservation flows.

## Features

- Reservation booking flow via chat (pax → outlet → date/time → guest details → confirm)
- Walk-in enquiry handling and waitlist
- Menu and dietary questions with mandatory Halal disclosure
- Catering / large-group enquiry capture
- Google Calendar invite to guests on confirmation
- Admin dashboard: Reservations, Waitlist, Reservation Slots, Outlets, Documents, FAQs, Settings
- Embeddable widget (`<script>` tag, Shadow DOM, mobile-responsive)
- Telegram bot support for inbound reservations

## Stack

| Layer     | Choice                                             |
|-----------|----------------------------------------------------|
| Framework | Next.js 14 App Router (TypeScript, strict)         |
| UI        | Tailwind + shadcn-style primitives                 |
| Auth + DB | Supabase (Postgres + pgvector + Auth + RLS)        |
| LLM       | OpenAI `gpt-4o` (chat) + `text-embedding-3-small` |
| Calendar  | Google Calendar API (per-org OAuth)                |
| Hosting   | Vercel + Supabase                                  |

## Setup

### 1. Install

```bash
cd din-tai-fung-chatbot
npm install        # or: bun install
cp .env.example .env.local
```

Fill in all required variables in `.env.local` (see `.env.example`).

### 2. Run database migrations

In the Supabase SQL editor or via `supabase db push`, run in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/004_add_locations.sql
supabase/migrations/007_admin_notifications.sql
supabase/migrations/008_parent_channels.sql
supabase/migrations/009_enable_realtime.sql
supabase/migrations/010_onboarding_and_branding.sql
supabase/migrations/011_fnb_schema.sql       ← F&B columns + menu_items table
supabase/migrations/012_seed_din_tai_fung.sql ← Demo org, outlets, slots, FAQs
```

### 3. Create your first admin user

In Supabase Auth, create a user, then link them to the Din Tai Fung org:

```sql
INSERT INTO org_members (org_id, user_id, role) VALUES (
  '22000000-0000-0000-0000-000000000001',
  '<your-supabase-auth-user-id>',
  'admin'
);
```

### 4. Run

```bash
npm run dev     # http://localhost:3000
```

Sign in at `/login`. Dashboard at `/dashboard`.

### 5. Upload knowledge base documents

After logging in, go to **Dashboard → Documents** and upload the files from `knowledge_base/`:

- `dtf_restaurant_overview.md`
- `dtf_menu.md`
- `dtf_outlets_hours.md`
- `dtf_reservations_policy.md`
- `dtf_faq.md`

These are chunked, embedded, and retrieved via RAG for every chat turn.

### 6. Build the embeddable widget

```bash
bun run build:widget     # writes public/widget.js
```

Embed on any page:

```html
<script
  src="https://your-domain.com/widget.js"
  data-org-id="22000000-0000-0000-0000-000000000001"
  data-color="#8B0000"
  data-bot-name="Mei"
  data-welcome="Hi! I'm Mei from Din Tai Fung Singapore. How can I help with your reservation today?"
  data-api-url="https://your-domain.com"
  defer
></script>
```

## Testing the chat engine

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "org_id":"22000000-0000-0000-0000-000000000001",
    "channel":"web",
    "message":"I want to book a table for 6 at ION Orchard this Saturday for dinner"
  }'
```

The bot reads live reservation slot data from Postgres, retrieves the top RAG chunks
from uploaded documents, and calls `gpt-4o` with the system prompt in
`src/lib/chat/prompts.ts`. Confirmed bookings trigger `[BOOK_TABLE]` which the
engine parses and executes (see `src/lib/chat/actions.ts`).

## Halal Policy

Din Tai Fung Singapore is NOT Halal-certified. The kitchen uses pork products
including lard. The bot (Mei) is hardcoded to disclose this clearly whenever asked —
this must never be softened in prompt changes. See `CLAUDE.md` for the HALAL RULE.

## DB Schema Notes

The F&B fork reuses the existing tuition schema with column repurposing and additive
extensions. **Never rename existing columns** — only add new columns via migrations.

| F&B concept         | DB column              |
|---------------------|------------------------|
| Reservation slot    | `classes` table        |
| Max party size text | `classes.level`        |
| Outlet              | `locations` table      |
| Deposit amount ($)  | `classes.monthly_fee`  |
| Guest record        | `students` table       |
| Reservation         | `bookings` (type=reservation) |

Full mapping in `CLAUDE.md`.

## Architecture

- **Multi-tenant:** every table scoped by `org_id`; RLS via `is_org_member()`.
  Service-role key used for anonymous chat traffic.
- **Widget guard:** `window.__FNB_CHATBOT_LOADED` prevents double-load.
  Storage key: `dtf_conversation_id`.
- **Booking actions:** `[BOOK_TABLE]`, `[ADD_TO_WAITLIST]`, `[SEND_CATERING_ENQUIRY]`,
  `[CHECK_AVAILABILITY]` tokens in LLM output are parsed and executed server-side.
- **Calendar:** Google Calendar OAuth per-org. Guests receive a one-tap calendar invite
  with their reservation details.
