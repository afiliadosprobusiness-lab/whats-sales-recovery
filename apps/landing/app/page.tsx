import { CTASection } from "@/components/cta-section";
import { Footer } from "@/components/footer";
import { HeroSection } from "@/components/hero";
import { HowItWorks } from "@/components/steps-section";
import { Navbar } from "@/components/navbar";
import { ProblemSection } from "@/components/problem-section";
import { ProductPreview } from "@/components/product-preview";
import { ResultsSection } from "@/components/metrics-section";
import { SolutionSection } from "@/components/solution-section";

export default function LandingPage(): JSX.Element {
  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <Navbar />
      <main className="overflow-x-clip">
        <HeroSection />
        <ProblemSection />
        <SolutionSection />
        <ResultsSection />
        <ProductPreview />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
