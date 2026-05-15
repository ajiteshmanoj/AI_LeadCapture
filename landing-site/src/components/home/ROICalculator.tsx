"use client";
import { motion, useInView } from "framer-motion";
import { useRef, useState } from "react";
import { TrendingDown, TrendingUp, Calculator } from "lucide-react";

const FRONTDESK_COST = 199;
const DEFAULT_ENQUIRIES = 30;
const DEFAULT_MISS_RATE = 40;
const DEFAULT_AVG_VALUE = 300;

function formatSGD(n: number): string {
  return "$" + Math.round(n).toLocaleString("en-SG");
}

export function ROICalculator() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "0px" });

  const [weeklyEnquiries, setWeeklyEnquiries] = useState(DEFAULT_ENQUIRIES);
  const [missRate, setMissRate] = useState(DEFAULT_MISS_RATE);
  const [avgValue, setAvgValue] = useState(DEFAULT_AVG_VALUE);

  const monthlyEnquiries = weeklyEnquiries * 4;
  const missedLeads = Math.round(monthlyEnquiries * (missRate / 100));
  const lostRevenue = missedLeads * avgValue;
  const netGain = lostRevenue - FRONTDESK_COST;
  const roiMultiplier = lostRevenue / FRONTDESK_COST;

  return (
    <section ref={ref} className="py-20 px-4 bg-gradient-to-br from-slate-900 to-indigo-950 text-white overflow-hidden">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-semibold mb-4">
            <Calculator className="w-3.5 h-3.5" />
            ROI Calculator
          </div>
          <h2
            className="text-3xl sm:text-4xl font-bold text-white"
            style={{ fontFamily: "var(--font-instrument-serif, Georgia, serif)" }}
          >
            How much are you losing per month?
          </h2>
          <p className="text-white/60 mt-3">Adjust the sliders to see your numbers.</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        >
          {/* Inputs */}
          <div className="space-y-8">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-white/80">Weekly enquiries</label>
                <span className="text-lg font-bold text-white">{weeklyEnquiries}</span>
              </div>
              <input
                type="range"
                min={5}
                max={200}
                step={5}
                value={weeklyEnquiries}
                onChange={(e) => setWeeklyEnquiries(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-400"
                style={{ background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${((weeklyEnquiries - 5) / 195) * 100}%, rgba(255,255,255,0.2) ${((weeklyEnquiries - 5) / 195) * 100}%, rgba(255,255,255,0.2) 100%)` }}
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>5</span>
                <span>200</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-white/80">% you miss or reply late</label>
                <span className="text-lg font-bold text-white">{missRate}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={80}
                step={5}
                value={missRate}
                onChange={(e) => setMissRate(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-400"
                style={{ background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${((missRate - 10) / 70) * 100}%, rgba(255,255,255,0.2) ${((missRate - 10) / 70) * 100}%, rgba(255,255,255,0.2) 100%)` }}
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>10%</span>
                <span>80%</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-white/80">Average customer value (SGD)</label>
                <span className="text-lg font-bold text-white">{formatSGD(avgValue)}</span>
              </div>
              <input
                type="range"
                min={50}
                max={2000}
                step={50}
                value={avgValue}
                onChange={(e) => setAvgValue(Number(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer accent-indigo-400"
                style={{ background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${((avgValue - 50) / 1950) * 100}%, rgba(255,255,255,0.2) ${((avgValue - 50) / 1950) * 100}%, rgba(255,255,255,0.2) 100%)` }}
              />
              <div className="flex justify-between text-xs text-white/30 mt-1">
                <span>$50</span>
                <span>$2,000</span>
              </div>
            </div>
          </div>

          {/* Output */}
          <div className="flex flex-col gap-4">
            {/* Lost revenue — hero number */}
            <motion.div
              key={lostRevenue}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              className="bg-red-500/15 border border-red-400/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-400 uppercase tracking-wide">You&apos;re losing every month</span>
              </div>
              <div className="text-4xl font-bold text-white mt-1">{formatSGD(lostRevenue)}</div>
              <p className="text-xs text-white/50 mt-1">
                {missedLeads} missed leads × {formatSGD(avgValue)} avg value
              </p>
            </motion.div>

            {/* FrontDesk AI cost */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <div className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-1">FrontDesk AI costs</div>
              <div className="text-2xl font-bold text-white">{formatSGD(FRONTDESK_COST)}<span className="text-sm font-normal text-white/40">/month</span></div>
            </div>

            {/* Net gain + ROI */}
            <motion.div
              key={netGain}
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.15 }}
              className="bg-emerald-500/15 border border-emerald-400/30 rounded-2xl p-6"
            >
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wide">Your net gain</span>
              </div>
              <div className="text-4xl font-bold text-white">{formatSGD(netGain)}</div>
              <p className="text-xs text-white/50 mt-1">
                {roiMultiplier.toFixed(1)}× return on your $199/mo investment
              </p>
            </motion.div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-10 text-xs text-white/30"
        >
          Estimates based on industry averages. Actual results vary by business type, industry, and market.
        </motion.p>
      </div>
    </section>
  );
}
