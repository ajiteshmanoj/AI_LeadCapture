"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Globe, MessageCircle, Camera, Share2, Phone, QrCode, Mail, Users, X, Check } from "lucide-react";

type ChannelCard = {
  icon: React.ElementType;
  name: string;
  colorClass: string;
  without: string;
  with: string;
};

const channels: ChannelCard[] = [
  {
    icon: Globe,
    name: "Website Widget",
    colorClass: "bg-indigo-500",
    without: "Visitor bounces in 5 min. No reply, no booking, no data.",
    with: "Bot greets instantly, answers in Singlish, books in under 2 minutes.",
  },
  {
    icon: MessageCircle,
    name: "WhatsApp",
    colorClass: "bg-green-500",
    without: "Messages pile up while you're busy. They message your competitor.",
    with: "Auto-replies immediately. Captures name, books slot, done.",
  },
  {
    icon: Camera,
    name: "Instagram DM",
    colorClass: "bg-pink-500",
    without: "Story replies and DMs sit unread for hours. Lead gone cold.",
    with: "Instant auto-reply with pricing + booking link. Never miss a DM.",
  },
  {
    icon: Share2,
    name: "Facebook Messages",
    colorClass: "bg-blue-600",
    without: "Page messages go unread. Customers assume you've closed down.",
    with: "Automated replies with hours, services, and one-tap booking.",
  },
  {
    icon: Phone,
    name: "Missed Calls",
    colorClass: "bg-orange-500",
    without: "Caller hangs up and dials the next business on Google Maps.",
    with: "SMS sent in 30 seconds: 'Chat with us now: [link]'. Lead recovered.",
  },
  {
    icon: QrCode,
    name: "QR Codes",
    colorClass: "bg-violet-500",
    without: "Your counter, window, and receipts are silent. Zero conversion.",
    with: "QR opens chatbot. Walk-in customer books before leaving the shop.",
  },
  {
    icon: Mail,
    name: "Email Signature",
    colorClass: "bg-cyan-600",
    without: "Every outgoing email is a missed lead opportunity.",
    with: "'Chat with us →' button converts passive readers into bookings.",
  },
  {
    icon: Users,
    name: "Referrals",
    colorClass: "bg-emerald-500",
    without: "You ask customers to refer friends. They forget. Nothing happens.",
    with: "Bot issues unique codes, tracks referrals, auto-rewards both parties.",
  },
];

export function ChannelComparison() {
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
          <span className="text-sm font-semibold text-red-500 uppercase tracking-wide">Lead Leakage</span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
          >
            You&apos;re losing leads on 8 fronts.
            <br />
            <span className="text-indigo-600">We capture all of them.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {channels.map((ch, i) => {
            const Icon = ch.icon;
            return (
              <motion.div
                key={ch.name}
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.4, delay: i * 0.07 }}
                className="bg-gray-50 rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-9 h-9 rounded-xl ${ch.colorClass} flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="font-semibold text-gray-900 text-sm">{ch.name}</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <X className="w-3 h-3 text-red-500" />
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{ch.without}</p>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">{ch.with}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
