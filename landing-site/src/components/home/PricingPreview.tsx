"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { Check, MessageCircle, Zap } from "lucide-react";

const plans = [
  {
    name: "Starter",
    price: 99,
    tagline: "Get your AI receptionist live in 48 hours.",
    badge: null,
    features: [
      "AI chatbot (trained on your documents)",
      "Embeddable website widget",
      "Google Calendar booking",
      "Waitlist management",
      "Admin dashboard",
      "PDPA compliant",
      "WhatsApp support",
    ],
    cta: "Start Free Trial",
    ctaHref: "/demo",
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
      "Facebook Messenger",
      "Lead nurture sequences",
      "Payment reminders",
      "Click-to-chat link generator",
    ],
    cta: "Start Free Trial",
    ctaHref: "/demo",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: 399,
    tagline: "For multi-location businesses serious about growth.",
    badge: null,
    features: [
      "Everything in Growth",
      "Missed call text-back (30 sec)",
      "Google Review auto-responder",
      "QR code generator",
      "Multi-location support",
      "Referral programme automation",
      "Channel analytics & ROI dashboard",
      "Priority support (same-day)",
    ],
    cta: "Contact Us",
    ctaHref: "/contact",
    highlight: false,
  },
];

export function PricingPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Pricing</span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
          >
            Simple, transparent pricing.
          </h2>
          <p className="text-gray-500 mt-2">$0 setup for the first 10 clients. No lock-in contracts.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className={`relative rounded-3xl p-7 flex flex-col ${
                plan.highlight
                  ? "bg-indigo-600 text-white shadow-2xl shadow-indigo-300/40 border-2 border-indigo-600 md:-mt-4"
                  : "bg-white border-2 border-gray-100 shadow-md"
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-gray-900 text-xs font-bold">
                    <Zap className="w-3 h-3" />
                    {plan.badge}
                  </span>
                </div>
              )}

              <div className="mb-5">
                <div className={`text-xs font-bold uppercase tracking-widest mb-1 ${plan.highlight ? "text-indigo-200" : "text-indigo-600"}`}>
                  {plan.name}
                </div>
                <div className={`text-4xl font-bold ${plan.highlight ? "text-white" : "text-gray-900"}`}>
                  ${plan.price}
                  <span className={`text-base font-normal ${plan.highlight ? "text-indigo-200" : "text-gray-400"}`}>/mo</span>
                </div>
                <p className={`text-sm mt-1.5 leading-snug ${plan.highlight ? "text-indigo-200" : "text-gray-500"}`}>
                  {plan.tagline}
                </p>
              </div>

              <ul className="space-y-2.5 mb-7 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5">
                    <Check
                      className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.highlight ? "text-indigo-300" : "text-emerald-500"}`}
                    />
                    <span className={`text-sm ${plan.highlight ? "text-white/90" : "text-gray-700"}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.ctaHref}
                className={`block w-full py-3 rounded-xl text-center font-semibold text-sm transition-all ${
                  plan.highlight
                    ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100"
                }`}
              >
                {plan.cta} →
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-8 text-sm text-gray-500"
        >
          Questions?{" "}
          <a
            href="https://wa.me/6591234567"
            className="text-emerald-600 font-medium inline-flex items-center gap-1 hover:underline"
          >
            <MessageCircle className="w-4 h-4" /> WhatsApp us
          </a>
        </motion.p>
      </div>
    </section>
  );
}
