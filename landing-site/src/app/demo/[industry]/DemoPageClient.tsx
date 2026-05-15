"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import type { Industry } from "@/lib/industries";

export function DemoPageClient({ industry }: { industry: Industry }) {
  const [inputValue, setInputValue] = useState("");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Back nav */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-6xl mx-auto">
          <Link
            href="/demo"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Back to all demos
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left: info + suggested questions (60%) */}
          <div className="lg:col-span-3">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-4xl">{industry.icon}</span>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{industry.name}</h1>
                <p className="text-indigo-600 font-medium text-sm">{industry.demoClient}</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6 leading-relaxed">{industry.description}</p>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 mb-6">
              <p className="text-sm font-semibold text-gray-700 mb-3">💬 Try asking:</p>
              <div className="flex flex-wrap gap-2">
                {industry.suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => setInputValue(q)}
                    className="px-3 py-1.5 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-medium hover:bg-indigo-100 transition-colors text-left"
                  >
                    {q}
                  </button>
                ))}
              </div>
              {inputValue && (
                <div className="mt-3 p-2 rounded-lg bg-gray-50 border border-gray-100 text-xs text-gray-500">
                  <span className="font-medium">Selected:</span> &quot;{inputValue}&quot; — copy this and paste it into the chat
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-2xl border border-indigo-100 p-5">
              <p className="text-sm text-indigo-900 font-medium mb-1">
                🤖 This bot is powered by FrontDesk AI
              </p>
              <p className="text-xs text-indigo-700 mb-3">
                Want one like this for your {industry.name.toLowerCase()} business? We set it up in 48 hours.
              </p>
              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 px-4 py-2 rounded-lg transition-colors"
              >
                Get Started for $99/mo <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {/* Feature tags */}
            <div className="mt-5 flex flex-wrap gap-2">
              {industry.features.map((f, i) => (
                <span key={i} className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs">
                  {f}
                </span>
              ))}
            </div>
          </div>

          {/* Right: live chat widget (40%) */}
          <div className="lg:col-span-2">
            <div className="sticky top-20">
              <div
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-lg"
                style={{ height: 560 }}
              >
                {/* Widget header */}
                <div className="px-4 py-3 border-b border-gray-100 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-sm font-medium text-gray-700">Live Demo — {industry.demoClient}</span>
                </div>

                {/* Widget placeholder — in production this loads the real widget */}
                <div className="h-full flex items-center justify-center bg-gray-50 p-6 text-center">
                  <div>
                    <div className="text-5xl mb-4">{industry.icon}</div>
                    <p className="text-sm font-semibold text-gray-700 mb-2">
                      {industry.demoClient} AI Assistant
                    </p>
                    <p className="text-xs text-gray-500 mb-4 max-w-48 mx-auto">
                      Connect this demo to your deployed chatbot by updating{" "}
                      <code className="bg-gray-100 px-1 rounded text-xs">widgetOrgId</code> and{" "}
                      <code className="bg-gray-100 px-1 rounded text-xs">widgetApiUrl</code> in{" "}
                      <code className="bg-gray-100 px-1 rounded text-xs">src/lib/industries.ts</code>
                    </p>
                    <a
                      href={`https://wa.me/6591234567?text=Hi, I want to demo the ${industry.name} chatbot`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600 transition-colors"
                    >
                      <MessageCircle className="w-4 h-4" />
                      WhatsApp for live demo
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
