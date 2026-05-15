"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { industries } from "@/lib/industries";

export function IndustryCards() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <span className="text-sm font-semibold text-indigo-600 uppercase tracking-wide">6 Industries</span>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-3" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>
            Built for Singapore businesses
          </h2>
          <p className="text-gray-500">Not a generic chatbot. Custom-trained for your industry.</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {industries.map((industry, i) => (
            <motion.div
              key={industry.slug}
              initial={{ opacity: 0, y: 24 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <Link href={`/demo/${industry.slug}`}>
                <div className="group bg-white rounded-2xl border border-gray-200 p-6 hover:border-indigo-200 hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer h-full">
                  <div className="text-3xl mb-3">{industry.icon}</div>
                  <h3 className="font-semibold text-gray-900 text-lg mb-1">{industry.name}</h3>
                  <p className="text-sm text-gray-500 mb-4 leading-relaxed">
                    {industry.features.join(" · ")}
                  </p>
                  <div className="flex items-center gap-1 text-indigo-600 text-sm font-medium group-hover:gap-2 transition-all">
                    Try Live Demo <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
