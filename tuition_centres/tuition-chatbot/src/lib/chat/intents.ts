import type { Intent } from "@/types";

interface Rule {
  intent: Intent;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    intent: "booking",
    patterns: [
      /\b(book|trial|sign[-\s]?up|register|enrol+|reserve|slot)\b/i,
      /\b(can i try|wanna try|want to try|try class)\b/i,
      /\b(can book or not)\b/i,
    ],
  },
  {
    intent: "fees",
    patterns: [
      /\b(fee|fees|price|cost|charge|how much|rate)\b/i,
      /\bhow much (is|one|ah)\b/i,
      /\b(monthly|registration|material) fee\b/i,
    ],
  },
  {
    intent: "schedule",
    patterns: [
      /\b(schedule|timing|time|class time|when|day|days|available)\b/i,
      /\b(what time|which day|operating hours)\b/i,
    ],
  },
  {
    intent: "payment",
    patterns: [
      /\b(pay|payment|paynow|stripe|invoice|receipt|card)\b/i,
      /\b(payment link|pay now)\b/i,
    ],
  },
  {
    intent: "complaint",
    patterns: [
      /\b(complain|complaint|unhappy|disappointed|refund|terrible|bad service)\b/i,
      /\b(speak to (manager|supervisor)|human|real person)\b/i,
    ],
  },
];

export function classifyIntent(message: string): Intent {
  for (const rule of RULES) {
    if (rule.patterns.some((p) => p.test(message))) return rule.intent;
  }
  return "faq";
}

export function isEscalation(message: string): boolean {
  return /\b(human|real person|speak to (someone|manager|staff)|call me|escalate)\b/i.test(
    message,
  );
}

export function isOptOut(message: string): boolean {
  return /^\s*stop\s*$/i.test(message);
}
