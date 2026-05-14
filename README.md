# AI LeadCapture — Singapore SME Chatbot Platform

A productised AI chatbot SaaS for Singapore SMEs. Each chatbot acts as a 24/7 front-desk assistant — answering FAQs, booking appointments, managing waitlists, and routing escalations to the business owner over Telegram.

Sold as a white-label service: **$400–600 setup + $80–120/month**. One codebase per vertical, each independently deployable on Vercel + Supabase.

---

## Verticals

| Vertical | Demo Client | Bot Name | Status |
|---|---|---|---|
| **Tuition Centres** | Zenith Education Studio | Assistant | ✅ Active (Phases 1–3 done) |
| **Clinics** | Raffles Medical Group | Priya | ✅ Built (Phases 1–3) |
| **F&B / Restaurants** | Din Tai Fung Singapore | Mei | ✅ Built (Phases 1–3) |
| **Gyms / Fitness** | Virgin Active Singapore | Alex | ✅ Built (Phases 1–3) |
| **Hair Salons** | Jean Yip Group | Fiona | ✅ Built (Phases 1–3) |
| **Property** | Huttons Asia | James | ✅ Built (Phases 1–3) |

Each vertical lives in its own directory with a standalone Next.js app, Supabase migrations, and a knowledge base of markdown documents for RAG.

---

## What's Built

### Phase 1 — MVP ✅
- **RAG-powered chat** — documents uploaded via the dashboard are chunked, embedded (OpenAI `text-embedding-3-small`), and stored in Supabase pgvector. Every message retrieves the top-8 relevant chunks before calling the LLM.
- **Domain-specific system prompts** — each vertical has a persona, scope guard, booking flow, and action tag format tailored to its business type.
- **Intent classifier** — heuristic pattern matching routes messages to booking, fees, schedule, complaint, or FAQ intents before the LLM call.
- **Embeddable website widget** — vanilla TypeScript + Shadow DOM. Drop one `<script>` tag on any client website. Fully isolated from the host page's CSS. PDPA disclaimer on first load. Reset button starts a fresh conversation.
- **Streaming responses** — the widget renders tokens as they arrive from OpenAI via SSE, so the first word appears in ~500ms instead of waiting 5–8 seconds for the full response.
- **Admin dashboard** — 11 pages: conversations, bookings/viewings, waitlist/pipeline, services/classes/listings, locations/branches, documents, FAQs, settings, branding, analytics (stub), payments (stub).
- **Invite-only signup** — email invite flow with a tokenised link. New admin users complete a 5-step onboarding wizard before going live.
- **Multi-tenant** — one Supabase project, one Next.js app. Every business table is scoped by `org_id`. Row-Level Security via `is_org_member()`. Dashboard auth via Supabase Auth.

### Phase 2 — Booking + Calendar ✅
- **Full booking flow** — bot collects details one field at a time, proposes matching options, confirms, then executes:
  1. Creates a Google Calendar event on the business's connected calendar (Asia/Singapore timezone)
  2. Adds the customer as an attendee — Google emails a one-tap calendar invite
  3. Writes a booking row with `google_calendar_event_id` for dashboard sync
- **Waitlist** — when a class/slot is full, bot offers the waitlist. Position tracked. Admin can open a slot and notify from the dashboard.
- **Multi-branch** — `locations` table per org. Classes and bookings are linked to branches. Bot asks for preferred branch when ambiguous.
- **Domain-specific booking types** — trial (tuition/gyms), consultation (clinics), table reservation (F&B), appointment with deposit logic (salons), viewing with lead qualification (property).

### Phase 3 — Telegram Messaging ✅
- **Per-org Telegram bot** — bot token + webhook secret stored on the org. Each business connects their own BotFather bot via the dashboard.
- **Inbound webhook** — `POST /api/webhooks/telegram/[orgSlug]` with secret validation. Returns `200 OK` immediately via `waitUntil`; processing runs in the background to prevent Telegram retry storms.
- **Admin notifications** — owner gets a Telegram ping when a booking is confirmed (🎉), waitlist entry is added (📝), or a complaint/escalation is detected (🚨). All notifications are fully awaited so they never get dropped.
- **Admin takeover** — receptionist clicks "Take over" in the conversations dashboard. Bot stops auto-replying. Receptionist types a reply → delivered to the customer via the same Telegram bot. Customer's next message appears live in the dashboard (Supabase Realtime).
- **Customer Telegram opt-in** — web-channel customers who book on the website get a deep-link to connect their Telegram for reminders.
- **Channel abstraction** — `src/lib/chat/channels.ts` routes replies back to the correct channel (web response vs Telegram Bot API). Same `handleChat` engine powers both.

---

## What Still Needs to Be Built

### Phase 4 — Lead Nurture 🔲
Highest revenue impact for clients. After a trial/consultation/viewing is marked complete, automatically follow up:
- **T+24h:** "How was the session? Ready to enrol/book again?"
- **T+3 days:** Gentle nudge if no response
- **T+7 days:** Final follow-up ("we still have a spot")
- Admin can see lead nurture pipeline (pending → followed up → enrolled/closed)
- Requires: Vercel Cron job, `lead_nurture` table, channel-aware message sending (Telegram or web fallback)

### Phase 5 — Payments 🔲
- **PayNow QR generation** — bot sends a QR code for the exact amount after booking
- **Stripe integration** — card payment link for clients without PayNow
- **Monthly fee reminders** — sent on the 1st of each month to enrolled students/members
- **Payment tracking** — admin dashboard shows paid/unpaid per student, overdue alerts after 7 days
- **Deposit collection** — salons vertical already has deposit logic in actions.ts; needs the payment link generation

### Phase 6 — Reminders 🔲
- **Appointment reminders** — 24h before (and 2h before for salons) via Telegram
- **Lesson/class reminders** — "Your P5 Math class is tomorrow at 5pm @ Tampines Hub"
- **Monthly fee reminder** — "Your child's October fees of $320 are due. [PayNow QR]"
- Requires: Vercel Cron (runs daily), check for upcoming bookings, send via stored `telegram_chat_id`

### Phase 7 — Domain-Specific Management 🔲
Per vertical:
- **Tuition:** makeup class booking, progress update routing (parent question → teacher via email)
- **Clinics:** follow-up appointment scheduling, pre-visit form sending
- **Gyms:** class pack tracking, membership renewal reminders
- **Salons:** re-booking reminder 6–8 weeks after last visit, loyalty points display
- **Property:** lead re-engagement after cold period, follow-up viewing booking

### Phase 8 — Broadcast Announcements 🔲
- Admin composes a message in the dashboard
- Send to all active customers (or filter: enrolled only, specific class, etc.)
- Delivered via Telegram to those who've opted in
- Use cases: fee increase notice, new class added, holiday closure, promo offer

### Phase 9 — Lifecycle Automation 🔲
- **Re-enrolment** — 4 weeks before term ends: "Is [child] continuing next term?"
- **Win-back** — customer goes quiet for 60 days → automated re-engagement
- **Exam season outreach** — tuition: "O-Level season coming up — secure a spot now"
- Requires: cron infra from Phase 4, lifecycle state on student/member record

### Phase 10 — Growth 🔲
- **Referral tracking** — "Refer a friend, both get $20 off" — unique referral codes, attribution
- **NPS pulse** — 30 days after enrolment: "How likely are you to recommend us?" (1–10 scale via chat)
- NPS responses visible in admin dashboard with trend chart

### Phase 11 — Analytics 🔲
- **Funnel metrics** — enquiry → trial → enrolled conversion rates per channel (web vs Telegram)
- **Revenue tracking** — monthly recurring revenue per org, churn rate
- **Bot performance** — average response time, escalation rate, booking conversion rate
- **Conversation quality** — intent distribution, unanswered questions (low-confidence replies)
- Requires: stable schema + meaningful data volume from Phases 1–10

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router, TypeScript strict |
| Database | Supabase PostgreSQL + pgvector |
| Auth | Supabase Auth |
| LLM | OpenAI `gpt-4o` (chat) + `text-embedding-3-small` (embeddings) |
| Widget | Vanilla TypeScript + Shadow DOM (zero React) |
| Messaging | Telegram Bot API (done) · WhatsApp Business API (stubbed) |
| Calendar | Google Calendar API v3 |
| Hosting | Vercel (app) + Supabase (DB) |
| Streaming | SSE via `ReadableStream` + `@vercel/functions` `waitUntil` |

---

## Directory Structure

```
AI_LeadCapture/
├── tuition_centres/tuition-chatbot/   # Reference implementation
├── clinics/raffles-medical-chatbot/
├── fnb/din-tai-fung-chatbot/
├── gyms/virgin-active-chatbot/
├── hair_salons/jean-yip-chatbot/
├── property/huttons-chatbot/
└── chatbot_spec_*.pdf                 # Original specs per vertical
```

Each chatbot app follows the same structure:
```
<vertical>/<company>-chatbot/
├── src/
│   ├── app/api/          # Chat, webhooks, auth, integrations
│   ├── app/dashboard/    # Admin dashboard pages
│   ├── app/onboarding/   # 5-step setup wizard
│   ├── lib/chat/         # engine · prompts · rag · intents · actions
│   ├── lib/integrations/ # telegram · google-calendar
│   └── lib/notifications/# admin pings · parent opt-in links
├── widget/src/           # Embeddable widget (vanilla TS)
├── supabase/migrations/  # 001–012 SQL files
├── knowledge_base/       # *.md files for RAG upload
└── .env.example
```

---

## Setup (per vertical)

1. Create a Supabase project
2. Run migrations in order: `supabase db push` or paste `001` → `012` into the SQL editor
3. Copy `.env.example` → `.env.local` and fill in your keys
4. `npm install && npm run dev`
5. Sign up via `/signup/[invite-token]` (generate an invite in Supabase or via the admin panel)
6. Complete the 5-step onboarding wizard
7. Upload documents from `knowledge_base/` via Dashboard → Documents
8. Connect Google Calendar and Telegram in Dashboard → Settings
9. Embed the widget on the client's website with a single script tag

---

## PDPA Compliance (Singapore)

All verticals follow Singapore's Personal Data Protection Act:
- Consent notice displayed before any data is collected
- `STOP` closes the conversation and halts all follow-ups
- No NRIC, credit card numbers, or sensitive medical data stored in chat logs
- Clinics vertical: NRIC collection limited to last 4 characters only (enforced at runtime in `actions.ts`)
- Property vertical: financial documents are NOT collected via the bot
- Auto-delete policy (configurable, default 90 days) — to be implemented in Phase 11
