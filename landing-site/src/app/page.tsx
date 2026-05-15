import { Hero } from "@/components/home/Hero";
import { ProblemSolution } from "@/components/home/ProblemSolution";
import { OmniChannel } from "@/components/home/OmniChannel";
import { HowItWorks } from "@/components/home/HowItWorks";
import { IndustryCards } from "@/components/home/IndustryCards";
import { StatsCounter } from "@/components/home/StatsCounter";
import { FeatureGrid } from "@/components/home/FeatureGrid";
import { ChannelComparison } from "@/components/home/ChannelComparison";
import { MultiChannelDemo } from "@/components/home/MultiChannelDemo";
import { ROICalculator } from "@/components/home/ROICalculator";
import { ComparisonTable } from "@/components/home/ComparisonTable";
import { PricingPreview } from "@/components/home/PricingPreview";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function HomePage() {
  return (
    <>
      <Hero />
      <ProblemSolution />
      <OmniChannel />
      <HowItWorks />
      <IndustryCards />
      <StatsCounter />
      <FeatureGrid />
      <ChannelComparison />
      <MultiChannelDemo />
      <ROICalculator />
      <ComparisonTable />
      <PricingPreview />
      <FinalCTA />
    </>
  );
}
