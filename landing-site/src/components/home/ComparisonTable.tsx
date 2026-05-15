"use client";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, X } from "lucide-react";

const rows = [
  { feature: "Monthly cost", admin: "$1,500+", generic: "$200–500", us: "$99" },
  { feature: "Available 24/7", admin: false, generic: true, us: true },
  { feature: "Knows your business", admin: true, generic: false, us: true },
  { feature: "Books appointments", admin: true, generic: "Sometimes", us: true },
  { feature: "Speaks Singlish", admin: true, generic: false, us: true },
  { feature: "Manages waitlists", admin: "Manually", generic: false, us: true },
  { feature: "Setup time", admin: "Weeks", generic: "Days", us: "48 hours" },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) return <Check className="w-5 h-5 text-emerald-500 mx-auto" />;
  if (value === false) return <X className="w-5 h-5 text-red-400 mx-auto" />;
  return <span className="text-sm text-gray-600">{value}</span>;
}

export function ComparisonTable() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>
            Why FrontDesk AI wins
          </h2>
          <p className="text-gray-500 mt-2">Compare us to your current options.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="overflow-x-auto rounded-2xl border border-gray-200 shadow-sm"
        >
          <table className="w-full bg-white">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-500 w-1/3">Feature</th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-500">Part-Time Admin</th>
                <th className="px-4 py-4 text-center text-sm font-medium text-gray-500">Generic Chatbot</th>
                <th className="px-4 py-4 text-center bg-indigo-50">
                  <span className="text-sm font-bold text-indigo-600">FrontDesk AI ✨</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className={`border-b border-gray-50 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                  <td className="px-6 py-3.5 text-sm font-medium text-gray-700">{row.feature}</td>
                  <td className="px-4 py-3.5 text-center"><Cell value={row.admin} /></td>
                  <td className="px-4 py-3.5 text-center"><Cell value={row.generic} /></td>
                  <td className="px-4 py-3.5 text-center bg-indigo-50/60"><Cell value={row.us} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
}
