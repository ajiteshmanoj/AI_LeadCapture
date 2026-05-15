"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";

export function FinalCTA() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-24 px-4 bg-gray-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-900/40 via-gray-900 to-gray-900" />
      <div className="relative max-w-3xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>
            Ready to stop answering the same questions?
          </h2>
          <p className="text-gray-400 text-lg mb-8">
            Set up takes 48 hours. Free trial, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold transition-all shadow-lg shadow-emerald-500/25 hover:-translate-y-0.5"
            >
              Try a Live Demo <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="https://wa.me/6591234567"
              className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border-2 border-gray-700 hover:border-gray-600 text-white font-semibold transition-all hover:-translate-y-0.5"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              WhatsApp Us
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
