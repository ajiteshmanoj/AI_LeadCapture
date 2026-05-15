# Claude Code Prompt — AI LeadCapture Landing Page & Live Demo Site

## GOAL

Build a stunning, high-converting marketing website + live demo experience for AI LeadCapture — a productised AI chatbot SaaS for Singapore SMEs. This site needs to make business owners think "shut up and take my money" within 30 seconds of landing. It should look like a $50M funded startup's site, not a student project.

The site serves two purposes:
1. **Marketing site** — converts cold visitors into trial signups
2. **Live demo hub** — lets prospects interact with real chatbots for their industry before committing

---

## BRANDING

**Product name:** FrontDesk AI (or whatever you prefer — update throughout)
**Tagline:** "Your 24/7 AI receptionist that books appointments, answers questions, and never calls in sick."
**Target audience:** Singapore SME owners — tuition centres, hair salons, clinics, F&B, gyms, property agents
**Tone:** Professional but approachable. Not corporate, not cute. Think Stripe meets Tidio. Clean, confident, modern.
**Color palette:** 
- Primary: Deep indigo (#4F46E5)
- Accent: Bright teal (#06B6D4)
- Background: Off-white (#FAFAFA) with subtle gradient sections
- Dark sections: Near-black (#0F172A)
- Success/CTA: Emerald (#10B981)
**Typography:** Inter for body, Cal Sans or Instrument Serif for headlines (or use a clean Google Font pairing)

---

## TECH STACK

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui components
- **Animations:** Framer Motion for scroll-triggered animations, hover effects, and section transitions
- **Icons:** Lucide React
- **Deployment:** Vercel
- **Live Demo Widget:** Embed the actual chatbot widget (the same `<script>` tag from the real product) on demo pages
- **Analytics:** Vercel Analytics (add later)
- **Forms:** Simple contact form that sends to a Telegram bot or email

---

## SITE STRUCTURE

```
/                          → Homepage (hero, features, industries, social proof, pricing, CTA)
/demo                      → Demo hub (pick your industry)
/demo/tuition-centres      → Live Zenith Education chatbot demo
/demo/hair-salons          → Live Jean Yip chatbot demo
/demo/clinics              → Live Raffles Medical chatbot demo
/demo/restaurants           → Live Din Tai Fung chatbot demo
/demo/gyms                 → Live Virgin Active chatbot demo
/demo/property             → Live Huttons chatbot demo
/pricing                   → Detailed pricing page
/how-it-works              → Step-by-step onboarding explanation
/contact                   → Contact form + WhatsApp link
```

---

## PAGE-BY-PAGE SPECIFICATIONS

### 1. HOMEPAGE ( / )

This is the most important page. It needs to do 5 things in order:
1. Instantly communicate what the product does (hero)
2. Show it working (interactive demo preview)
3. Prove it works for their industry (industry cards)
4. Build trust (social proof + stats)
5. Make the next step obvious (pricing + CTA)

#### Hero Section
- **Full-width**, takes up 90vh
- Left side: Large headline + subheadline + two CTA buttons
- Right side: An animated mockup showing the chatbot widget in action on a phone or browser. Use Framer Motion to animate chat bubbles appearing one by one as if a real conversation is happening.
- **Headline:** "Your 24/7 AI Receptionist for $99/month"
- **Subheadline:** "Answers customer questions, books appointments, and captures leads — on your website, WhatsApp, and Telegram. Set up in 48 hours."
- **CTA 1 (primary, emerald):** "Try a Live Demo" → links to /demo
- **CTA 2 (secondary, outline):** "See Pricing" → links to /pricing
- **Trust bar below hero:** "Trusted by businesses across Singapore" + small logos or badges (use generic professional badges for now — "PDPA Compliant", "99.9% Uptime", "< 2s Response Time", "SOC 2 Ready")

#### Animated Chat Preview (in hero, right side)
Build a realistic-looking chat widget mockup (NOT the actual widget — a visual-only animation). Show a conversation like:

```
[Parent]: Hi, do you have Sec 2 Math classes?
[Bot]: Yes! We have Sec 2 Math on Tuesdays 4-6pm and Saturdays 10am-12pm. Group class is $280/month. Would you like to book a free trial?
[Parent]: Saturday can try?
[Bot]: Booked! I've sent a calendar invite to your email. See you Saturday at 10am! 😊
```

Each message should animate in with a slight delay (300ms between messages) using Framer Motion. The typing indicator ("...") should show before each bot message. This creates the "wow" moment.

#### Problem → Solution Section
A section that speaks directly to the SME owner's pain:

**Left column (the problem):**
"Sound familiar?"
- "You're replying to the same WhatsApp questions 50 times a day"
- "Customers call when you're busy and you miss the booking"
- "Your website has a contact form that nobody fills out"
- "You're paying $1,500/month for a receptionist who works 9-5"

**Right column (the solution):**
"What if you had an AI that..."
- "Answers every customer question instantly — even at 2am"
- "Books appointments directly into your Google Calendar"
- "Speaks Singlish and understands 'can book or not?'"
- "Costs less than your monthly coffee budget"

Use a subtle gradient background and icons next to each point. Animate on scroll.

#### How It Works (3 steps)
Simple three-step section with large numbered circles and icons:

**Step 1:** "Send us your documents" — "Fee schedule, menu, service list, policies — whatever your business runs on. We upload everything."
**Step 2:** "We configure your AI" — "Your chatbot learns your business inside out. Pricing, schedules, locations, FAQs — it knows it all."
**Step 3:** "Go live in 48 hours" — "Drop one line of code on your website. Your AI receptionist starts answering customers immediately."

Each step should have a small illustration or icon. Consider using a horizontal timeline layout on desktop, vertical on mobile.

#### Industry Cards Section
**Heading:** "Built for Singapore businesses"
**Subheading:** "Not a generic chatbot. Custom-trained for your industry."

6 cards in a 3x2 grid (2x3 on mobile):
1. 📚 Tuition Centres — "Answer parent enquiries, book trial classes, manage waitlists"
2. 💇 Hair Salons — "Take bookings 24/7, reduce no-shows, collect deposits"
3. 🏥 Clinics — "Handle appointment requests, answer insurance questions"
4. 🍜 Restaurants — "Menu enquiries, table reservations, catering quotes"
5. 🏋️ Gyms — "Class schedules, membership plans, trial bookings"
6. 🏠 Property — "Answer listing questions, qualify leads, book viewings"

Each card should be clickable → goes to /demo/[industry]. On hover, the card lifts slightly with a shadow and shows a "Try Live Demo →" link.

#### Stats / Social Proof Section
A dark-background section with large animated counters:
- "< 2 second" — Average response time
- "24/7" — Always on, never takes MC
- "6 industries" — Tuition, salons, clinics, F&B, gyms, property
- "90%+" — Accuracy on common questions
- "$99/mo" — Less than your part-time admin

Use Framer Motion to count up the numbers when the section scrolls into view.

#### Feature Grid
A 2x3 or 3x2 grid of feature cards with icons:

1. **RAG-Powered Answers** — "Answers from YOUR documents. Never makes things up."
2. **Appointment Booking** — "Books directly into Google Calendar with automatic email invites."
3. **Waitlist Management** — "Class full? Customers join the waitlist and get notified when a spot opens."
4. **Multi-Channel** — "Website widget, WhatsApp, and Telegram — all from one dashboard."
5. **Admin Dashboard** — "See every conversation, manage classes, update FAQs — all in one place."
6. **Singlish Ready** — "Understands 'how much one?', 'can book or not?', and 'got discount ah?'"

Each card: icon + heading + one-liner. Clean, minimal.

#### Comparison Section
A table or side-by-side comparing FrontDesk AI vs the alternatives:

| | Part-Time Admin | Generic Chatbot (Tidio, etc) | FrontDesk AI |
|---|---|---|---|
| Monthly cost | $1,500+ | $200-500 | $99 |
| Available 24/7 | No | Yes | Yes |
| Knows your business | Yes | No | Yes (RAG) |
| Books appointments | Yes | Sometimes | Yes (Google Cal) |
| Speaks Singlish | Yes | No | Yes |
| Manages waitlists | Manually | No | Automatically |
| Setup time | Weeks | Days | 48 hours |

Use green checkmarks and red X marks. Make FrontDesk AI column highlighted with a subtle border or background.

#### Pricing Preview
A single pricing card (not tiers — keep it simple):

**"One plan. Everything included."**
- $0 setup (for first 5 clients)
- $99/month
- Everything: AI chatbot, booking, waitlist, dashboard, widget, WhatsApp, Telegram
- Cancel anytime
- "Start Free Trial" button (emerald, large)

Below: "Questions? WhatsApp us at +65 XXXX XXXX"

#### Final CTA Section
Full-width dark section:
- **Headline:** "Ready to stop answering the same questions?"
- **Subheadline:** "Set up takes 48 hours. Free trial, no credit card required."
- **Two buttons:** "Try a Live Demo" + "WhatsApp Us"

#### Footer
- Logo
- Links: Home, Demo, Pricing, How It Works, Contact
- "Built in Singapore 🇸🇬"
- WhatsApp + Email contact
- © 2026 FrontDesk AI

---

### 2. DEMO HUB PAGE ( /demo )

**Heading:** "See it in action"
**Subheading:** "Pick your industry and chat with a live AI assistant trained on real Singapore business data."

6 large cards (same industries as homepage but bigger, with more detail):
Each card shows:
- Industry icon + name
- Demo client name (e.g., "Zenith Education Studio")
- 2-3 suggested questions to try (e.g., "Ask about Sec 2 Math fees", "Book a trial class", "Ask about the Jurong East centre")
- "Chat Now →" button

---

### 3. INDIVIDUAL DEMO PAGES ( /demo/[industry] )

Each demo page has:

**Left side (60% width):**
- Industry name + demo client
- Brief description: "This is a live demo trained on real data from [Client]. Try asking about pricing, schedules, booking, or anything you'd ask as a customer."
- **Suggested questions** as clickable chips/pills that auto-fill the chat:
  - For tuition: "How much is Sec 2 Math?", "Do you have trial classes?", "Where is your Jurong East centre?"
  - For salons: "How much is a haircut and colour?", "Can I book for Saturday?", "Do you have a deposit?"
  - etc.
- Below suggestions: "This bot is powered by FrontDesk AI. Want one for your business? [Get Started →]"

**Right side (40% width):**
- The ACTUAL chatbot widget embedded and open by default (not the floating button — the full chat window, expanded)
- This is the real product. It connects to the real backend with the demo org's data.

**Mobile layout:** Full-width, suggestions on top, chat widget below (full screen).

---

### 4. PRICING PAGE ( /pricing )

Single pricing card, larger and more detailed than the homepage preview:

**$99/month — Everything Included**

Checklist of features:
- ✅ AI chatbot trained on your documents
- ✅ Embeddable website widget
- ✅ WhatsApp integration
- ✅ Telegram integration
- ✅ Google Calendar booking
- ✅ Waitlist management
- ✅ Admin dashboard (conversations, bookings, classes, FAQs, documents, settings)
- ✅ Multi-location support
- ✅ PDPA compliant
- ✅ Streaming responses (< 2s)
- ✅ We handle all setup and onboarding
- ✅ Ongoing support via WhatsApp

**$0 setup fee** (limited time — first 10 clients)

"Start Free Trial" CTA

**FAQ section below:**
- "How long does setup take?" → "48 hours from when you send us your documents."
- "What if I want to cancel?" → "Cancel anytime. No lock-in contract."
- "Do I need technical skills?" → "Zero. We handle everything."
- "What happens after the free trial?" → "$99/month. Cancel if you're not happy."
- "Can I change my documents later?" → "Yes, anytime through the dashboard."

---

### 5. HOW IT WORKS PAGE ( /how-it-works )

Visual step-by-step with screenshots/mockups:

**Step 1:** Send us your business documents (show: PDFs being uploaded)
**Step 2:** We configure your AI assistant (show: dashboard settings page)
**Step 3:** Add one line of code to your website (show: the script tag)
**Step 4:** Your AI starts answering customers (show: chat widget in action)
**Step 5:** Track everything from your dashboard (show: conversations list)

Each step should have a mockup image on one side and text on the other, alternating left/right.

---

### 6. CONTACT PAGE ( /contact )

Simple page:
- **WhatsApp:** +65 XXXX XXXX (with click-to-chat link)
- **Email:** hello@frontdeskai.sg (or whatever)
- **Contact form:** Name, Email, Business Name, Industry (dropdown), Message
- Form submission sends to a Telegram bot or email

---

## DESIGN PRINCIPLES

1. **Show the product, not stock photos.** Every visual should be a mockup of the actual chatbot or dashboard. No generic "woman at desk" images.

2. **Animate on scroll.** Every section should fade/slide in as the user scrolls. Use Framer Motion's `useInView` and `motion.div` with `initial`, `animate`, and `transition` props. Keep animations subtle — 0.5s duration, ease-out.

3. **Mobile-first.** 60%+ of SG SME owners will see this on their phone. Every section must look great on 375px width.

4. **Speed matters.** The site should score 90+ on Lighthouse. Use next/image for all images, dynamic imports for heavy components, and minimal JavaScript.

5. **Social proof everywhere.** Stats counters, comparison tables, trust badges, and "Trusted by businesses across Singapore" — repeat the trust message.

6. **One clear CTA per section.** Every scroll-stop should have either "Try a Live Demo" or "Start Free Trial" visible.

7. **Dark/light section alternation.** Alternate between white and dark (#0F172A) background sections to create visual rhythm and prevent "wall of text" fatigue.

---

## FILE STRUCTURE

```
landing-site/
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # Root layout with fonts, metadata
│   │   ├── page.tsx                      # Homepage
│   │   ├── demo/
│   │   │   ├── page.tsx                  # Demo hub
│   │   │   ├── [industry]/page.tsx       # Individual demo pages
│   │   ├── pricing/page.tsx
│   │   ├── how-it-works/page.tsx
│   │   ├── contact/page.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx                # Sticky nav with glassmorphism
│   │   │   └── Footer.tsx
│   │   ├── home/
│   │   │   ├── Hero.tsx
│   │   │   ├── AnimatedChat.tsx          # The fake chat conversation animation
│   │   │   ├── ProblemSolution.tsx
│   │   │   ├── HowItWorks.tsx
│   │   │   ├── IndustryCards.tsx
│   │   │   ├── StatsCounter.tsx
│   │   │   ├── FeatureGrid.tsx
│   │   │   ├── ComparisonTable.tsx
│   │   │   ├── PricingPreview.tsx
│   │   │   └── FinalCTA.tsx
│   │   ├── demo/
│   │   │   ├── DemoCard.tsx
│   │   │   ├── SuggestedQuestions.tsx
│   │   │   └── LiveChatEmbed.tsx         # Embeds actual widget
│   │   ├── pricing/
│   │   │   ├── PricingCard.tsx
│   │   │   └── FAQ.tsx
│   │   └── ui/                           # shadcn/ui components
│   ├── lib/
│   │   ├── industries.ts                 # Industry data (names, icons, demo URLs, suggested questions)
│   │   └── animations.ts                 # Reusable Framer Motion variants
│   └── types/
│       └── index.ts
├── public/
│   ├── og-image.png                      # Open Graph image for social sharing
│   └── favicon.ico
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## INDUSTRY DATA (src/lib/industries.ts)

```typescript
export const industries = [
  {
    slug: "tuition-centres",
    name: "Tuition Centres",
    icon: "📚",
    demoClient: "Zenith Education Studio",
    description: "AI assistant trained on real tuition centre data — fees, schedules, trial bookings, 12 locations across Singapore.",
    suggestedQuestions: [
      "How much is JC1 Math tuition?",
      "Do you have trial classes?",
      "Where is your Jurong East centre?",
      "Is there Sec 2 A-Math on Saturdays?",
      "What's the sibling discount?",
    ],
    widgetOrgId: "YOUR_ZENITH_ORG_ID",
    features: ["Fee enquiries", "Trial booking", "Schedule lookup", "Waitlist", "12 locations"],
  },
  {
    slug: "hair-salons",
    name: "Hair Salons",
    icon: "💇",
    demoClient: "Jean Yip Group",
    description: "Book appointments, check service pricing, and reduce no-shows with deposit collection.",
    suggestedQuestions: [
      "How much is a haircut and colour?",
      "Can I book for this Saturday?",
      "Which stylist does balayage?",
      "What's the cancellation policy?",
    ],
    widgetOrgId: "YOUR_JEANYIP_ORG_ID",
    features: ["Appointment booking", "Service pricing", "Stylist recommendation", "Deposit collection"],
  },
  // ... same pattern for clinics, restaurants, gyms, property
];
```

---

## CRITICAL REQUIREMENTS

1. **The animated chat in the hero MUST look real.** Not a static screenshot. Animated bubbles appearing with typing indicator. This is the "wow" moment.

2. **The live demo pages MUST embed the actual working chatbot.** Not a mockup. The visitor types a real question and gets a real AI answer. This is what sells the product.

3. **The comparison table MUST make FrontDesk AI the obvious winner.** Use green checkmarks, the highlighted column, and the price difference to make the value undeniable.

4. **Every page MUST have a CTA visible without scrolling.** The hero has one. The sticky nav has a "Get Started" button. The floating widget button on non-demo pages.

5. **Page load MUST be fast.** Use next/font for fonts, next/image for images, lazy load below-fold sections. Target Lighthouse 90+.

6. **MUST be deployed on Vercel** with a custom domain ready (frontdeskai.sg or similar).

---

## BUILD ORDER

1. Set up Next.js project with Tailwind, shadcn/ui, Framer Motion
2. Build the Navbar (sticky, glassmorphism, mobile hamburger menu)
3. Build the Homepage sections top to bottom
4. Build the Demo hub and individual demo pages with live widget embedding
5. Build the Pricing page
6. Build the How It Works page
7. Build the Contact page
8. Build the Footer
9. Add Framer Motion animations to all sections
10. Responsive pass (test on 375px, 768px, 1440px)
11. Performance pass (Lighthouse 90+)
12. Deploy to Vercel

Let me know when the homepage is complete and I'll review before you move to the demo pages.
