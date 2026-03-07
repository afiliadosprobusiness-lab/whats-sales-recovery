import { CTASection } from "@/components/cta-section";
import { Hero } from "@/components/hero";
import { MetricsSection } from "@/components/metrics-section";
import { ProblemSection } from "@/components/problem-section";
import { SolutionSection } from "@/components/solution-section";
import { StepsSection } from "@/components/steps-section";

export default function LandingPage(): JSX.Element {
  return (
    <main className="landing">
      <Hero />
      <ProblemSection />
      <SolutionSection />
      <MetricsSection />
      <StepsSection />
      <CTASection />
    </main>
  );
}
