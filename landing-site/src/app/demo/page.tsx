import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { industries } from "@/lib/industries";

export const metadata = {
  title: "Live Demo — FrontDesk AI",
  description: "Try a live AI chatbot for your industry. Real Singapore business data, real AI responses.",
};

export default function DemoHubPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-16 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">Live Demos</span>
          <h1
            className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
          >
            See it in action
          </h1>
          <p className="text-gray-500 max-w-xl mx-auto">
            Pick your industry and chat with a live AI assistant trained on real Singapore business data. No signup required.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {industries.map((industry) => (
            <Link key={industry.slug} href={`/demo/${industry.slug}`}>
              <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1 transition-all h-full cursor-pointer">
                <div className="text-4xl mb-3">{industry.icon}</div>
                <h2 className="font-bold text-gray-900 text-xl mb-1">{industry.name}</h2>
                <p className="text-sm text-indigo-600 font-medium mb-2">{industry.demoClient}</p>
                <p className="text-sm text-gray-500 mb-4 leading-relaxed">{industry.description}</p>

                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Try asking:</p>
                  <ul className="space-y-1">
                    {industry.suggestedQuestions.slice(0, 3).map((q, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1">
                        <span className="text-indigo-400 mt-0.5">›</span> {q}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center gap-1 text-indigo-600 text-sm font-semibold">
                  Chat Now <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
