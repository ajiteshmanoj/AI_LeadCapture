"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Globe, MessageCircle, Camera, Share2, Phone, QrCode, Mail, Users, Zap } from "lucide-react";

type Channel = {
  icon: React.ElementType;
  label: string;
  sublabel: string;
  colorClass: string;
  stat: string;
};

const leftChannels: Channel[] = [
  { icon: Globe, label: "Website Widget", sublabel: "website", colorClass: "bg-indigo-500", stat: "24/7 availability" },
  { icon: MessageCircle, label: "WhatsApp", sublabel: "whatsapp", colorClass: "bg-green-500", stat: "2B+ active users" },
  { icon: Camera, label: "Instagram DM", sublabel: "instagram", colorClass: "bg-pink-500", stat: "Stories + DMs" },
  { icon: Share2, label: "Facebook", sublabel: "facebook", colorClass: "bg-blue-600", stat: "Page messages" },
];

const rightChannels: Channel[] = [
  { icon: Phone, label: "Missed Calls", sublabel: "missed-calls", colorClass: "bg-orange-500", stat: "30-sec text-back" },
  { icon: QrCode, label: "QR Codes", sublabel: "qr", colorClass: "bg-violet-500", stat: "Scan-to-chat" },
  { icon: Mail, label: "Email Signature", sublabel: "email", colorClass: "bg-cyan-600", stat: "Passive lead source" },
  { icon: Users, label: "Referrals", sublabel: "referrals", colorClass: "bg-emerald-500", stat: "Auto-rewards" },
];

export function OmniChannel() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-gradient-to-br from-slate-50 to-indigo-50/30 overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">The Platform</span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
          >
            Not just a chatbot.
          </h2>
          <p className="text-lg text-gray-500 mt-3 max-w-2xl mx-auto">
            8 channels. One AI brain. Zero leads lost. Every customer touchpoint captured and converted — automatically.
          </p>
        </motion.div>

        {/* Desktop hub-and-spoke */}
        <div
          className="hidden md:grid items-center gap-y-8"
          style={{ gridTemplateColumns: "1fr 3.5rem 10rem 3.5rem 1fr" }}
        >
          {/* Central brain — spans all 4 rows */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5, type: "spring", stiffness: 120 }}
            style={{ gridColumn: "3", gridRow: "1 / 5", alignSelf: "center", justifySelf: "center" }}
            className="flex flex-col items-center"
          >
            <div className="relative w-24 h-24">
              <motion.div
                animate={{ scale: [1, 1.35, 1], opacity: [0.4, 0, 0.4] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="absolute inset-0 rounded-full bg-indigo-200"
              />
              <motion.div
                animate={{ scale: [1, 1.7, 1], opacity: [0.2, 0, 0.2] }}
                transition={{ duration: 2.2, repeat: Infinity, delay: 0.4 }}
                className="absolute inset-0 rounded-full bg-indigo-100"
              />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center shadow-xl shadow-indigo-300/40">
                <Zap className="w-10 h-10 text-white" />
              </div>
            </div>
            <div className="mt-3 text-center">
              <div className="text-sm font-bold text-gray-900">FrontDesk AI</div>
              <div className="text-xs text-gray-400">Central Brain</div>
            </div>
          </motion.div>

          {/* Left channels (col 1) + left connector lines (col 2) */}
          {leftChannels.flatMap((ch, i) => {
            const Icon = ch.icon;
            return [
              <motion.div
                key={ch.sublabel}
                style={{ gridColumn: "1", gridRow: String(i + 1) }}
                initial={{ opacity: 0, x: -32 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-3 justify-end"
              >
                <div className="text-right">
                  <div className="text-sm font-semibold text-gray-800">{ch.label}</div>
                  <div className="text-xs text-gray-400">{ch.stat}</div>
                </div>
                <div
                  className={`w-11 h-11 rounded-xl ${ch.colorClass} flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
              </motion.div>,
              <motion.div
                key={ch.sublabel + "-line"}
                style={{ gridColumn: "2", gridRow: String(i + 1), alignSelf: "center" }}
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }}
                className="h-px w-full bg-gradient-to-r from-gray-300 to-gray-100 origin-left"
              />,
            ];
          })}

          {/* Right connector lines (col 4) + right channels (col 5) */}
          {rightChannels.flatMap((ch, i) => {
            const Icon = ch.icon;
            return [
              <motion.div
                key={ch.sublabel + "-line"}
                style={{ gridColumn: "4", gridRow: String(i + 1), alignSelf: "center" }}
                initial={{ scaleX: 0 }}
                animate={inView ? { scaleX: 1 } : {}}
                transition={{ duration: 0.5, delay: 0.35 + i * 0.1 }}
                className="h-px w-full bg-gradient-to-l from-gray-300 to-gray-100 origin-right"
              />,
              <motion.div
                key={ch.sublabel}
                style={{ gridColumn: "5", gridRow: String(i + 1) }}
                initial={{ opacity: 0, x: 32 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div
                  className={`w-11 h-11 rounded-xl ${ch.colorClass} flex items-center justify-center flex-shrink-0 shadow-sm`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-800">{ch.label}</div>
                  <div className="text-xs text-gray-400">{ch.stat}</div>
                </div>
              </motion.div>,
            ];
          })}
        </div>

        {/* Mobile: 2-col grid */}
        <div className="md:hidden grid grid-cols-2 gap-3">
          {[...leftChannels, ...rightChannels].map((ch, i) => {
            const Icon = ch.icon;
            return (
              <motion.div
                key={ch.sublabel}
                initial={{ opacity: 0, y: 16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.06 }}
                className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
              >
                <div
                  className={`w-10 h-10 rounded-xl ${ch.colorClass} flex items-center justify-center flex-shrink-0`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-gray-800">{ch.label}</div>
                  <div className="text-xs text-gray-400">{ch.stat}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.95 }}
          className="text-center mt-12 text-sm text-gray-500 max-w-xl mx-auto"
        >
          All 8 channels feed into one dashboard. One bot. One brain.{" "}
          <strong className="text-gray-900">Zero leads slip through.</strong>
        </motion.p>
      </div>
    </section>
  );
}
