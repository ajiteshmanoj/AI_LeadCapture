# Virgin Active Singapore Chatbot

AI member services chatbot for Virgin Active Singapore. Bot name: **Alex**.
Forked from the tuition-chatbot codebase — schema columns are unchanged; only
UI labels, prompts, and gym-specific logic have been updated.

## What it does

- Embeddable website widget (single `<script>` tag, Shadow DOM, mobile-responsive)
- RAG-powered chat (OpenAI `gpt-4o` + `text-embedding-3-small`, pgvector)
- Trial class booking flow with Google Calendar invites
- Membership tier information (Classic $99 / Plus $139 / Premium $179)
- Waitlist for full classes
- Admin dashboard (conversations, class bookings, waitlist, classes, clubs, documents, FAQs, settings)

## Stack

| Layer     | Choice                                                   |
|-----------|----------------------------------------------------------|
| Framework | Next.js 14 App Router (TypeScript, strict)               |
| UI        | Tailwind + shadcn-style primitives                       |
| Auth + DB | Supabase (Postgres + pgvector + Auth)                    |
| LLM       | OpenAI `gpt-4o` (chat) + `text-embedding-3-small`        |
| Hosting   | Vercel (frontend + API) + Supabase (DB)                  |

## Setup

### 1. Install

```bash
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

In Supabase SQL editor (or `supabase db push`), apply all migrations in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/004_add_locations.sql
supabase/migrations/006_telegram_webhook_secret.sql
supabase/migrations/007_admin_notifications.sql
supabase/migrations/008_parent_channels.sql
supabase/migrations/009_enable_realtime.sql
supabase/migrations/010_onboarding_and_branding.sql
supabase/migrations/011_gym_schema.sql
supabase/migrations/012_seed_virgin_active.sql   # demo data — skip in production
```

### 3. Create your first admin user

In Supabase Auth, invite or sign up a user. Then link them to the Virgin Active org:

```sql
insert into org_members (org_id, user_id, role) values (
  '33000000-0000-0000-0000-000000000001',   -- Virgin Active Singapore (from seed)
  '<your-supabase-auth-user-id>',
  'admin'
);
```

### 4. Run

```bash
npm run dev         # http://localhost:3000
```

Sign in at `/login`. Dashboard at `/dashboard`.

### 5. Build the embeddable widget

```bash
bun run build:widget    # writes public/widget.js
```

Embed on your site:

```html
<script
  src="https://your-app.vercel.app/widget.js"
  data-org-id="33000000-0000-0000-0000-000000000001"
  data-color="#E3000F"
  data-bot-name="Alex"
  data-welcome="Hi! I'm Alex from Virgin Active. How can I help?"
  data-api-url="https://your-app.vercel.app"
  defer
></script>
```

## Testing the chat engine

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "org_id":"33000000-0000-0000-0000-000000000001",
    "channel":"web",
    "message":"I want to try a yoga class"
  }'
```

## Knowledge Base

Upload the files in `knowledge_base/` via the dashboard Documents page to seed
the RAG system with Virgin Active content:

- `virgin_active_overview.md` — brand, Singapore presence, facilities
- `virgin_active_classes.md` — full timetable by class type
- `virgin_active_clubs.md` — 6 clubs with addresses, facilities, hours
- `virgin_active_membership.md` — 3 tiers, freeze policy, cancellation
- `virgin_active_faq.md` — 20 Q&A pairs

## Chat Actions

The bot emits structured action tags that the engine parses and executes:

| Tag | Triggered when |
|-----|---------------|
| `[BOOK_TRIAL_CLASS] {...}` | Member confirms a trial class booking |
| `[JOIN_WAITLIST] {...}` | Member joins waitlist for a full class |
| `[ENQUIRE_MEMBERSHIP] {...}` | Member wants to sign up or learn more |

## Architecture

- **Multi-tenant by `org_id`**: every table is scoped; RLS via `is_org_member()`.
- **DB columns unchanged**: `students`, `teacher_name`, `subject`, `level`, etc. — UI labels only differ.
- **Trial-first**: the bot always offers a complimentary trial before membership pricing.
- **No fitness/nutrition advice**: bot always refers members to a personal trainer.
- **Freeze policy**: $20/month via email — bot cannot process this; always redirects.
- **PDPA**: widget shows "for class booking purposes" disclaimer; `STOP` closes conversation.
