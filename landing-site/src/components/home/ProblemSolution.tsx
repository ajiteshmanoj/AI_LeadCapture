"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { X, Check } from "lucide-react";

const problems = [
  "Replying to the same WhatsApp questions 50 times a day",
  "Customers call when you're busy and you miss the booking",
  "Your website has a contact form that nobody fills out",
  "Paying $1,500/month for a receptionist who works 9–5",
];

const solutions = [
  "Answers every customer question instantly — even at 2am",
  "Books appointments directly into your Google Calendar",
  "Speaks Singlish and understands 'can book or not?'",
  "Costs less than your monthly coffee budget",
];

export function ProblemSolution() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-gradient-to-br from-slate-50 to-indigo-50/30">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>
            Sound familiar?
          </h2>
          <p className="text-gray-500">Every Singapore SME owner we&apos;ve spoken to has said the same things.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Problems */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-red-50 border border-red-100 rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-red-600 uppercase tracking-wide mb-4">The Problem</h3>
            <ul className="space-y-4">
              {problems.map((p, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <X className="w-3 h-3 text-red-500" />
                  </div>
                  <span className="text-sm leading-relaxed">{p}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Solutions */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-emerald-50 border border-emerald-100 rounded-2xl p-6"
          >
            <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wide mb-4">FrontDesk AI fixes this</h3>
            <ul className="space-y-4">
              {solutions.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-gray-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-600" />
                  </div>
                  <span className="text-sm leading-relaxed">{s}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
