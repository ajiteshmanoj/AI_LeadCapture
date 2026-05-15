"use client";
import { motion, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import { useRef, useEffect } from "react";

const stats = [
  { value: 2, suffix: "s", prefix: "< ", label: "Average response time" },
  { value: 24, suffix: "/7", prefix: "", label: "Always on, never takes MC" },
  { value: 6, suffix: "", prefix: "", label: "Industries supported" },
  { value: 90, suffix: "%+", prefix: "", label: "Accuracy on common questions" },
  { value: 99, suffix: "/mo", prefix: "$", label: "Less than a part-time admin" },
];

function Counter({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
  const count = useMotionValue(0);
  const rounded = useTransform(count, (v) => Math.round(v));
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView) {
      animate(count, value, { duration: 1.5, ease: "easeOut" });
    }
  }, [inView, count, value]);

  return (
    <span ref={ref} className="text-4xl sm:text-5xl font-bold text-white">
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix}
    </span>
  );
}

export function StatsCounter() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="py-20 px-4 bg-gray-900">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-white" style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}>
            The numbers speak for themselves
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
          {stats.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="text-center"
            >
              <Counter value={stat.value} prefix={stat.prefix} suffix={stat.suffix} />
              <p className="text-gray-400 text-sm mt-2">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
