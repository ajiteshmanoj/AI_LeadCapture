"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { FileText, Settings, Zap } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Send us your documents",
    desc: "Fee schedule, menu, service list, policies — whatever your business runs on. We upload and process everything for you.",
    color: "bg-indigo-50 text-indigo-600",
  },
  {
    number: "02",
    icon: Settings,
    title: "We configure your AI",
    desc: "Your chatbot learns your business inside out. Pricing, schedules, locations, FAQs — it knows it all and stays in scope.",
    color: "bg-cyan-50 text-cyan-600",
  },
  {
    number: "03",
    icon: Zap,
    title: "Go live in 48 hours",
    desc: "Drop one line of code on your website. Your AI receptionist starts answering customers and booking appointments immediately.",
    color: "bg-emerald-50 text-emerald-600",
  },
];

export function HowItWorks() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">How it works</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>
            Up and running in 48 hours
          </h2>
          <p className="text-gray-500 max-w-md mx-auto">No technical skills required. We handle everything from setup to go-live.</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connector line (desktop) */}
          <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-px bg-gradient-to-r from-indigo-200 via-cyan-200 to-emerald-200" />

          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 24 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.15 }}
                className="relative flex flex-col items-center text-center"
              >
                <div className={`w-20 h-20 rounded-2xl ${step.color} flex items-center justify-center mb-5 relative z-10 shadow-sm`}>
                  <Icon className="w-8 h-8" />
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gray-900 text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
