import { FileText, Settings, Code, Bot, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "How It Works — FrontDesk AI",
};

const steps = [
  {
    number: "01",
    icon: FileText,
    title: "Send us your business documents",
    desc: "Fee schedule, service menu, class timetable, policies, FAQs — whatever your business runs on. PDF, Word, or even a WhatsApp message works. We process everything.",
    side: "left",
  },
  {
    number: "02",
    icon: Settings,
    title: "We configure your AI assistant",
    desc: "We upload your documents, configure the chatbot's persona, set up your appointment booking rules, and customise the branding to match your business.",
    side: "right",
  },
  {
    number: "03",
    icon: Code,
    title: "Add one line of code to your website",
    desc: "We send you a single <script> tag. Paste it into your website's HTML — your web developer can do it in 2 minutes. No other changes required.",
    side: "left",
    code: '<script src="https://app.frontdeskai.sg/widget.js" data-org-id="your-id"></script>',
  },
  {
    number: "04",
    icon: Bot,
    title: "Your AI starts answering customers",
    desc: "Immediately. Day or night. The chatbot answers questions, books appointments into your Google Calendar, manages waitlists, and routes complaints to you via Telegram.",
    side: "right",
  },
  {
    number: "05",
    icon: LayoutDashboard,
    title: "Track everything from your dashboard",
    desc: "See every conversation, manage bookings, update your FAQs, change pricing — all from a clean web dashboard. No technical skills needed.",
    side: "left",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Process</span>
            <h1
              className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3"
              style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
            >
              Up and running in 48 hours
            </h1>
            <p className="text-gray-500 max-w-md mx-auto">No technical skills required. We handle everything from setup to go-live.</p>
          </div>

          <div className="space-y-10">
            {steps.map((step, i) => {
              const Icon = step.icon;
              const isRight = step.side === "right";
              return (
                <div
                  key={i}
                  className={`flex flex-col md:flex-row gap-6 items-start ${isRight ? "md:flex-row-reverse" : ""}`}
                >
                  {/* Icon + number */}
                  <div className="flex-shrink-0 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="text-4xl font-bold text-gray-200 mt-2">{step.number}</div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">{step.title}</h2>
                    <p className="text-gray-600 leading-relaxed text-sm mb-3">{step.desc}</p>
                    {step.code && (
                      <code className="block bg-gray-900 text-emerald-400 text-xs rounded-xl p-3 font-mono overflow-x-auto">
                        {step.code}
                      </code>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-14 text-center">
            <p className="text-gray-500 mb-4">Ready to get started?</p>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors shadow-lg shadow-emerald-500/25"
            >
              Start Free Trial →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
