export interface Industry {
  slug: string;
  name: string;
  icon: string;
  demoClient: string;
  description: string;
  suggestedQuestions: string[];
  widgetOrgId: string;
  widgetApiUrl: string;
  features: string[];
  color: string;
}

export const industries: Industry[] = [
  {
    slug: "tuition-centres",
    name: "Tuition Centres",
    icon: "📚",
    demoClient: "Zenith Education Studio",
    description:
      "AI assistant trained on real tuition centre data — fees, schedules, trial bookings, and 3 locations across Singapore.",
    suggestedQuestions: [
      "How much is JC1 H2 Math tuition?",
      "Do you have trial classes?",
      "Where is your Jurong East centre?",
      "Is there Sec 2 A-Math on Saturdays?",
      "What's your registration fee?",
    ],
    widgetOrgId: "YOUR_ZENITH_ORG_ID",
    widgetApiUrl: "https://your-tuition-app.vercel.app",
    features: ["Fee enquiries", "Trial booking", "Schedule lookup", "Waitlist", "3 locations"],
    color: "#4F46E5",
  },
  {
    slug: "hair-salons",
    name: "Hair Salons",
    icon: "💇",
    demoClient: "Jean Yip Group",
    description:
      "Book appointments, check service pricing, and reduce no-shows with deposit collection.",
    suggestedQuestions: [
      "How much is a haircut and colour?",
      "Can I book for this Saturday?",
      "Which stylist does balayage?",
      "What's the cancellation policy?",
    ],
    widgetOrgId: "YOUR_JEANYIP_ORG_ID",
    widgetApiUrl: "https://your-salon-app.vercel.app",
    features: ["Appointment booking", "Service pricing", "Stylist recommendation", "Deposit collection"],
    color: "#C9A96E",
  },
  {
    slug: "clinics",
    name: "Clinics",
    icon: "🏥",
    demoClient: "Raffles Medical Group",
    description:
      "Handle appointment requests, answer Medisave and insurance questions, reduce phone queue pressure.",
    suggestedQuestions: [
      "How much is a GP consultation?",
      "Can I use Medisave?",
      "Do you accept walk-ins?",
      "What should I bring for my first visit?",
    ],
    widgetOrgId: "YOUR_RAFFLES_ORG_ID",
    widgetApiUrl: "https://your-clinic-app.vercel.app",
    features: ["Appointment booking", "Medisave info", "Insurance queries", "Walk-in availability"],
    color: "#003087",
  },
  {
    slug: "restaurants",
    name: "Restaurants",
    icon: "🍜",
    demoClient: "Din Tai Fung Singapore",
    description:
      "Menu enquiries, table reservations, catering quotes, and dietary requirements — all handled instantly.",
    suggestedQuestions: [
      "Is Din Tai Fung Halal?",
      "Can I book a table for 4 on Saturday?",
      "What are your most popular dishes?",
      "Do you have vegetarian options?",
    ],
    widgetOrgId: "YOUR_DTF_ORG_ID",
    widgetApiUrl: "https://your-fnb-app.vercel.app",
    features: ["Table reservations", "Menu queries", "Dietary info", "Catering enquiries"],
    color: "#8B0000",
  },
  {
    slug: "gyms",
    name: "Gyms & Fitness",
    icon: "🏋️",
    demoClient: "Virgin Active Singapore",
    description:
      "Class schedules, membership plans, trial bookings — convert prospects into members automatically.",
    suggestedQuestions: [
      "How much is a membership?",
      "Can I try a class for free?",
      "What yoga classes do you have?",
      "Do you have a pool at Novena?",
    ],
    widgetOrgId: "YOUR_VIRGIN_ORG_ID",
    widgetApiUrl: "https://your-gym-app.vercel.app",
    features: ["Class schedules", "Membership info", "Trial bookings", "Facility queries"],
    color: "#E3000F",
  },
  {
    slug: "property",
    name: "Property Agents",
    icon: "🏠",
    demoClient: "Huttons Asia",
    description:
      "Answer listing questions, qualify leads automatically, and book viewings — respond to hot leads in seconds.",
    suggestedQuestions: [
      "Can foreigners buy HDB?",
      "What is ABSD for Singapore PRs?",
      "Do you have 3BR condos under $1.5M?",
      "I want to book a viewing",
    ],
    widgetOrgId: "YOUR_HUTTONS_ORG_ID",
    widgetApiUrl: "https://your-property-app.vercel.app",
    features: ["Listing queries", "Lead qualification", "Viewing booking", "ABSD calculator"],
    color: "#1A3C5E",
  },
];

export function getIndustry(slug: string): Industry | undefined {
  return industries.find((i) => i.slug === slug);
}
