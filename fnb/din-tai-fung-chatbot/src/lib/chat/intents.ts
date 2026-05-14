import type { Intent } from "@/types";

interface Rule {
  intent: Intent;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    intent: "reservation",
    patterns: [
      /\b(reserve|reservation|book|table|seat|tonight|dinner|lunch|saturday|sunday)\b/i,
    ],
  },
  {
    intent: "menu_query",
    patterns: [
      /\b(menu|dish|food|eat|xiao long bao|xlb|dumpling|noodle|rice|vegetarian|halal|pork|allerg)\b/i,
    ],
  },
  {
    intent: "catering_enquiry",
    patterns: [
      /\b(catering|event|corporate|party|bulk|large group|function|celebration)\b/i,
    ],
  },
  {
    intent: "fees",
    patterns: [
      /\b(price|how much|cost|fee|expensive|\$)\b/i,
    ],
  },
  {
    intent: "schedule",
    patterns: [
      /\b(hour|open|close|timing|when|today|available|wait|queue)\b/i,
    ],
  },
  {
    intent: "complaint",
    patterns: [
      /\b(complain|unhappy|wrong|refund|bad|speak to manager|human)\b/i,
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
