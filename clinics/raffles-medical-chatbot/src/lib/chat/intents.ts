import type { Intent } from "@/types";

interface Rule {
  intent: Intent;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    intent: "appointment",
    patterns: [
      /\b(appointment|consult|see a doctor|book|visit|check.?up|slot|available)\b/i,
    ],
  },
  {
    intent: "medical_query",
    patterns: [
      /\b(symptom|pain|fever|medication|prescription|referral|medisave|chas|insurance)\b/i,
    ],
  },
  {
    intent: "fees",
    patterns: [
      /\b(fee|cost|price|how much|subsidis|medisave|cash|bill|charge)\b/i,
    ],
  },
  {
    intent: "schedule",
    patterns: [
      /\b(hour|open|timing|available|when|today|tomorrow|walk.?in|operating)\b/i,
    ],
  },
  {
    intent: "complaint",
    patterns: [
      /\b(complain|waiting|long queue|unhappy|doctor wrong|dissatisfied)\b/i,
    ],
  },
  {
    intent: "nurse_escalation",
    patterns: [
      /\b(urgent|emergency|chest pain|cannot breathe|stroke|speak to nurse|human|doctor now)\b/i,
    ],
  },
  {
    intent: "payment",
    patterns: [
      /\b(pay|payment|paynow|stripe|invoice|receipt|card)\b/i,
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
  return /\b(human|real person|speak to (someone|manager|staff|nurse|doctor)|call me|escalate|urgent|emergency|chest pain|cannot breathe|stroke)\b/i.test(
    message,
  );
}

export function isOptOut(message: string): boolean {
  return /^\s*stop\s*$/i.test(message);
}
