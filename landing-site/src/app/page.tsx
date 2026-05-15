import { Hero } from "@/components/home/Hero";
import { ProblemSolution } from "@/components/home/ProblemSolution";
import { HowItWorks } from "@/components/home/HowItWorks";
import { IndustryCards } from "@/components/home/IndustryCards";
import { StatsCounter } from "@/components/home/StatsCounter";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { ComparisonTable } from "@/components/home/ComparisonTable";
import { PricingPreview } from "@/components/home/PricingPreview";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSolution />
      <HowItWorks />
      <IndustryCards />
      <StatsCounter />
      <FeatureGrid />
      <ComparisonTable />
      <PricingPreview />
      <FinalCTA />
    </>
  );
}
