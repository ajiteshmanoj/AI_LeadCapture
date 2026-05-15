"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import { AnimatedChat } from "./AnimatedChat";

const trustBadges = [
  "PDPA Compliant",
  "< 2s Response Time",
  "99.9% Uptime",
  "Google Calendar Sync",
  "Telegram & WhatsApp",
];

export function Hero() {
  return (
    <section className="relative min-h-[90vh] bg-gradient-to-br from-slate-50 via-indigo-50/30 to-cyan-50/20 flex items-center overflow-hidden">
      {/* Background grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ff22_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ff22_1px,transparent_1px)] bg-[size:64px_64px]" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: copy */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-semibold mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
              Now live — 6 industries across Singapore
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-4" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>
              Your 24/7 AI Receptionist for{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-500">
                $99/month
              </span>
            </h1>

            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
              Answers customer questions, books appointments, and captures leads — on your website, WhatsApp, and Telegram. Set up in 48 hours.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link
                href="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm transition-all shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5"
              >
                Try a Live Demo
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-gray-200 hover:border-indigo-300 text-gray-700 font-semibold text-sm transition-all hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4" />
                See Pricing
              </Link>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap gap-2">
              {trustBadges.map((badge) => (
                <span
                  key={badge}
                  className="px-3 py-1 rounded-full bg-white border border-gray-200 text-xs text-gray-600 font-medium shadow-sm"
                >
                  {badge}
                </span>
              ))}
            </div>
          </motion.div>

          {/* Right: animated chat */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="flex justify-center lg:justify-end"
          >
            <AnimatedChat />
          </motion.div>
        </div>

        {/* Trust bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 pt-8 border-t border-gray-200"
        >
          <p className="text-center text-sm text-gray-400 mb-4">Trusted by businesses across Singapore</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
            {["Tuition Centres", "Hair Salons", "GP Clinics", "Restaurants", "Fitness Clubs", "Property Agents"].map((b) => (
              <span key={b} className="font-medium">{b}</span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
