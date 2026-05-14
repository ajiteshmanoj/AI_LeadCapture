# Jean Yip Chatbot

AI front-desk assistant for Jean Yip Group — Singapore's largest homegrown salon chain, with 60+ outlets island-wide.

Built on the tuition-chatbot base codebase. Phases 1–2 adapted and live:

- RAG-powered chat engine (OpenAI `gpt-4o` + `text-embedding-3-small`, pgvector)
- Embeddable website widget (single `<script>` tag, Shadow DOM, mobile-responsive)
- Appointment booking + queue + Google Calendar invites (client gets a one-tap invite)
- Multi-outlet (`locations`) with salon-aware booking flow
- Deposit auto-flagging: services over $100 or >2hrs get `deposit_collected = false` on booking
- Admin dashboard (conversations, appointments, queue, services, salons, documents, FAQs, settings)
- Demo org seeded: Jean Yip Group with 3 salons, 5 services, 3 stylists, 5 FAQs

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 App Router (TypeScript, strict) |
| UI | Tailwind + shadcn-style primitives |
| Auth + DB | Supabase (Postgres + pgvector + Auth) |
| LLM | OpenAI `gpt-4o` (chat) + `text-embedding-3-small` |
| Hosting | Vercel (frontend + API) + Supabase (DB) |
| Bot persona | Fiona (configurable via `settings.bot_name`) |
| Brand colour | `#C9A96E` (configurable) |

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

In the Supabase SQL editor (or `supabase db push`), execute in order:

1. `supabase/migrations/001_initial_schema.sql` — tables, pgvector, RLS, RPC
2. `supabase/migrations/002_seed_brightminds.sql` — tuition demo seed (skip in prod)
3. `supabase/migrations/004_add_locations.sql` — locations table
4. `supabase/migrations/007_admin_notifications.sql` — Telegram admin pings
5. `supabase/migrations/010_onboarding_and_branding.sql` — onboarding flow
6. `supabase/migrations/011_salon_schema.sql` — **Jean Yip salon columns + stylists table**
7. `supabase/migrations/012_seed_jean_yip.sql` — **Jean Yip demo org, salons, services, stylists, FAQs**

### 3. Create your first admin user

In Supabase Auth, invite a user (or sign up). Then link them to the Jean Yip org:

```sql
insert into org_members (org_id, user_id, role) values (
  '44000000-0000-0000-0000-000000000001',  -- Jean Yip Group (from seed)
  '<your-supabase-auth-user-id>',
  'admin'
);
```

### 4. Upload knowledge base documents

After logging in at `/dashboard`, go to **Documents** and upload the 6 files in `knowledge_base/`:

- `jean_yip_overview.md`
- `jean_yip_services.md`
- `jean_yip_stylists.md`
- `jean_yip_salons.md`
- `jean_yip_policies.md`
- `jean_yip_faq.md`

These are chunked and embedded automatically. The bot uses them for RAG retrieval on every chat turn.

### 5. Run

```bash
npm run dev                      # http://localhost:3000
```

Sign in at `/login`. Dashboard at `/dashboard`.

### 6. Build the embeddable widget

```bash
bun run build:widget             # writes public/widget.js
```

Embed on any salon website:

```html
<script
  src="https://your-app.vercel.app/widget.js"
  data-org-id="44000000-0000-0000-0000-000000000001"
  data-color="#C9A96E"
  data-bot-name="Fiona"
  data-welcome="Hi! I'm Fiona from Jean Yip. How can I help you today?"
  data-api-url="https://your-app.vercel.app"
  defer
></script>
```

## Testing the chat engine

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "org_id":"44000000-0000-0000-0000-000000000001",
    "channel":"web",
    "message":"How much is a balayage for long hair?"
  }'
```

Expected: Fiona quotes from $280, mentions the 30% deposit requirement, and offers to book.

## Key differences from tuition-chatbot base

| Area | Tuition base | Jean Yip salon |
|------|-------------|----------------|
| Bot name | Configurable | Fiona |
| Primary colour | `#2563eb` | `#C9A96E` |
| Booking action | `[BOOK_TRIAL]` | `[BOOK_APPOINTMENT]` |
| Booking type | `trial` | `appointment` |
| Deposit logic | None | Auto-flagged for services >$100 or >2hr |
| DB columns | unchanged | unchanged (display labels only differ) |
| Widget guard key | `__TUITION_CHATBOT_LOADED` | `__SALON_CHATBOT_LOADED` |
| Storage key | `tcw_conversation_id` | `jyg_conversation_id` |
| PDPA text | "...for enquiry purposes" | "...for appointment booking" |
| Stylist table | None | `stylists` (new in 011) |

## Architecture notes

- **Multi-tenant by `org_id`**: every tenant table scoped, RLS via `is_org_member()`.
- **Deposit flag**: set by `executeBookAppointment()` directly based on `classes.requires_deposit` — not gated on the LLM emitting `[COLLECT_DEPOSIT]`.
- **Calendar title format**: `Appointment: {clientName} — {service}`.
- **Rate limit**: 30 messages/min/conversation (in-memory).
- **PDPA**: every web session sees a disclaimer; typing `STOP` closes the conversation.

## Column mapping reference

DB column names are unchanged from the tuition base. Labels differ in the UI only:

| DB column | Displayed as |
|-----------|-------------|
| `classes` | Services |
| `students` | Clients |
| `classes.subject` | Service |
| `classes.level` | Hair Length |
| `classes.teacher_name` | Stylist |
| `classes.monthly_fee` | Service Price |
| `locations` | Salons |
| `waitlist` | Queue |
