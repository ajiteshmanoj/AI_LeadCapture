# Raffles Medical Chatbot

AI-powered patient services coordinator for Raffles Medical Group. Bot name: **Priya**.

Built on the multi-tenant clinic chatbot platform. Patients can book appointments, get fee and Medisave information, find clinic locations, and escalate urgent concerns to nursing staff — all via an embeddable web widget or Telegram.

## Features

- RAG-powered chat engine (OpenAI `gpt-4o` + `text-embedding-3-small`, pgvector)
- Embeddable website widget (single `<script>` tag, Shadow DOM, mobile-responsive)
- Appointment booking with Google Calendar invites (patient gets a one-tap invite)
- Multi-clinic support (City Hall, Holland Village, Woodlands — and 74+ island-wide)
- Medisave eligibility guidance per appointment type
- NRIC last-4 collection only (PDPA-compliant)
- Emergency escalation: auto-redirects chest pain / breathing difficulty to 995
- Nurse escalation action (`[ESCALATE_TO_NURSE]`)
- Admin dashboard (conversations, appointments, queue, consultation types, clinics, documents, FAQs, settings)
- Telegram integration for messaging channel

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
cd raffles-medical-chatbot
npm install        # or: bun install
cp .env.example .env.local
```

Fill in `.env.local` — at minimum:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 2. Run database migrations

In the Supabase SQL editor (or `supabase db push`), execute migrations in order:

1. `supabase/migrations/001_initial_schema.sql` — base tables, pgvector, RLS, RPC
2. `supabase/migrations/004_add_locations.sql` — locations table
3. `supabase/migrations/007_admin_notifications.sql` — admin Telegram notifications
4. `supabase/migrations/010_onboarding_and_branding.sql` — onboarding flow
5. `supabase/migrations/011_clinic_schema.sql` — clinic-specific columns (REQUIRED for this vertical)
6. `supabase/migrations/012_seed_raffles_medical.sql` — Raffles Medical demo data (skip in production)

### 3. Create your admin user

In Supabase Auth, create a user. Then link them to the Raffles Medical org:

```sql
insert into org_members (org_id, user_id, role) values (
  '11000000-0000-0000-0000-000000000001',  -- Raffles Medical Group (from seed)
  '<your-supabase-auth-user-id>',
  'admin'
);
```

### 4. Run

```bash
npm run dev                      # http://localhost:3000
```

Sign in at `/login`. Dashboard at `/dashboard`.

### 5. Build the embeddable widget

```bash
bun run build:widget             # writes public/widget.js
```

Embed on any Raffles Medical clinic page:

```html
<script
  src="https://your-app.vercel.app/widget.js"
  data-org-id="11000000-0000-0000-0000-000000000001"
  data-color="#003087"
  data-bot-name="Priya"
  data-welcome="Hi! I am Priya from Raffles Medical. How can I help you today?"
  data-api-url="https://your-app.vercel.app"
  defer
></script>
```

## Testing the chat engine

```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "org_id":"11000000-0000-0000-0000-000000000001",
    "channel":"web",
    "message":"How much is a GP consultation?"
  }'
```

## Key differences from the tuition platform

| Aspect | Tuition | Clinic (this repo) |
|--------|---------|-------------------|
| Bot name | Configurable | Priya |
| Booking action | `[BOOK_TRIAL]` | `[BOOK_APPOINTMENT]` |
| Patient identifier | Student name + parent | Patient name + NRIC last 4 |
| Emergency rule | None | Chest pain → call 995 |
| Medisave | Not applicable | Per-appointment-type flag |
| Escalation | Human staff | Nurse escalation action |
| Widget guard | `__TUITION_CHATBOT_LOADED` | `__CLINIC_CHATBOT_LOADED` |
| Storage key | `tcw_conversation_id` | `rmg_conversation_id` |

## Architecture notes

- **Multi-tenant by `org_id`**: all tables scoped, RLS via `is_org_member()`.
- **DB columns not renamed**: UI labels say "Patients", "Clinics", "Consultation Type" — DB still has `students`, `locations`, `classes.subject`. See CLAUDE.md for the full mapping.
- **NRIC privacy**: only last 4 characters collected. Full NRIC input is rejected before any DB write.
- **Emergency escalation**: "chest pain", "cannot breathe", "stroke" trigger an immediate 995 instruction. No booking flow proceeds.
- **PDPA**: typing `STOP` closes the conversation. PDPA notice in the widget footer references appointments explicitly and notes this is not a medical helpline.

## Knowledge base

`knowledge_base/` contains six Markdown files covering Raffles Medical history, services, fees/insurance, locations, policies, and a 20-question FAQ. Upload these as documents in the admin dashboard to populate the RAG index.
