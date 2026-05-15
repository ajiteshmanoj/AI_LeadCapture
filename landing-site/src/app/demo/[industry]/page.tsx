import { notFound } from "next/navigation";
import { getIndustry, industries } from "@/lib/industries";
import { DemoPageClient } from "./DemoPageClient";

export async function generateStaticParams() {
  return industries.map((i) => ({ industry: i.slug }));
}

export async function generateMetadata({ params }: { params: { industry: string } }) {
  const industry = getIndustry(params.industry);
  if (!industry) return {};
  return {
    title: `${industry.name} AI Demo — FrontDesk AI`,
    description: `Try a live AI chatbot for ${industry.demoClient}. Ask about pricing, bookings, and more.`,
  };
}

export default function DemoPage({ params }: { params: { industry: string } }) {
  const industry = getIndustry(params.industry);
  if (!industry) notFound();
  return <DemoPageClient industry={industry} />;
}
