# Huttons Asia — AI Property Concierge Chatbot

AI-powered property concierge for **Huttons Asia**, Singapore's largest private real estate agency (5,300+ agents, CEA licensed). The chatbot qualifies leads, presents listings, and books property viewings — all before a human agent needs to get involved.

## What It Does

- **Lead qualification**: Asks budget, citizenship (critical for ABSD calculation), property type preference, district, urgency before booking a viewing
- **ABSD-aware**: Always collects citizenship status before quoting prices — SC/PR/Foreigner have very different tax obligations (0%/5%/60%)
- **Listing presentation**: Pulls live listings from the `classes` (viewing slots) and `property_listings` tables
- **Viewing booking**: Books viewings with calendar invite to the lead, Telegram notification to agent
- **Hot lead alerts**: If lead scores "hot" (ready in 3 months), fires a `🔥 HOT LEAD` Telegram notification to the admin/agent
- **Pipeline dashboard**: Shows qualified leads with viewing appointments (`/dashboard/waitlist` → "Pipeline")
- **Embeddable widget**: Single `<script>` tag for any Huttons website; Shadow DOM, mobile-responsive

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 14 App Router (TypeScript, strict) |
| UI | Tailwind + shadcn-style primitives |
| Auth + DB | Supabase (Postgres + pgvector + Auth) |
| LLM | OpenAI `gpt-4o` (chat) + `text-embedding-3-small` |
| Hosting | Vercel (frontend + API) + Supabase (DB) |

## Setup

### 1. Install

```bash
cd huttons-chatbot
npm install
cp .env.example .env.local
```

Fill in `.env.local` at minimum:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run database migrations

In the Supabase SQL editor (or `supabase db push`), execute in order:

1. `supabase/migrations/001_initial_schema.sql` — base tables, pgvector, RLS, RPC
2. `supabase/migrations/004_add_locations.sql` — locations table
3. `supabase/migrations/007_admin_notifications.sql` — Telegram notification support
4. `supabase/migrations/008_parent_channels.sql` — channel support
5. `supabase/migrations/009_enable_realtime.sql` — realtime subscriptions
6. `supabase/migrations/010_onboarding_and_branding.sql` — onboarding flow
7. `supabase/migrations/011_property_schema.sql` — property column extensions
8. `supabase/migrations/012_seed_huttons.sql` — Huttons Asia demo data

### 3. Create your first admin user

In Supabase Auth, sign up. Then link to the Huttons org:

```sql
insert into org_members (org_id, user_id, role) values (
  '55000000-0000-0000-0000-000000000001',  -- Huttons Asia (from seed)
  '<your-supabase-auth-user-id>',
  'admin'
);
```

### 4. Run

```bash
npm run dev  # http://localhost:3000
```

Sign in at `/login`. Dashboard at `/dashboard`.

### 5. Build the embeddable widget

```bash
bun run build:widget  # writes public/widget.js
```

Embed on any Huttons website:

```html
<script src="https://your-app.vercel.app/widget.js"
        data-org-id="55000000-0000-0000-0000-000000000001"
        data-color="#1A3C5E"
        data-bot-name="James"
        data-welcome="Hi! I'm James from Huttons Asia. Looking to buy, sell, or rent?"
        data-api-url="https://your-app.vercel.app" defer></script>
```

## Key Architecture Decisions

### Table Mapping (Property Vertical)
The property chatbot reuses the tuition-chatbot schema with extensions:
- `classes` table = viewing slots (not tuition classes). `subject` = property title, `level` = budget range, `teacher_name` = agent name
- `property_listings` = full listing details (separate table, migration 011)
- `students` = leads, with `lead_score`, `citizenship_status`, `budget_min/max`
- `bookings` with `booking_type = 'viewing'` (not 'trial')
- Pipeline (not Waitlist) = `bookings` filtered by `booking_type='viewing'`

### ABSD-First Design
The system prompt mandates asking citizenship status before quoting any residential price. Foreigners pay 60% ABSD — on a $1.5M condo, that's an extra $900K. This is too significant to discover after a viewing.

### Lead Scoring
Bot scores leads as hot/warm/cold based on qualification conversation:
- **Hot**: Ready within 3 months, clear budget, pre-approved loan
- **Warm**: 3–6 months timeline
- **Cold**: >6 months or browsing

Hot leads trigger a `🔥 HOT LEAD` Telegram notification to the admin.

## Testing the Chat API

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "org_id":"55000000-0000-0000-0000-000000000001",
    "channel":"web",
    "message":"I am looking for a 3-bedroom condo in Bishan, budget around $1.6M"
  }'
```

## Knowledge Base

The `knowledge_base/` directory contains 6 markdown files for upload to the document RAG system:
- `huttons_overview.md` — agency background, divisions, awards
- `huttons_new_launches.md` — current new launch projects with PSF, TOP, unit types
- `huttons_resale_hdb.md` — HDB resale process, eligibility, grants
- `huttons_private_resale.md` — private property process, stamp duties, financing
- `huttons_agents.md` — agent matching, buyer representation, viewing checklist
- `huttons_faq.md` — 20 Q&A pairs covering all common buyer questions

Upload these via `Dashboard → Documents` after setup.

## Architecture Notes

- **Multi-tenant by `org_id`**: All tables scoped by org. RLS via `is_org_member()`. Service role key used for chat traffic (anonymous web widget).
- **PDPA compliance**: Widget displays CEA-compliant PDPA notice. Typing `STOP` closes the conversation immediately.
- **Widget guard**: `window.__PROPERTY_CHATBOT_LOADED` prevents double-loading. Session key: `htg_conversation_id`.
- **Rate limit**: 30 messages/min/conversation (in-memory).
- **Calendar integration**: Per-org Google Calendar OAuth. Viewing bookings create calendar events titled `Viewing: {Lead} — {Property}`.
