import { Check, MessageCircle } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Pricing — FrontDesk AI",
  description: "One plan, everything included. $99/month for your AI receptionist.",
};

const features = [
  "AI chatbot trained on your documents",
  "Embeddable website widget",
  "WhatsApp integration",
  "Telegram integration",
  "Google Calendar booking",
  "Waitlist management",
  "Admin dashboard (conversations, bookings, FAQs, documents, settings)",
  "Multi-location support",
  "PDPA compliant",
  "Streaming responses (< 2s)",
  "We handle all setup and onboarding",
  "Ongoing support via WhatsApp",
];

const faqs = [
  { q: "How long does setup take?", a: "48 hours from when you send us your documents. We handle everything." },
  { q: "What if I want to cancel?", a: "Cancel anytime. No lock-in contract. We don't believe in trapping clients." },
  { q: "Do I need technical skills?", a: "Zero. We handle the entire setup, from document upload to going live." },
  { q: "What happens after the free trial?", a: "$99/month. Cancel if you're not happy — no questions asked." },
  { q: "Can I update my documents later?", a: "Yes, anytime through the admin dashboard. Add new FAQs, update pricing, change policies." },
  { q: "Which channels does it support?", a: "Website widget, WhatsApp, and Telegram. All conversations appear in one dashboard." },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-16 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Pricing</span>
            <h1
              className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
            >
              One plan. Everything included.
            </h1>
            <p className="text-gray-500">No hidden fees. No tiers. No surprises.</p>
          </div>

          {/* Pricing card */}
          <div className="relative bg-white rounded-3xl border-2 border-indigo-200 p-8 shadow-xl shadow-indigo-50 mb-10">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">
                Free setup for first 10 clients
              </span>
            </div>

            <div className="text-center mb-8 pt-2">
              <div className="text-6xl font-bold text-gray-900 mb-1">
                $99<span className="text-2xl font-normal text-gray-400">/month</span>
              </div>
              <p className="text-emerald-600 font-semibold">$0 setup fee (limited time)</p>
              <p className="text-gray-400 text-sm mt-1">Cancel anytime · No credit card to start</p>
            </div>

            <ul className="space-y-3 mb-8">
              {features.map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                  <Check className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>

            <Link
              href="/contact"
              className="block w-full py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-center font-bold text-lg transition-colors shadow-lg shadow-emerald-500/25"
            >
              Start Free Trial →
            </Link>
          </div>

          {/* FAQ */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-5 text-center">Frequently asked questions</h2>
            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
                  <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{faq.q}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-10">
            <p className="text-gray-500 text-sm mb-3">Still have questions?</p>
            <a
              href="https://wa.me/6591234567"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
            >
              <MessageCircle className="w-4 h-4" /> WhatsApp us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
