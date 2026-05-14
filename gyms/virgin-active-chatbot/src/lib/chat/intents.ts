import type { Intent } from "@/types";

interface Rule {
  intent: Intent;
  patterns: RegExp[];
}

const RULES: Rule[] = [
  {
    intent: "trial_class",
    patterns: [
      /\b(trial|try|first.?time|complimentary|free class|newcomer|new to)\b/i,
    ],
  },
  {
    intent: "class_booking",
    patterns: [
      /\b(book|class|session|yoga|hiit|spinning|boxing|aqua|pilates|schedule|timetable)\b/i,
    ],
  },
  {
    intent: "membership",
    patterns: [
      /\b(membership|join|sign.?up|plan|monthly|cancel|freeze|pause|tier|classic|plus|premium)\b/i,
    ],
  },
  {
    intent: "fees",
    patterns: [
      /\b(price|cost|how much|fee|monthly|\$99|\$139|\$179)\b/i,
    ],
  },
  {
    intent: "schedule",
    patterns: [
      /\b(hour|open|close|timing|when|today|location|club|pool|facilities)\b/i,
    ],
  },
  {
    intent: "complaint",
    patterns: [
      /\b(complain|unhappy|broken|wrong|refund|speak to|human|manager)\b/i,
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
