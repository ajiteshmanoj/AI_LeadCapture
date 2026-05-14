# AI Chatbot Platform — Master Project Guide

This file is auto-loaded by Claude Code in every session. It is the single source of truth for what this project is, what's been built, and how to work on it.

---

## What this is

A **productised AI chatbot SaaS for Singapore SMEs**, sold as a white-label front-desk automation tool. One codebase per vertical, each forked from the tuition-centre reference implementation. Six verticals exist today:

| Vertical | Target Client | Bot | Colour | Path |
|---|---|---|---|---|
| **Tuition** | Zenith Education Studio | Assistant | `#1a1a2e` | `tuition_centres/tuition-chatbot/` |
| **Clinics** | Raffles Medical Group | Priya | `#003087` | `clinics/raffles-medical-chatbot/` |
| **F&B** | Din Tai Fung Singapore | Mei | `#8B0000` | `fnb/din-tai-fung-chatbot/` |
| **Gyms** | Virgin Active Singapore | Alex | `#E3000F` | `gyms/virgin-active-chatbot/` |
| **Salons** | Jean Yip Group | Fiona | `#C9A96E` | `hair_salons/jean-yip-chatbot/` |
| **Property** | Huttons Asia | James | `#1A3C5E` | `property/huttons-chatbot/` |

**Pricing**: $400–600 setup + $80–120/month. WhatsApp add-on +$150–200. Payment collection +$100–150.

---

## Repository layout

```
AI_Chatbot/
├── tuition_centres/tuition-chatbot/    # Reference implementation (most mature)
├── clinics/raffles-medical-chatbot/
├── fnb/din-tai-fung-chatbot/
├── gyms/virgin-active-chatbot/
├── hair_salons/jean-yip-chatbot/
├── property/huttons-chatbot/
├── chatbot_spec_*.pdf                  # Original specs per vertical
└── CLAUDE.md                           # This file
```

Each vertical is a standalone Next.js 14 app with its own Supabase project, migrations, and knowledge base. They share the same architecture but differ in domain terminology, system prompt, actions, and seed data.

---

## Tech stack (all verticals)

| Layer | Choice |
|---|---|
| Framework | Next.js 14 App Router, TypeScript strict |
| UI | Tailwind CSS + Radix UI primitives |
| Database | Supabase PostgreSQL + pgvector |
| Auth | Supabase Auth |
| LLM | OpenAI `gpt-4o` (chat) + `text-embedding-3-small` (embeddings) |
| Widget | Vanilla TS + Shadow DOM (no React) |
| Messaging | Telegram (done) · WhatsApp (stubbed) |
| Calendar | Google Calendar API v3 |
| Hosting | Vercel (app) + Supabase (DB) |

---

## What's built across all verticals (Phases 1–3 ✅)

### Phase 1 — MVP
- RAG chat from uploaded documents (pgvector, k=8, threshold 0.3)
- Domain-specific system prompt per vertical (tone, rules, scope guard)
- Intent classifier + heuristic FAQ matcher
- Embeddable website widget (vanilla TS, Shadow DOM, PDPA disclaimer, mobile-responsive)
- Admin dashboard: conversations, service/class management, locations/branches, documents, FAQs, settings, branding (logo + colour palette)
- Invite-only signup + 5-step onboarding wizard per vertical
- Multi-tenant by `org_id` with RLS

### Phase 2 — Booking + Calendar
- Per-org Google Calendar OAuth (refresh token stored on `organisations`)
- Full booking flow: bot collects details one field at a time, confirms, then:
  1. Creates calendar event (timezone Asia/Singapore)
  2. Adds contact as attendee — Google sends one-tap invite email
  3. Writes booking row to DB with `google_calendar_event_id`
- Cancelling a booking from the dashboard deletes the calendar event
- Waitlist when at capacity — position tracked, admin can open slots
- Multi-branch support (`locations` table, classes and bookings linked to location)

### Phase 3 — Telegram messaging
- Per-org Telegram bot (token + webhook secret stored on `organisations`)
- Inbound webhook at `/api/webhooks/telegram/[orgSlug]` — secret-validated
- `/start` command + `/linkadmin` for receptionist onboarding
- Admin Telegram notifications on new bookings, waitlist entries, escalations
- Admin takeover: receptionist types reply in dashboard → delivered to contact via their channel
- Contact deep-link to opt into Telegram for reminders (web-channel bookers)
- Channel abstraction in `src/lib/chat/channels.ts` — same `handleChat` powers web + Telegram + (WhatsApp when wired)

---

## Domain action tags (per vertical)

Each vertical's LLM outputs structured action tags that `actions.ts` parses and executes:

| Vertical | Book | Secondary |
|---|---|---|
| Tuition | `[BOOK_TRIAL]` | `[ADD_TO_WAITLIST]`, `[SEND_PAYMENT_LINK]` |
| Clinics | `[BOOK_APPOINTMENT]` | `[SEND_CLINIC_FORM]`, `[ESCALATE_TO_NURSE]` |
| F&B | `[BOOK_TABLE]` | `[SEND_CATERING_ENQUIRY]`, `[CHECK_AVAILABILITY]` |
| Gyms | `[BOOK_TRIAL_CLASS]` | `[JOIN_WAITLIST]`, `[ENQUIRE_MEMBERSHIP]` |
| Salons | `[BOOK_APPOINTMENT]` | `[COLLECT_DEPOSIT]`, `[RESCHEDULE]` |
| Property | `[BOOK_VIEWING]` | `[QUALIFY_LEAD]`, `[ALERT_AGENT]` |

---

## DB schema — shared baseline + vertical extensions

All verticals inherit migrations `001–010` (core schema: organisations, classes, students, bookings, waitlist, locations, documents, conversations, messages, faqs, RLS, onboarding). Each vertical adds:

| Vertical | Migration 011 | Migration 012 | New Tables |
|---|---|---|---|
| Clinics | Clinic columns on classes/students/bookings | Raffles Medical seed | — |
| F&B | F&B columns + pax/dietary on students | Din Tai Fung seed | `menu_items` |
| Gyms | Fitness columns on classes/students | Virgin Active seed | `membership_tiers` |
| Salons | Service/deposit columns on classes | Jean Yip seed | `stylists` |
| Property | Property columns on classes/students | Huttons seed | `property_listings` |

**Column naming rule**: DB column names are NEVER renamed across verticals — only UI display labels change. `parent_phone`, `subject`, `level`, `teacher_name`, `monthly_fee` stay as-is in all query code.

---

## Vertical-specific business rules

### Clinics (Raffles Medical)
- **NRIC**: collect last 4 characters ONLY. Runtime check in `actions.ts` rejects full 9-char NRIC (`/^[STFGM]\d{7}[A-Z]$/i`). PDPA compliance — non-negotiable.
- **Medical scope**: bot NEVER diagnoses. "chest pain / difficulty breathing / stroke" → "Call 995 immediately" — no booking.
- Medisave eligibility shown per appointment type.

### F&B (Din Tai Fung)
- **Halal**: Din Tai Fung Singapore is NOT Halal-certified. Pork used in kitchen. Bot must proactively disclose when dietary restrictions are mentioned.
- Vegetarian options available but prepared in a shared kitchen.
- `level` column repurposed to store max pax as text (backward compat). `max_pax` column also set.

### Gyms (Virgin Active)
- Trial-first policy: always offer free trial class before discussing membership pricing.
- Membership freeze ($20/month) — route actual freeze requests to staff via email, not through bot.

### Salons (Jean Yip)
- **Deposit**: services >$100 OR >2 hours require 30% deposit. Auto-appended by `actions.ts` when `class.requires_deposit = true`.
- Cancellation <24 hours → deposit forfeited. Bot mentions this at every booking.
- Stylist tiers: Junior / Stylist / Senior / Principal / Creative Director — prices vary by tier.

### Property (Huttons)
- **ABSD first**: always ask citizenship status before quoting residential property price. SC/PR/Foreigner pay 0%/5%/60% ABSD.
- Lead qualification (hot/warm/cold) before booking viewing. Hot leads get `🔥 HOT LEAD` prefix on Telegram alert.
- `waitlist` table not used — pipeline tracked via `bookings.status = 'pending'`.
- Two loaders in `rag.ts`: `loadActiveClasses` (viewing slots) + `loadActiveListings` (from `property_listings`).

---

## Widget identifiers (prevent localStorage collision)

| Vertical | JS Guard Variable | localStorage Key |
|---|---|---|
| Tuition | `__TUITION_CHATBOT_LOADED` | `tcw_conversation_id` |
| Clinics | `__CLINIC_CHATBOT_LOADED` | `rmg_conversation_id` |
| F&B | `__FNB_CHATBOT_LOADED` | `dtf_conversation_id` |
| Gyms | `__GYM_CHATBOT_LOADED` | `vag_conversation_id` |
| Salons | `__SALON_CHATBOT_LOADED` | `jyg_conversation_id` |
| Property | `__PROPERTY_CHATBOT_LOADED` | `htg_conversation_id` |

---

## Admin notification headers

| Vertical | Booking | Escalation |
|---|---|---|
| Tuition | `📚 *New trial booking*` | `🚨 *Parent escalation*` |
| Clinics | `📋 *New appointment booked*` | `🚨 *Patient escalation*` |
| F&B | `🍽️ *New reservation confirmed*` | — |
| Gyms | `💪 *New trial class booking*` | — |
| Salons | `✂️ *New appointment booked*` | — |
| Property | `🏠 *New viewing request*` / `🔥 HOT LEAD — New viewing request` | — |

---

## Knowledge base (RAG documents per vertical)

Each vertical has `knowledge_base/*.md` files that are uploaded via `/api/documents` and indexed into `document_chunks` (pgvector). Files per vertical:

| Vertical | Files | Key Content |
|---|---|---|
| Tuition | 5 PDFs (uploaded to Supabase) | Fee schedule, timetable, policies, teacher profiles, FAQ |
| Clinics | 6 `.md` files | Services, fees+insurance (Medisave/CHAS), policies (NRIC), FAQ |
| F&B | 5 `.md` files | Menu (with Halal status + dietary tags), outlets+hours, reservations policy, FAQ |
| Gyms | 5 `.md` files | Class timetable, clubs+facilities, membership tiers, FAQ |
| Salons | 6 `.md` files | Services+pricing by hair length, stylist tiers, policies+deposit, FAQ |
| Property | 6 `.md` files | New launches, HDB resale guide, private resale+stamp duty, FAQ |

---

## Phase roadmap (all verticals share the same 11-phase plan)

| # | Phase | Tuition | Others |
|---|---|---|---|
| 1 | MVP (chat + RAG + widget + dashboard) | ✅ | ✅ |
| 2 | Booking + Calendar + Waitlist + Locations | ✅ | ✅ |
| 3 | Telegram messaging + admin takeover | 🟡 Telegram ✅ WhatsApp pending | 🟡 Same |
| 4 | Lead nurture (post-booking follow-up sequences + cron) | pending | pending |
| 5 | Payments (PayNow QR + Stripe) | pending | pending |
| 6 | Reminders (appointment / lesson / fee reminders) | pending | pending |
| 7 | Domain-specific management (makeup class / rescheduling / lead re-engagement) | pending | pending |
| 8 | Announcement broadcasts | pending | pending |
| 9 | Lifecycle (re-enrolment / re-engagement outreach) | pending | pending |
| 10 | Growth (referrals + NPS pulse) | pending | pending |
| 11 | Analytics (funnel + lifecycle metrics) | pending | pending |

**Phase 4 before Payments** — highest revenue impact, and the cron infrastructure it builds is reused by Phases 5–10.
**Analytics last** — depends on stable schema and meaningful data volume.

---

## Conventions (all verticals)

- **TypeScript strict.** No `any`. Server routes use `runtime = 'nodejs'`.
- **Multi-tenant by `org_id`.** RLS via `is_org_member()`. Chat traffic bypasses RLS with the service-role key.
- **OpenAI only.** `gpt-4o` for chat (temp 0.7, max 600 tokens), `text-embedding-3-small` for embeddings. Do NOT swap to Anthropic.
- **Widget is vanilla TS + Shadow DOM.** Build with esbuild (`build:widget`). Never import React into `widget/`.
- **Migrations are append-only.** Add `00X_*.sql`; never edit applied migrations.
- **PDPA.** Every vertical collects consent before personal data. STOP closes the conversation. No NRIC/credit cards in chat logs.

## Stack pins (don't bump without a reason)

- Next.js `^14.2.33` — Next 15 needs different config.
- ESLint `^8.57.1` — Next 14 doesn't support ESLint 9.
- `next.config.mjs` (not `.ts`) — Next 14 doesn't accept TS configs.

---

## Where things live (per vertical app)

```
src/lib/chat/       engine.ts · prompts.ts · rag.ts · intents.ts · actions.ts
src/lib/integrations/  telegram.ts · google-calendar.ts
src/lib/notifications/ admin.ts · parent-link.ts
src/app/api/        chat/ · documents/ · webhooks/telegram/ · auth/google/ · integrations/telegram/
src/app/dashboard/  conversations/ · bookings/ · classes/ · locations/ · documents/ · faqs/ · settings/
src/app/onboarding/ centre/ · class/ · branding/ · document/ · widget/
widget/src/         index.ts · ui.ts · api.ts · styles.ts
supabase/migrations/ 001–012 SQL files
knowledge_base/     *.md files (upload these via dashboard → Documents)
```

---

## Ruflo agent coordination

## Agent Comms (SendMessage-First Coordination)

Named agents coordinate via `SendMessage`, not polling or shared state.

```
Lead (you) ←→ architect ←→ developer ←→ tester ←→ reviewer
              (named agents message each other directly)
```

### Spawning a Coordinated Team

```javascript
// ALL agents in ONE message, each knows WHO to message next
Agent({ prompt: "Research the codebase. SendMessage findings to 'architect'.",
  subagent_type: "researcher", name: "researcher", run_in_background: true })
Agent({ prompt: "Wait for 'researcher'. Design solution. SendMessage to 'coder'.",
  subagent_type: "system-architect", name: "architect", run_in_background: true })
Agent({ prompt: "Wait for 'architect'. Implement it. SendMessage to 'tester'.",
  subagent_type: "coder", name: "coder", run_in_background: true })
Agent({ prompt: "Wait for 'coder'. Write tests. SendMessage results to 'reviewer'.",
  subagent_type: "tester", name: "tester", run_in_background: true })
Agent({ prompt: "Wait for 'tester'. Review code quality and security.",
  subagent_type: "reviewer", name: "reviewer", run_in_background: true })

// Kick off the pipeline
SendMessage({ to: "researcher", summary: "Start", message: "[task context]" })
```

### Patterns

| Pattern | Flow | Use When |
|---------|------|----------|
| **Pipeline** | A → B → C → D | Sequential dependencies (feature dev) |
| **Fan-out** | Lead → A, B, C → Lead | Independent parallel work (research) |
| **Supervisor** | Lead ↔ workers | Ongoing coordination (complex refactor) |

### Rules

- ALWAYS name agents — `name: "role"` makes them addressable
- ALWAYS include comms instructions in prompts — who to message, what to send
- Spawn ALL agents in ONE message with `run_in_background: true`
- After spawning: STOP, tell user what's running, wait for results
- NEVER poll status — agents message back or complete automatically

## Swarm & Routing

### Config
- **Topology**: hierarchical-mesh (anti-drift)
- **Max Agents**: 15
- **Memory**: hybrid
- **HNSW**: Enabled
- **Neural**: Enabled

```bash
npx @claude-flow/cli@latest swarm init --topology hierarchical --max-agents 8 --strategy specialized
```

### Agent Routing

| Task | Agents | Topology |
|------|--------|----------|
| Bug Fix | researcher, coder, tester | hierarchical |
| Feature | architect, coder, tester, reviewer | hierarchical |
| Refactor | architect, coder, reviewer | hierarchical |
| Performance | perf-engineer, coder | hierarchical |
| Security | security-architect, auditor | hierarchical |

### When to Swarm
- **YES**: 3+ files, new features, cross-module refactoring, API changes, security, performance
- **NO**: single file edits, 1-2 line fixes, docs updates, config changes, questions

### 3-Tier Model Routing

| Tier | Handler | Use Cases |
|------|---------|-----------|
| 1 | Agent Booster (WASM) | Simple transforms — skip LLM, use Edit directly |
| 2 | Haiku | Simple tasks, low complexity |
| 3 | Sonnet/Opus | Architecture, security, complex reasoning |

## Memory & Learning

### Before Any Task
```bash
npx @claude-flow/cli@latest memory search --query "[task keywords]" --namespace patterns
npx @claude-flow/cli@latest hooks route --task "[task description]"
```

### After Success
```bash
npx @claude-flow/cli@latest memory store --namespace patterns --key "[name]" --value "[what worked]"
npx @claude-flow/cli@latest hooks post-task --task-id "[id]" --success true --store-results true
```

### MCP Tools (use `ToolSearch("keyword")` to discover)

| Category | Key Tools |
|----------|-----------|
| **Memory** | `memory_store`, `memory_search`, `memory_search_unified` |
| **Bridge** | `memory_import_claude`, `memory_bridge_status` |
| **Swarm** | `swarm_init`, `swarm_status`, `swarm_health` |
| **Agents** | `agent_spawn`, `agent_list`, `agent_status` |
| **Hooks** | `hooks_route`, `hooks_post-task`, `hooks_worker-dispatch` |
| **Security** | `aidefence_scan`, `aidefence_is_safe`, `aidefence_has_pii` |
| **Hive-Mind** | `hive-mind_init`, `hive-mind_consensus`, `hive-mind_spawn` |

### Background Workers

| Worker | When |
|--------|------|
| `audit` | After security changes |
| `optimize` | After performance work |
| `testgaps` | After adding features |
| `map` | Every 5+ file changes |
| `document` | After API changes |

```bash
npx @claude-flow/cli@latest hooks worker dispatch --trigger audit
```

## Agents

**Core**: `coder`, `reviewer`, `tester`, `planner`, `researcher`
**Architecture**: `system-architect`, `backend-dev`, `mobile-dev`
**Security**: `security-architect`, `security-auditor`
**Performance**: `performance-engineer`, `perf-analyzer`
**Coordination**: `hierarchical-coordinator`, `mesh-coordinator`, `adaptive-coordinator`
**GitHub**: `pr-manager`, `code-review-swarm`, `issue-tracker`, `release-manager`

Any string works as a custom agent type.

## Build & Test

- ALWAYS run tests after code changes
- ALWAYS verify build succeeds before committing

```bash
npm run build && npm test
```

## CLI Quick Reference

```bash
npx @claude-flow/cli@latest init --wizard           # Setup
npx @claude-flow/cli@latest swarm init --v3-mode     # Start swarm
npx @claude-flow/cli@latest memory search --query "" # Vector search
npx @claude-flow/cli@latest hooks route --task ""    # Route to agent
npx @claude-flow/cli@latest doctor --fix             # Diagnostics
npx @claude-flow/cli@latest security scan            # Security scan
npx @claude-flow/cli@latest performance benchmark    # Benchmarks
```

26 commands, 140+ subcommands. Use `--help` on any command for details.

## Setup

```bash
claude mcp add claude-flow -- npx -y @claude-flow/cli@latest
npx @claude-flow/cli@latest daemon start
npx @claude-flow/cli@latest doctor --fix
```

**Agent tool** handles execution (agents, files, code, git). **MCP tools** handle coordination (swarm, memory, hooks). **CLI** is the same via Bash.
