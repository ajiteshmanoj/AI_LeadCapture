"use client";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot } from "lucide-react";

interface Message {
  role: "user" | "bot";
  text: string;
}

const conversation: Message[] = [
  { role: "user", text: "Hi, do you have Sec 2 Math classes?" },
  { role: "bot", text: "Yes! We have Sec 2 Math on Tuesdays 4–6pm and Saturdays 10am–12pm. Group class is $280/month. Would you like to book a free trial? 😊" },
  { role: "user", text: "Saturday can try?" },
  { role: "bot", text: "✅ Done! Trial booked for this Saturday 10am. I've sent a Google Calendar invite to your email. See you then! 🎉" },
];

export function AnimatedChat() {
  const [visibleMessages, setVisibleMessages] = useState<Message[]>([]);
  const [showTyping, setShowTyping] = useState(false);

  useEffect(() => {
    let msgIndex = 0;

    const addNext = () => {
      if (msgIndex >= conversation.length) {
        // Restart after a pause
        setTimeout(() => {
          setVisibleMessages([]);
          setShowTyping(false);
          msgIndex = 0;
          setTimeout(addNext, 800);
        }, 3000);
        return;
      }

      const msg = conversation[msgIndex];
      msgIndex++;

      if (msg.role === "bot") {
        setShowTyping(true);
        setTimeout(() => {
          setShowTyping(false);
          setVisibleMessages((prev) => [...prev, msg]);
          setTimeout(addNext, 900);
        }, 1200);
      } else {
        setVisibleMessages((prev) => [...prev, msg]);
        setTimeout(addNext, 500);
      }
    };

    const timer = setTimeout(addNext, 600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full max-w-sm">
      {/* Phone frame */}
      <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden" style={{ minHeight: 420 }}>
        {/* Header */}
        <div className="bg-indigo-600 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-semibold text-sm">Zenith AI Assistant</div>
            <div className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-indigo-200 text-xs">Online</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="p-4 space-y-3 min-h-[300px]">
          <AnimatePresence>
            {visibleMessages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl text-sm max-w-[80%] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-indigo-600 text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          <AnimatePresence>
            {showTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex justify-start"
              >
                <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-gray-100 flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-gray-400"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Input bar */}
        <div className="px-4 py-3 border-t border-gray-100 flex gap-2">
          <div className="flex-1 bg-gray-50 rounded-xl px-3 py-2 text-xs text-gray-400">
            Type a message...
          </div>
          <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Decorative glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/10 to-cyan-500/10 rounded-3xl blur-xl -z-10" />
    </div>
  );
}
