"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Brain, Calendar, Users, Radio, LayoutDashboard, MessageCircle } from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "RAG-Powered Answers",
    desc: "Answers from YOUR documents. Never makes things up. Grounded in your actual fees, schedules, and policies.",
    color: "text-indigo-600 bg-indigo-50",
  },
  {
    icon: Calendar,
    title: "Appointment Booking",
    desc: "Books directly into Google Calendar with automatic email invites sent to the customer.",
    color: "text-cyan-600 bg-cyan-50",
  },
  {
    icon: Users,
    title: "Waitlist Management",
    desc: "Class full? Customers join the waitlist automatically and get notified when a spot opens.",
    color: "text-violet-600 bg-violet-50",
  },
  {
    icon: Radio,
    title: "Multi-Channel",
    desc: "Website widget, WhatsApp, and Telegram — all conversations in one dashboard.",
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    icon: LayoutDashboard,
    title: "Admin Dashboard",
    desc: "See every conversation, manage bookings, update FAQs — everything in one place.",
    color: "text-orange-600 bg-orange-50",
  },
  {
    icon: MessageCircle,
    title: "Singlish Ready",
    desc: "Understands 'how much one?', 'can book or not?', and 'got discount ah?' naturally.",
    color: "text-pink-600 bg-pink-50",
  },
];

export function FeatureGrid() {
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
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Features</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>
            Everything your front desk does, automated
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.08 }}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-6 hover:shadow-md transition-all"
              >
                <div className={`w-10 h-10 rounded-xl ${f.color} flex items-center justify-center mb-4`}>
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
