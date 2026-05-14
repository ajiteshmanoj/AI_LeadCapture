# Feature Roadmap — Parent-Facing Value-Add Features

This document outlines features to add to the tuition centre chatbot beyond the current MVP (FAQ + trial booking + waitlist). Every feature here is **parent-facing** — things that make parents' lives easier and make the centre look professional. These are NOT operations/admin features (that's what Tutorbase/Edulabs do). Our lane is the **front door** — everything between a parent's first enquiry and their ongoing relationship with the centre.

Prioritised by revenue impact to the centre owner (what makes them want to keep paying us $100/month).

---

## Current State (already built)

- [x] RAG-powered FAQ from uploaded documents
- [x] Trial class booking with Google Calendar integration (parent gets calendar invite)
- [x] Waitlist management when classes are full
- [x] Embeddable website widget (vanilla JS, Shadow DOM)
- [x] Admin dashboard (conversations, classes, centres, documents, FAQs, settings, branding)
- [x] Multi-location support (per-centre branches, classes + bookings linked to location)
- [x] Telegram channel — parents can chat with the bot via the centre's Telegram bot
- [x] Admin Telegram notifications — receptionist pinged on new bookings, waitlist entries, escalations
- [x] Escalation + human takeover — receptionist takes over any conversation from the dashboard, replies go back to parent via the same channel, Realtime live updates in the conversation viewer
- [x] Parent Telegram opt-in deep link — web-channel bookers can tap a link to connect their Telegram for future reminders
- [x] Self-serve onboarding — invite-only signup flow, 5-step wizard, per-org branding (logo + colour palette)

---

## Known Gaps (built but incomplete)

### Web widget ↔ Dashboard — two-way Realtime for admin takeover

**What's missing:** When a receptionist takes over a conversation and types a reply in the dashboard, the parent on the **web widget** does not receive it automatically. The reply is saved to the database but the widget has no push channel — the parent only sees it if they send another message.

**This does not affect Telegram.** Telegram takeovers are fully two-way — the receptionist's reply goes through the bot back to the parent in real time.

**Why it matters:** If a parent escalates from the centre's website (web widget embedded on their site), the receptionist can see the conversation live in the dashboard but their reply is invisible to the parent until the parent sends another message.

**Fix:** Add a Supabase Realtime subscription to the web widget so it receives pushed messages from the DB. The widget already uses Shadow DOM + vanilla TS. Estimated ~half a day of work.

**Priority:** Low until a paying client has an active website with the widget embedded. Telegram covers the real-time two-way channel for now.

---

## TIER 1 — Revenue Drivers (build these first)

These features directly put money in the centre's pocket. They're the difference between "nice chatbot" and "I can't run my centre without this."

### 1.1 Post-Trial Lead Nurture (auto follow-up)

**Why it matters:** Most centres lose 50-70% of trial students because nobody follows up. The owner is too busy, the admin forgets. Every converted trial = $300-400/month recurring revenue for the centre.

**How it works:**
- After a trial booking is marked as `completed` in the dashboard, trigger an automated follow-up sequence via the chatbot (WhatsApp/Telegram/web — whichever channel the parent used)
- **T+24 hours:** "Hi [parent name]! How was [child name]'s [subject] trial yesterday? We'd love to have them join the regular class. Would you like to enrol?"
- **T+3 days (if no response):** "Just checking in — we still have a spot in [day] [subject] class for [child name]. Let me know if you have any questions!"
- **T+7 days (if still no response):** "Hi [parent name], wanted to let you know we're running low on spots for [subject]. No pressure at all — just didn't want [child name] to miss out if they enjoyed the trial. Feel free to reach out anytime!"
- If parent responds at any point, resume normal chatbot conversation
- If parent says "not interested" or "no thanks", mark lead as `closed` and stop sequence
- Admin dashboard shows: lead nurture pipeline view (trial → follow-up 1 → follow-up 2 → enrolled / closed)

**Database changes:**
```sql
-- Add to bookings or create new table
create table lead_nurture (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id),
  booking_id uuid references bookings(id),
  student_id uuid references students(id),
  conversation_id uuid references conversations(id),
  step integer default 0, -- 0=pending, 1=first followup, 2=second, 3=third
  next_followup_at timestamptz,
  status text default 'active', -- 'active', 'enrolled', 'closed', 'paused'
  created_at timestamptz default now()
);
```

**Implementation:**
- Vercel Cron job runs every hour, checks for nurture entries where `next_followup_at <= now()` and `status = 'active'`
- Sends message via the original channel (WhatsApp/Telegram/web)
- Admin can pause/resume nurture per student from dashboard

---

### 1.2 Monthly Payment Reminders

**Why it matters:** Chasing payments is the #1 most hated task for centre owners. It's awkward, time-consuming, and parents ghost. Automating this via the chatbot (a "system" message, not the owner personally asking) removes the awkwardness entirely.

**How it works:**
- Admin sets billing day in settings (default: 1st of month)
- On billing day, bot sends each enrolled parent a payment reminder via their preferred channel:
  - "Hi [parent name]! [Child name]'s [month] tuition fee of $[amount] is now due. You can pay via: \n• PayNow: [QR code / UEN] \n• Bank transfer: [details] \nReply PAID once done, and we'll update your records!"
- **Day 5 (if not marked paid):** "Friendly reminder — [child name]'s [month] fee of $[amount] is still outstanding. Please arrange payment at your convenience. Any questions? Just ask!"
- **Day 10 (if still unpaid):** Escalate to admin via dashboard notification + Telegram alert. Bot does NOT send a 3rd reminder to parent (avoids being aggressive).
- When parent replies "PAID" or "paid", bot responds: "Thanks! We'll verify and update your records. Have a great day!"
- Admin marks payment as received in dashboard

**Database changes:**
```sql
-- Add payment_reminders tracking
create table payment_reminders (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id),
  student_id uuid references students(id),
  month_for text not null, -- '2026-06'
  amount decimal(10,2) not null,
  reminder_count integer default 0,
  last_reminded_at timestamptz,
  status text default 'pending', -- 'pending', 'reminded', 'paid', 'overdue', 'escalated'
  paid_at timestamptz,
  created_at timestamptz default now()
);
```

**Requires:** WhatsApp/Telegram integration (Phase 3) for full value. Can work on web widget but much less effective since parents don't keep the website open.

---

### 1.3 PayNow QR Code Generation

**Why it matters:** PayNow is the dominant payment method for SG tuition centres. Parents want to scan and pay, not type bank account numbers.

**How it works:**
- Centre admin enters their PayNow UEN or phone number in settings
- Bot generates a PayNow-compatible QR code on the fly when payment is discussed
- QR code sent as an image in the chat (WhatsApp/Telegram) or displayed inline in web widget
- Use the SGQR standard (EMVCO QR format)

**Implementation:**
- Use `qrcode` npm package to generate QR
- PayNow QR payload format: follows EMVCo Merchant Presented Mode with SG-specific fields (Proxy Type 0=phone, 2=UEN; Proxy Value; Amount; Reference)
- Generate and return as base64 image

---

## TIER 2 — Retention & Experience (build after Tier 1)

These make parents feel the centre is professional and well-run. They reduce churn and increase word-of-mouth referrals.

### 2.1 Lesson Reminders

**Why it matters:** No-shows waste the teacher's time and the seat. A simple reminder 24 hours before class reduces no-shows by 30-50%.

**How it works:**
- Cron job checks tomorrow's classes
- Send reminder to each enrolled parent: "Reminder: [child name] has [subject] tomorrow, [day] [time] at [centre name, address]. See you there!"
- Include a quick action: "Reply SKIP if [child name] can't make it, and we'll note the absence."
- If parent replies SKIP → mark attendance as `absent_notified`, optionally offer makeup booking

**Database changes:**
```sql
-- Attendance tracking
create table attendance (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id),
  class_id uuid references classes(id),
  student_id uuid references students(id),
  lesson_date date not null,
  status text default 'expected', -- 'expected', 'present', 'absent', 'absent_notified', 'makeup'
  marked_by text, -- 'teacher', 'system', 'parent'
  created_at timestamptz default now()
);
```

---

### 2.2 Makeup Class Booking

**Why it matters:** "Can we reschedule?" is one of the top 5 most common parent messages. Currently requires 10+ WhatsApp messages. Bot does it in 3 exchanges.

**How it works:**
- Parent: "Ryan can't make it this Saturday"
- Bot: "No problem! I can help arrange a makeup class for Ryan's Sec 2 Math. We have these slots available: \n1. Wednesday 6-8pm at Jurong East \n2. Thursday 4-6pm at Jurong East \nWhich works?"
- Parent: "Wednesday"
- Bot: "Done! Ryan's makeup class is booked for Wednesday 6-8pm at Jurong East. I've sent a calendar invite to your email."
- Creates Google Calendar event, marks original lesson as `absent_notified`, creates makeup booking

**Rules engine (configurable per centre):**
- Max makeup classes per month/term (e.g., 2 per term)
- Minimum notice period (e.g., 24 hours before class)
- Makeup must be same subject (can be different level slot if space allows)
- Admin can override rules from dashboard

---

### 2.3 Progress Check-In Routing

**Why it matters:** Parents constantly ask "how is my child doing?" — the bot can't answer this, but it can make the process smooth instead of ad-hoc.

**How it works:**
- Parent: "How is Ryan doing in Math?"
- Bot: "I'll pass your question to Mr Kevin, Ryan's Math teacher. Is there anything specific you'd like to know — homework, exam preparation, or general progress?"
- Parent: "His exam is next month, want to know if he's on track"
- Bot: "Got it! I've sent your question to Mr Kevin. You should hear back within 24 hours. Is there anything else I can help with?"
- System sends structured notification to teacher (via dashboard + Telegram):
  - Parent: Mrs Tan
  - Student: Ryan (Sec 2 A-Math, Saturday 10am)
  - Question: "Exam next month — is Ryan on track?"
  - Channel: WhatsApp
- Teacher replies via dashboard → response sent back to parent through bot

**Database changes:**
```sql
create table progress_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references organisations(id),
  student_id uuid references students(id),
  parent_question text not null,
  teacher_name text,
  teacher_response text,
  conversation_id uuid references conversations(id),
  status text default 'pending', -- 'pending', 'responded', 'closed'
  requested_at timestamptz default now(),
  responded_at timestamptz
);
```

---

### 2.4 Announcement Broadcasts

**Why it matters:** Centre needs to notify parents about schedule changes, holiday closures, crash courses, or events. Currently done by manually messaging each parent on WhatsApp.

**How it works:**
- Admin types announcement in dashboard, selects audience (all parents / specific class / specific level / specific centre)
- Bot sends message to all selected parents via their preferred channel
- Parents can reply with questions → bot handles or routes to admin
- Dashboard shows: delivery status, read receipts (where available), parent responses

**Implementation:**
- Dashboard UI: text field + audience selector + schedule (send now / schedule for later)
- Backend: queue messages, send in batches (respect WhatsApp rate limits)
- Track delivery per parent

---

## TIER 3 — Differentiation (build when core is solid)

These are the features that make centre owners say "wow, I've never seen this before." They differentiate you from any other chatbot provider.

### 3.1 Smart Re-Enrolment for Lapsed Students

**Why it matters:** Students who withdrew 3-6 months ago are warm leads. They already know the centre. A well-timed message can bring them back.

**How it works:**
- When a student is marked as `withdrawn`, schedule a re-engagement message for 2 months later
- "Hi [parent name]! It's been a while since [child name] was with us at [centre]. We have some new programmes and crash courses coming up — would [child name] be interested in a free refresher session?"
- If parent engages, route to normal booking flow
- Admin can enable/disable per student, customise timing

---

### 3.2 Exam Season Proactive Outreach

**Why it matters:** Before PSLE (Oct), O-Levels (June-Nov), A-Levels (Oct-Nov), parents actively seek tuition. This is the highest conversion window of the year.

**How it works:**
- Based on the MOE exam calendar, trigger outreach to leads who enquired but didn't enrol
- "Hi [parent name]! With [exam] coming up in [X weeks], many parents are signing up for intensive revision classes. We still have spots for [subject]. Would [child name] like to join?"
- Also broadcast to existing parents about crash courses and intensive revision programmes

---

### 3.3 Referral Programme Automation

**Why it matters:** Word of mouth is the #1 source of new students for SG tuition centres. Making referrals frictionless increases them.

**How it works:**
- Each enrolled parent gets a unique referral link/code via the bot
- "Know someone who'd benefit from tuition at [centre]? Share your referral code [CODE] — they'll get $30 off their first month, and you'll get $30 off too!"
- When a new parent signs up with the code, both parties are credited automatically
- Bot notifies both parents of the reward
- Admin dashboard shows: referral leaderboard, total referrals, conversion rate

---

### 3.4 Parent Satisfaction Pulse

**Why it matters:** Centres lose students silently — by the time a parent withdraws, it's too late. A monthly check-in catches issues early.

**How it works:**
- Once a month, bot sends a 1-question pulse: "On a scale of 1-5, how satisfied are you with [child name]'s progress at [centre] this month?"
- If 4-5: "Great to hear! If you know anyone who'd benefit, feel free to share our referral link: [link]"
- If 1-3: "Thank you for the honest feedback. I'll have [contact person] reach out to discuss how we can improve. Is there anything specific you'd like to share?"
- Low scores trigger admin alert immediately
- Dashboard shows: NPS trend over time, flagged parents, comments

---

## Build Order — Integrated Phase Plan (LOCKED)

The original spec defined Phases 1–4. This roadmap extends that with a richer
post-onboarding lifecycle, restructured into **11 phases**. Phases 1–2 are done;
Phase 3 (messaging) is the universal prerequisite for everything that follows.
Each tier feature below is tagged with its phase number for cross-reference.

| Phase | Theme | Features | Status |
|-------|-------|----------|--------|
| 1 | **MVP** | Chat + RAG + embeddable widget + admin dashboard | ✅ Done |
| 2 | **Booking + Calendar + Locations** | Trial booking, Google Calendar with parent invite, waitlist, multi-branch (`locations`) | ✅ Done |
| 3 | **Messaging channels** | WhatsApp (Twilio) + Telegram + unified inbox + Supabase Realtime | Next |
| 4 | **Lead Nurture** | Tier 1.1: post-trial T+24h / T+3d / T+7d follow-ups, cron infra, pipeline view | Pending |
| 5 | **Payments** | Tier 1.3 PayNow QR + Stripe links + payment tracking + reconciliation | Pending |
| 6 | **Reminders** | Tier 1.2 monthly fee reminders + Tier 2.1 lesson reminders | Pending |
| 7 | **Class management** | Tier 2.2 makeup class booking + Tier 2.3 progress check-in routing | Pending |
| 8 | **Broadcasts** | Tier 2.4 announcement broadcasts with audience segmentation | Pending |
| 9 | **Lifecycle** | Tier 3.1 lapsed-student re-enrolment + Tier 3.2 exam-season outreach (MOE calendar–driven) | Pending |
| 10 | **Growth** | Tier 3.3 referral programme + Tier 3.4 satisfaction pulse (NPS) | Pending |
| 11 | **Analytics** | Funnel (enquiry → trial → enrol → retain → referral) + per-feature metrics + revenue lifecycle dashboard | Pending |

### Two non-obvious calls in this ordering

1. **Lead Nurture is Phase 4 — *before* Payments.** Highest revenue-impact per
   week of dev work (recovering 50–70% of trial drop-off is hundreds of dollars
   of recurring revenue per centre per month), and it forces us to build the
   **cron infrastructure** that Phases 5–10 all reuse. Building Payments first
   means retrofitting cron later — strictly worse.

2. **Analytics drops to Phase 11 (last).** It's only useful once enough activity
   exists to measure, and its schema depends on what's been built by then.
   Shipping it earlier guarantees a rewrite.

### Realistic sprint estimates (single-dev pace)

| Phase | Estimate | Notes |
|-------|----------|-------|
| 3 | 1.5–2 weeks | Telegram first (~2 days), WhatsApp Business + Twilio sandbox eats the rest |
| 4 | 1 week | Cron + 3-step sequence + dashboard pipeline view |
| 5 | 1 week | PayNow QR ~1 day; Stripe + reconciliation the rest |
| 6 | 0.5 week | Two cron jobs riding existing infra |
| 7 | 1.5 weeks | Makeup is rules-engine work; progress routing is teacher dashboard |
| 8 | 0.5 week | UI + queue + rate-limit handling |
| 9 | 1 week | Re-enrol cron + MOE calendar data import |
| 10 | 1 week | Referral codes + tracking + monthly NPS cron |
| 11 | 1.5 weeks | Funnel queries + dashboard pages |

**Total ~9–10 weeks** to ship Phases 3–11.

- **Growth tier ($150/mo)** sellable end of Phase 6 (~4 weeks in).
- **Pro tier ($250/mo)** sellable end of Phase 10 (~8 weeks in).

### Phase 3 — start with Telegram, not WhatsApp

Telegram has zero approval friction — a real bot can answer parents end-to-end
in a day. WhatsApp Business needs Twilio sandbox setup + eventual Meta business
verification (paperwork, not code). Building Telegram first also de-risks the
channel-abstraction layer; once that's clean, WhatsApp slots in via the same
interface in 2–3 days.

---

## Pricing Model Update

With these features, the pricing can be restructured:

| Tier | Monthly | What's Included |
|------|---------|-----------------|
| **Starter** | $80/mo | FAQ chatbot + trial booking + web widget |
| **Growth** | $150/mo | + WhatsApp/Telegram + lead nurture + payment reminders + lesson reminders |
| **Pro** | $250/mo | + makeup booking + progress routing + broadcasts + referral system + satisfaction pulse |

Setup fee: $400-600 (one-time, covers onboarding + document upload + customisation)

The Growth tier is the sweet spot — it's where the revenue-driving features live. Most centres should land here.

---

## Key Insight

The chatbot is NOT just a FAQ bot. It's a **parent relationship engine** that handles the entire lifecycle:

```
Discovery → Enquiry → Trial → Follow-up → Enrolment → Payment → Attendance → Progress → Retention → Referral
     │          │        │         │            │           │          │           │          │          │
     └── SEO    └── Bot  └── Bot   └── Bot      └── Bot     └── Bot    └── Bot     └── Bot    └── Bot    └── Bot
```

Every step in that chain is currently handled manually by one overworked admin person or the centre owner themselves. We automate the entire thing.
