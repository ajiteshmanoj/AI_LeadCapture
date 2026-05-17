# CLAUDE CODE MASTER PROMPT — FrontDesk AI: The Legendary Lead Capture Platform

## USE GSTACK

This project uses Garry Tan's gstack (github.com/garrytan/gstack). Install it first:
```bash
cd ~ && git clone https://github.com/garrytan/gstack.git
```

Use gstack tools throughout development:
- `/design` before building any UI component — get design review first
- `/design-review` after completing each page — catches visual issues
- `/qa` after each feature — automated quality checks
- `/cso` before any deployment — security review for customer data
- `/autoplan` at the start of each sprint — structured execution plan
- `/review` before merging any feature — eng manager code review

---

## WHAT WE'RE BUILDING

FrontDesk AI is NOT just a chatbot. It's a **complete lead capture and conversion engine** for Singapore SMEs. The chatbot is the brain, but the system has tentacles reaching into every channel where customers exist — Google, Instagram, Facebook, WhatsApp, missed calls, walk-ins, email signatures, QR codes.

**The pitch in one sentence:** "We capture every lead your business touches — from Google to Instagram to missed calls — and convert them into paying customers automatically."

**Product tiers:**

| Tier | Price | What they get |
|---|---|---|
| Starter | $99/mo | AI chatbot (website widget) + admin dashboard + Google Calendar booking |
| Growth | $199/mo | + WhatsApp + Telegram + Instagram DM auto-reply + lead nurture sequences + payment reminders |
| Enterprise | $399/mo | + missed call text-back + Google Review auto-responder + QR codes + multi-location + priority support |

Setup: $0 for first 10 clients (then $499 one-time).

---

## THE PRODUCT — FULL FEATURE MAP

### LAYER 1: The AI Brain (already built — Phases 1-3)
- RAG-powered chat engine (answers from uploaded business documents)
- Domain-specific system prompts per vertical (tuition, salon, clinic, F&B, gym, property)
- Intent classification + action handlers
- Streaming responses via SSE
- Embeddable website widget (Shadow DOM, vanilla TS)
- Admin dashboard (11 pages)
- Google Calendar booking + waitlist management
- Telegram integration
- Multi-tenant, multi-location, invite-only signup
- PDPA compliant

### LAYER 2: The Omni-Channel Tentacles (build next)

**2A. WhatsApp Business API (via Twilio)**
- Incoming messages → same chat engine → instant reply
- Outgoing proactive messages (reminders, follow-ups, payment requests)
- Rich messages with quick reply buttons
- Media handling (acknowledge images, process text)

**2B. Instagram DM Auto-Reply (Meta Messenger API)**
- When someone DMs the business on Instagram, the bot auto-replies
- Handles common questions (pricing, hours, booking)
- Seamless handoff to human if needed
- Links back to the chatbot for full booking flow
- Works with Instagram Stories replies too

**2C. Facebook Messenger Integration**
- Same as Instagram but for Facebook Page messages
- Many SG SMEs still get majority of enquiries here
- Auto-reply + booking + FAQ from the same knowledge base

**2D. Missed Call Text-Back**
- Twilio programmable voice detects unanswered calls to the business number
- Automatically sends SMS within 30 seconds: "Sorry we missed your call! Chat with us instantly: [chatbot link]"
- Tracks: missed call → SMS sent → chatbot conversation → booking conversion
- This alone can capture 20-30 leads per month that would otherwise be lost

**2E. Google Business Profile Integration**
- Auto-respond to Google Q&A questions with accurate answers from the knowledge base
- (Future: respond to Google Reviews with thank-you messages)
- Drives traffic from Google Search directly to the chatbot

**2F. QR Code Generator**
- Branded QR codes generated per business, per location
- Business prints and displays at counter, window, receipts, flyers
- QR → opens chatbot in WhatsApp or web widget
- Tracks scan count per QR code for ROI reporting
- Designs: multiple templates (counter stand, A4 poster, receipt footer, business card)

**2G. Email Signature Widget**
- HTML snippet the business adds to their email signature
- "Got a question? Chat with us instantly →" with branded button
- Links to the chatbot
- Every outgoing email becomes a lead source

**2H. Click-to-Chat Link Generator**
- Short branded links: frontdeskai.sg/chat/[business-slug]
- Business puts in Instagram bio, Carousell listings, Google profile, email signature, flyers
- Opens WhatsApp or web chatbot depending on device
- Tracks clicks per source for ROI

### LAYER 3: The Conversion Engine (post-enquiry automation)

**3A. Lead Nurture Sequences**
- After trial/appointment booking marked complete, auto follow-up:
  - T+24h: "How was the session? Ready to enrol/book again?"
  - T+3 days: Gentle nudge if no response
  - T+7 days: Final follow-up with urgency ("we still have a spot")
- Configurable per vertical (tuition follow-up is different from salon follow-up)
- Admin dashboard shows pipeline: pending → followed up → enrolled/closed

**3B. Payment Reminders**
- Monthly fee reminders sent on billing day via WhatsApp/Telegram
- Include PayNow QR code for instant payment
- Auto follow-up on day 5 if unpaid
- Escalate to admin on day 10
- Dashboard shows: paid, pending, overdue per student/client

**3C. Appointment/Lesson Reminders**
- 24h before: "Reminder: [child name] has [subject] tomorrow at [time] at [location]"
- Option to reply SKIP to cancel and offer makeup booking
- Reduces no-shows by 30-50%

**3D. Re-engagement for Lapsed Customers**
- When a customer is marked as withdrawn/inactive, schedule re-engagement for 2 months later
- "It's been a while! We have new programmes. Want a free refresher session?"
- Warm leads that already know the business — highest conversion rate

**3E. Referral Programme Automation**
- Each enrolled customer gets a unique referral code via the bot
- Share code → new customer gets discount → referrer gets credit
- Bot notifies both parties automatically
- Dashboard shows referral leaderboard

**3F. Satisfaction Pulse**
- Monthly 1-question NPS: "On a scale of 1-5, how satisfied are you?"
- Score 4-5: "Great! Share your referral link: [link]"
- Score 1-3: "Thanks for the feedback. [Contact person] will reach out." → admin alert
- Dashboard shows NPS trend over time

### LAYER 4: The Analytics & ROI Dashboard

**4A. Lead Source Attribution**
- Track where every lead came from: website widget, WhatsApp, Instagram, Facebook, missed call, QR code, email link, referral
- Show conversion rate per channel
- "Your Instagram DM bot converted 12 leads this month. Your QR code at the counter brought in 8."
- This is what makes the $199-399/mo feel like a steal — the client can SEE the ROI

**4B. Conversation Analytics**
- Total conversations per day/week/month
- Top asked questions (clustered by intent)
- Average response time
- Bot vs human handled ratio
- Busiest hours

**4C. Revenue Attribution**
- Connect lead → trial → enrolment → monthly payments
- "FrontDesk AI generated $4,200 in new enrolments this month"
- Compare cost of FrontDesk AI ($199/mo) vs revenue generated
- This single metric is what prevents churn — clients see clear positive ROI

**4D. Channel Performance Comparison**
- Side-by-side: Website vs WhatsApp vs Instagram vs Facebook vs QR vs Missed Call
- Which channel generates the most leads? Best conversion rate? Lowest cost per lead?
- Helps the business owner double down on what works

---

## LANDING PAGE SPECIFICATION

(See claude_code_prompt_landing_page.md for the detailed spec. Key additions below.)

### New sections to add to the landing page:

**"Not just a chatbot" section:**
Visual showing the 8 tentacles — website, WhatsApp, Instagram, Facebook, missed calls, QR codes, email, referrals — all feeding into one central brain. Animate each tentacle lighting up as the user scrolls.

**Channel comparison grid:**
Show all 8 channels with icons. For each: "How many leads you're losing" vs "How FrontDesk AI captures them."

**ROI Calculator:**
Interactive widget:
- Input: "How many enquiries do you get per week?"
- Input: "How many do you miss or reply late?"
- Output: "You're losing approximately $X,XXX per month in missed leads. FrontDesk AI costs $199/mo."

**Live demo section (enhanced):**
Instead of just the chatbot widget, show a mock dashboard with:
- A simulated WhatsApp conversation
- A simulated Instagram DM
- A missed call → text-back flow
- All feeding into the same conversation log
- "All from one dashboard. All automated."

---

## TECH STACK

- **Frontend (Landing + Dashboard):** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, Framer Motion
- **Backend:** Next.js API routes on Vercel
- **Database:** Supabase (PostgreSQL + pgvector + Auth + RLS + Realtime)
- **LLM:** OpenAI GPT-4o (chat) + text-embedding-3-small (embeddings)
- **WhatsApp:** Twilio WhatsApp Business API
- **Instagram/Facebook:** Meta Messenger Platform API
- **Missed Calls:** Twilio Programmable Voice + SMS
- **Payments:** Stripe + PayNow QR generation
- **Calendar:** Google Calendar API (OAuth per org)
- **QR Codes:** qrcode npm package with custom branding
- **Email:** SendGrid for transactional emails
- **Deployment:** Vercel (frontend + API), Supabase (DB)
- **Cron Jobs:** Vercel Cron for reminders, follow-ups, payment nudges

---

## DATABASE ADDITIONS

```sql
-- Lead source tracking
create table lead_sources (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  conversation_id uuid references conversations(id),
  source text not null, -- 'website', 'whatsapp', 'instagram', 'facebook', 'missed_call', 'qr_code', 'email_link', 'referral'
  source_detail text, -- e.g., 'qr_code_jurong_counter', 'instagram_story_reply'
  utm_campaign text,
  created_at timestamptz default now()
);

-- Lead nurture sequences
create table lead_nurture (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  booking_id uuid references bookings(id),
  student_id uuid references students(id),
  conversation_id uuid references conversations(id),
  channel text not null, -- 'whatsapp', 'telegram', 'web'
  step integer default 0,
  next_followup_at timestamptz,
  status text default 'active', -- 'active', 'enrolled', 'closed', 'paused'
  created_at timestamptz default now()
);

-- Payment reminders
create table payment_reminders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  student_id uuid references students(id),
  month_for text not null,
  amount decimal(10,2) not null,
  reminder_count integer default 0,
  last_reminded_at timestamptz,
  status text default 'pending', -- 'pending', 'reminded', 'paid', 'overdue', 'escalated'
  paid_at timestamptz,
  created_at timestamptz default now()
);

-- Missed calls log
create table missed_calls (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  caller_phone text not null,
  textback_sent boolean default false,
  textback_sent_at timestamptz,
  conversation_started boolean default false,
  conversation_id uuid references conversations(id),
  created_at timestamptz default now()
);

-- QR codes
create table qr_codes (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  location_id uuid references locations(id),
  label text not null, -- 'counter_stand', 'window_poster', 'receipt'
  short_url text not null,
  scan_count integer default 0,
  created_at timestamptz default now()
);

-- Referrals
create table referrals (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  referrer_student_id uuid references students(id),
  referee_student_id uuid references students(id),
  referral_code text unique not null,
  status text default 'pending', -- 'pending', 'enrolled', 'rewarded'
  created_at timestamptz default now()
);

-- Satisfaction pulse
create table satisfaction_pulses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  student_id uuid references students(id),
  score integer check (score between 1 and 5),
  comment text,
  month_for text not null,
  created_at timestamptz default now()
);

-- Channel analytics (materialized daily)
create table channel_analytics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id) on delete cascade,
  date date not null,
  channel text not null,
  conversations_started integer default 0,
  leads_captured integer default 0,
  bookings_made integer default 0,
  enrollments integer default 0,
  revenue_attributed decimal(10,2) default 0,
  created_at timestamptz default now()
);
```

---

## BUILD ORDER

### Sprint 1 (Week 1): Landing Page
Use gstack's `/design` and `/design-review` throughout.
1. Set up Next.js landing site (separate from the chatbot app)
2. Build homepage with all sections (hero, animated chat, problem/solution, industries, stats, features, comparison, pricing, CTA)
3. Build demo hub + individual demo pages with live widget embedding
4. Build pricing, how-it-works, contact pages
5. Framer Motion animations, responsive pass, Lighthouse optimization
6. Deploy to Vercel
7. `/qa` full site review

### Sprint 2 (Week 2): WhatsApp + Instagram
8. Twilio WhatsApp Business API integration
9. Meta Messenger API for Instagram DM auto-reply
10. Unified inbox in admin dashboard (all channels in one view)
11. Test end-to-end: message on WhatsApp → bot replies → books appointment → calendar invite

### Sprint 3 (Week 3): Proactive Lead Capture
12. Missed call text-back (Twilio Voice + SMS)
13. QR code generator with branded templates
14. Click-to-chat link generator with tracking
15. Email signature widget generator
16. Lead source attribution tracking

### Sprint 4 (Week 4): Conversion Engine
17. Lead nurture sequences (Vercel Cron + channel-aware messaging)
18. Payment reminders with PayNow QR
19. Appointment/lesson reminders
20. Referral programme automation

### Sprint 5 (Week 5): Analytics & Polish
21. Lead source attribution dashboard
22. Channel performance comparison charts
23. ROI calculator (revenue attributed vs FrontDesk AI cost)
24. Conversation analytics (top questions, busiest hours, bot vs human ratio)
25. Final `/qa` and `/cso` reviews

---

## THE IRRESISTIBLE OUTREACH STRATEGY

When you contact a potential client, don't just send a message. Send them a **personalized package:**

1. **Scrape their website** (use gstack's `/scrape`) to understand their business
2. **Build a working demo chatbot** trained on their actual data (takes 2-3 hours)
3. **Record a 60-second screen recording** showing the bot answering questions about THEIR business
4. **Generate a QR code** branded with their logo
5. **Calculate their missed lead cost:** "Based on your Google reviews, you get ~50 enquiries/month. If you miss 30% after hours, that's 15 lost leads × $300 average customer value = $4,500/month in missed revenue. FrontDesk AI costs $199/month."

**The DM:**
"Hey [name], I built an AI assistant for [business name] that answers customer questions and books appointments 24/7. Here's a 60-second demo using your actual business data: [link]. It already knows your pricing, services, and locations. Free for 2 weeks — want me to put it live on your website?"

Nobody says no to that. You've already done the work. They just have to say yes.
