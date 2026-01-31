import { CTASection } from "@/components/landing/CTASection";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { MarketPreview } from "@/components/landing/MarketPreview";
import { MarketTicker } from "@/components/landing/MarketTicker";
import { Navbar } from "@/components/landing/Navbar";

const LandingPage = () => {
  return (
    <main className="landing-theme min-h-screen bg-background text-foreground">
      <Navbar />
      <MarketTicker />
      <HeroSection />
      <FeaturesSection />
      <MarketPreview />
      <CTASection />
      <Footer />
    </main>
  );
};

export default LandingPage;
