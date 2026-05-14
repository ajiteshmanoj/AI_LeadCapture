import type { Intent } from "@/types";

interface Rule {
  intent: Intent;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    intent: "viewing",
    patterns: [
      /\b(viewing|view|visit|see the|show me|can i go|schedule|arrange)\b/i,
    ],
  },
  {
    intent: "listing_query",
    patterns: [
      /\b(listing|property|unit|available|psf|sqft|freehold|hdb|condo|landed|bedroom|district)\b/i,
    ],
  },
  {
    intent: "fees",
    patterns: [
      /\b(price|psf|asking|bsd|absd|stamp duty|cost|commission|fee)\b/i,
    ],
  },
  {
    intent: "lead_qualification",
    patterns: [
      /\b(budget|afford|loan|cpf|pr|singaporean|foreigner|citizen|first.?time|looking for)\b/i,
    ],
  },
  {
    intent: "schedule",
    patterns: [
      /\b(hour|open|timing|available|when|office|agent|contact)\b/i,
    ],
  },
  {
    intent: "complaint",
    patterns: [
      /\b(complain|mislead|wrong info|speak to agent|human|manager)\b/i,
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
  return /\b(human|real person|speak to (someone|manager|staff|agent)|call me|escalate)\b/i.test(
    message,
  );
}

export function isOptOut(message: string): boolean {
  return /^\s*stop\s*$/i.test(message);
}
