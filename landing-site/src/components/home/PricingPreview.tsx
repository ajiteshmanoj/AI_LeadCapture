"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { Check, MessageCircle } from "lucide-react";

const included = [
  "AI chatbot trained on your documents",
  "Embeddable website widget",
  "WhatsApp & Telegram integration",
  "Google Calendar appointment booking",
  "Waitlist management",
  "Admin dashboard",
  "Streaming responses (< 2s)",
  "PDPA compliant",
  "Ongoing WhatsApp support",
];

export function PricingPreview() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-white">
      <div className="max-w-xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-8"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>
            One plan. Everything included.
          </h2>
          <p className="text-gray-500 mt-2">No hidden fees. No surprises.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-white rounded-3xl border-2 border-indigo-200 p-8 shadow-xl shadow-indigo-100"
        >
          {/* Badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <span className="px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold">
              Free setup for first 10 clients
            </span>
          </div>

          <div className="text-center mb-6 pt-2">
            <div className="text-5xl font-bold text-gray-900">$99<span className="text-xl font-normal text-gray-400">/month</span></div>
            <div className="text-sm text-emerald-600 font-medium mt-1">$0 setup fee (limited time)</div>
          </div>

          <ul className="space-y-3 mb-8">
            {included.map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-sm text-gray-700">
                <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/demo"
            className="block w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-center font-semibold transition-colors shadow-lg shadow-emerald-500/25"
          >
            Start Free Trial →
          </Link>

          <p className="text-center text-xs text-gray-400 mt-3">Cancel anytime. No credit card required to start.</p>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="text-center mt-6 text-sm text-gray-500"
        >
          Questions?{" "}
          <a href="https://wa.me/6591234567" className="text-emerald-600 font-medium inline-flex items-center gap-1 hover:underline">
            <MessageCircle className="w-4 h-4" /> WhatsApp us
          </a>
        </motion.p>
      </div>
    </section>
  );
}
