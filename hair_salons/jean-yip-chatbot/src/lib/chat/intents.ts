import type { Intent } from "@/types";

interface Rule {
  intent: Intent;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    intent: "appointment",
    patterns: [/\b(book|appointment|slot|available|session|visit|come in)\b/i],
  },
  {
    intent: "service_query",
    patterns: [
      /\b(haircut|colour|color|balayage|keratin|perm|treatment|highlights|ombre|blowdry|blow.?dry|price|how much)\b/i,
    ],
  },
  {
    intent: "deposit",
    patterns: [/\b(deposit|pay|payment|confirm|secure)\b/i],
  },
  {
    intent: "reschedule",
    patterns: [/\b(reschedule|change|move|postpone|cancel|different.?time)\b/i],
  },
  {
    intent: "schedule",
    patterns: [
      /\b(hour|open|timing|available|when|today|salon|location|branch)\b/i,
    ],
  },
  {
    intent: "complaint",
    patterns: [
      /\b(complain|unhappy|not happy|refund|speak to|manager|human)\b/i,
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
