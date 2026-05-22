import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import WhyFail from "@/components/landing/WhyFail";
import Consultation from "@/components/landing/Consultation";
import Creator from "@/components/landing/Creator";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";
import { Seo } from "@/components/Seo";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="KATALYX — AI-Powered Digital Transformation Advisor"
        description="Beat the 80% digital transformation failure rate. Get an AI-powered roadmap in 30 minutes, built on frameworks proven across 50+ enterprise rollouts."
        path="/"
      />
      <Header />
      <main>
        <Hero />
        <StatsBar />
        <HowItWorks />
        <Features />
        <WhyFail />
        <Consultation />
        <Creator />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
