"use client";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { MessageCircle, Camera, Phone, Check, LayoutDashboard } from "lucide-react";

type Tab = "whatsapp" | "instagram" | "missed-call";

type Message = {
  from: "user" | "bot";
  text: string;
  time: string;
};

const conversations: Record<Tab, { title: string; subtitle: string; messages: Message[] }> = {
  whatsapp: {
    title: "Zen Tuition Centre",
    subtitle: "WhatsApp Business",
    messages: [
      { from: "user", text: "Hi, do you have slots for maths this Saturday?", time: "7:14 PM" },
      { from: "bot", text: "Hi there! 👋 Yes, we have Saturday slots available!\n\n• 10:00 AM (2 spots left)\n• 2:00 PM\n• 4:00 PM\n\nWhich timing works for you?", time: "7:14 PM" },
      { from: "user", text: "2pm please, my name is Sarah", time: "7:15 PM" },
      { from: "bot", text: "Great choice, Sarah! Just need your email to send the Google Calendar invite 📧", time: "7:15 PM" },
      { from: "user", text: "sarah.tan@gmail.com", time: "7:16 PM" },
      { from: "bot", text: "✅ Booked! Sarah Tan — Saturday 24 May, 2:00 PM\n\nCalendar invite sent to sarah.tan@gmail.com. See you then! 🎉", time: "7:16 PM" },
    ],
  },
  instagram: {
    title: "Jean Yip Salon",
    subtitle: "Instagram DM",
    messages: [
      { from: "user", text: "Story reply: 'How much is the balayage? 👀'", time: "3:22 PM" },
      { from: "bot", text: "Hi! Our balayage starts from $180 (short hair) to $320+ (long hair) depending on length and thickness 💛\n\nWant to book a free consultation to get an exact quote?", time: "3:22 PM" },
      { from: "user", text: "yes please! can i come this week?", time: "3:24 PM" },
      { from: "bot", text: "Absolutely! We have these slots this week:\n\n• Wed 21 May — 2:00 PM, 4:30 PM\n• Thu 22 May — 11:00 AM\n• Fri 23 May — 3:00 PM\n\nWhich works best?", time: "3:24 PM" },
      { from: "user", text: "Thursday 11am!", time: "3:25 PM" },
      { from: "bot", text: "✅ Booked! Thu 22 May, 11:00 AM at Jean Yip Orchard.\n\nNote: A 30% deposit applies for consultations over 2 hours. I'll send the details to your DM 💁‍♀️", time: "3:25 PM" },
    ],
  },
  "missed-call": {
    title: "Virgin Active Singapore",
    subtitle: "Missed Call → Text-Back",
    messages: [
      { from: "bot", text: "📞 Missed call from +65 9123 4567 detected at 6:47 PM", time: "6:47 PM" },
      { from: "bot", text: "SMS sent (30 seconds later):\n\n\"Hi! You called Virgin Active but we missed you 😊 Chat with us 24/7 and book a free trial class instantly:\n\nfrontdeskai.sg/chat/va\n\nReply CALL if you'd prefer a callback.\"", time: "6:47 PM" },
      { from: "user", text: "hi! what trial classes do you have this week?", time: "6:52 PM" },
      { from: "bot", text: "Great timing! 🏋️‍♂️ Free trial classes this week:\n\n• HIIT — Wed 9:00 AM, Fri 6:30 PM\n• Yoga Flow — Thu 7:00 PM\n• Spin — Sat 8:00 AM\n\nAll at our Raffles Place club. Want to reserve a spot?", time: "6:52 PM" },
      { from: "user", text: "Friday HIIT please! Name is Marcus", time: "6:53 PM" },
      { from: "bot", text: "✅ Marcus — Friday 23 May, 6:30 PM HIIT class.\n\nSee you at Raffles Place Level 3! Bring water and a towel 💪", time: "6:53 PM" },
    ],
  },
};

const tabs: { id: Tab; label: string; icon: React.ElementType; color: string }[] = [
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "bg-green-500" },
  { id: "instagram", label: "Instagram DM", icon: Camera, color: "bg-pink-500" },
  { id: "missed-call", label: "Missed Call", icon: Phone, color: "bg-orange-500" },
];

export function MultiChannelDemo() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const [activeTab, setActiveTab] = useState<Tab>("whatsapp");

  const conv = conversations[activeTab];

  return (
    <section ref={ref} className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Live Preview</span>
          <h2
            className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
          >
            See it in action
          </h2>
          <p className="text-gray-500 mt-3 max-w-xl mx-auto">
            Real conversations across channels — all handled automatically, all feeding into one dashboard.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="max-w-2xl mx-auto"
        >
          {/* Tab bar */}
          <div className="flex gap-2 mb-4 bg-white rounded-2xl p-2 border border-gray-200 shadow-sm">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-gray-900 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-5 h-5 rounded-lg ${isActive ? tab.color : "bg-gray-200"} flex items-center justify-center`}>
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Mock phone/chat UI */}
          <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50">
              <div className={`w-9 h-9 rounded-full ${tabs.find((t) => t.id === activeTab)?.color} flex items-center justify-center`}>
                {(() => {
                  const tab = tabs.find((t) => t.id === activeTab);
                  if (!tab) return null;
                  const Icon = tab.icon;
                  return <Icon className="w-4 h-4 text-white" />;
                })()}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{conv.title}</div>
                <div className="text-xs text-gray-400">{conv.subtitle}</div>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs text-gray-400">Live</span>
              </div>
            </div>

            {/* Messages */}
            <div className="p-5 space-y-3 min-h-[320px] max-h-[420px] overflow-y-auto bg-gray-50/50">
              {conv.messages.map((msg, i) => (
                <motion.div
                  key={`${activeTab}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.08 }}
                  className={`flex ${msg.from === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed whitespace-pre-line ${
                      msg.from === "user"
                        ? "bg-indigo-600 text-white rounded-br-sm"
                        : "bg-white border border-gray-200 text-gray-700 rounded-bl-sm shadow-sm"
                    }`}
                  >
                    {msg.text}
                    <div className={`text-[10px] mt-1 ${msg.from === "user" ? "text-white/60" : "text-gray-400"} flex items-center gap-1 justify-end`}>
                      {msg.time}
                      {msg.from === "bot" && <Check className="w-2.5 h-2.5 text-indigo-400" />}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-white flex items-center gap-2">
              <div className="flex-1 bg-gray-50 rounded-xl px-4 py-2 text-xs text-gray-400 border border-gray-100">
                FrontDesk AI is handling this automatically...
              </div>
              <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center mt-5 text-sm text-gray-500"
          >
            Every conversation above is automatically logged in your{" "}
            <strong className="text-gray-900">admin dashboard</strong> — one unified inbox for all channels.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
