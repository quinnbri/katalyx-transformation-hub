import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import StatsBar from "@/components/landing/StatsBar";
import HowItWorks from "@/components/landing/HowItWorks";
import Features from "@/components/landing/Features";
import WhyFail from "@/components/landing/WhyFail";
import Creator from "@/components/landing/Creator";
import FinalCTA from "@/components/landing/FinalCTA";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <Hero />
        <StatsBar />
        <HowItWorks />
        <Features />
        <WhyFail />
        <Creator />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
