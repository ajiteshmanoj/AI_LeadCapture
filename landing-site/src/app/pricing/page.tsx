import { Check, MessageCircle, Zap, X } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Pricing — FrontDesk AI",
  description: "Three plans for every stage of growth. From $99/month. No lock-in contracts.",
};

const plans = [
  {
    name: "Starter",
    price: 99,
    tagline: "Get your AI receptionist live in 48 hours.",
    badge: null as string | null,
    features: [
      "AI chatbot (trained on your documents)",
      "Embeddable website widget",
      "Google Calendar appointment booking",
      "Waitlist management",
      "Admin dashboard (conversations, bookings, FAQs, docs)",
      "PDPA compliant",
      "Streaming responses (< 2s)",
      "WhatsApp support from us",
    ],
    notIncluded: [
      "WhatsApp / Telegram / Instagram",
      "Lead nurture sequences",
      "Missed call text-back",
      "QR code generator",
    ],
    cta: "Start Free Trial",
    ctaHref: "/contact",
    highlight: false,
  },
  {
    name: "Growth",
    price: 199,
    tagline: "Every channel covered. Zero leads lost.",
    badge: "Most Popular",
    features: [
      "Everything in Starter",
      "WhatsApp Business integration",
      "Telegram integration",
      "Instagram DM auto-reply",
      "Facebook Messenger auto-reply",
      "Lead nurture sequences (post-booking follow-up)",
      "Payment reminders via WhatsApp",
      "Click-to-chat link generator",
      "Email signature widget",
    ],
    notIncluded: [
      "Missed call text-back",
      "QR code generator",
      "Multi-location analytics",
    ],
    cta: "Start Free Trial",
    ctaHref: "/contact",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: 399,
    tagline: "For multi-location businesses serious about growth.",
    badge: null as string | null,
    features: [
      "Everything in Growth",
      "Missed call text-back (30-second SMS)",
      "Google Review auto-responder",
      "QR code generator (counter, poster, receipt)",
      "Multi-location support",
      "Referral programme automation",
      "Channel analytics & ROI dashboard",
      "Priority support (same-day response)",
      "Custom branding",
    ],
    notIncluded: [],
    cta: "Contact Us",
    ctaHref: "/contact",
    highlight: false,
  },
];

const faqs = [
  {
    q: "How long does setup take?",
    a: "48 hours from when you send us your documents and business details. We handle everything — document upload, bot training, widget installation, and going live.",
  },
  {
    q: "What if I want to cancel?",
    a: "Cancel anytime. No lock-in contract, no penalty. We don't believe in trapping clients.",
  },
  {
    q: "Do I need technical skills?",
    a: "Zero. We handle the entire setup. You just need to provide your business documents (price list, FAQ, policies) and we do the rest.",
  },
  {
    q: "Is there a free trial?",
    a: "Yes — 14 days free, no credit card required. If you're not satisfied, you pay nothing.",
  },
  {
    q: "Can I upgrade plans later?",
    a: "Absolutely. You can upgrade from Starter to Growth or Enterprise at any time. We'll migrate your settings and training data.",
  },
  {
    q: "What does the setup fee cover?",
    a: "The first 10 clients get free setup (normally $499). This covers bot training on your documents, widget customisation, dashboard configuration, and a 1-hour onboarding call.",
  },
  {
    q: "Which channels does WhatsApp integration support?",
    a: "Growth and Enterprise plans include Twilio WhatsApp Business API, which supports two-way messaging, quick replies, and proactive outreach (reminders, payment nudges).",
  },
  {
    q: "Can I update my documents and FAQs later?",
    a: "Yes, anytime through the admin dashboard. Add new FAQs, update pricing, change policies — the bot re-trains within minutes.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="py-16 px-4 text-center">
        <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Pricing</span>
        <h1
          className="text-3xl sm:text-5xl font-bold text-gray-900 mt-2 mb-3"
          style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
        >
          Simple, transparent pricing.
        </h1>
        <p className="text-gray-500 max-w-md mx-auto">
          $0 setup for the first 10 clients. No hidden fees. No lock-in contracts.
        </p>
      </div>

      {/* Plans */}
      <div className="px-4 pb-20">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-3xl p-8 flex flex-col ${
                plan.highlight
                  ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-300/30 border-2 border-indigo-600 md:-mt-4 md:mb-4"
                  : "bg-white border-2 border-gray-100 shadow-md"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-gray-900 text-xs font-bold whitespace-nowrap">
                    <Zap className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-6">
                <div
                  className={`text-xs font-bold uppercase tracking-widest mb-1 ${
                    plan.highlight ? "text-indigo-200" : "text-indigo-600"
                  }`}
                >
                  {plan.name}
                </div>
                <div
                  className={`text-5xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}
                >
                  ${plan.price}
                  <span
                    className={`text-lg font-normal ${plan.highlight ? "text-indigo-200" : "text-gray-400"}`}
                  >
                    /mo
                  </span>
                </div>
                <p
                  className={`text-sm mt-2 leading-snug ${plan.highlight ? "text-indigo-200" : "text-gray-500"}`}
                >
                  {plan.tagline}
                </p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        plan.highlight ? "text-indigo-300" : "text-emerald-500"
                      }`}
                    />
                    <span
                      className={`text-sm ${plan.highlight ? "text-white/90" : "text-gray-700"}`}
                    >
                      {f}
                    </span>
                  </li>
                ))}
                {plan.notIncluded.map((f) => (
                  <li key={f} className="flex items-start gap-3 opacity-40">
                    <X className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span className="text-sm line-through">{f}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-auto">
                <Link
                  href={plan.ctaHref}
                  className={`block w-full py-3.5 rounded-xl text-center font-semibold transition-all ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
                      : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md"
                  }`}
                >
                  {plan.cta} →
                </Link>
                <p
                  className={`text-xs text-center mt-2 ${
                    plan.highlight ? "text-indigo-300" : "text-gray-400"
                  }`}
                >
                  14-day free trial · No credit card
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Setup fee note */}
        <p className="text-center text-sm text-gray-500 mt-8">
          Setup fee: <strong className="text-gray-900">$0 for first 10 clients</strong> (normally $499 one-time).
          Includes bot training, widget install, dashboard config, and 1-hour onboarding call.
        </p>
      </div>

      {/* FAQ */}
      <div className="px-4 pb-20 bg-white">
        <div className="max-w-3xl mx-auto pt-16">
          <h2
            className="text-2xl font-bold text-gray-900 mb-8 text-center"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
          >
            Frequently asked questions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl border border-gray-100 p-5">
                <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{faq.q}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-16 text-center bg-gray-50">
        <p className="text-gray-500 text-sm mb-4">Still have questions?</p>
        <a
          href="https://wa.me/6591234567"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
        >
          <MessageCircle className="w-4 h-4" /> WhatsApp us
        </a>
      </div>
    </div>
  );
}
