"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhatThisDoes from "@/components/WhatThisDoes";
import RevenueLossProof from "@/components/RevenueLossProof";
import DemoPreview from "@/components/DemoPreview";
import HowItInstalls from "@/components/HowItInstalls";
import NotAFit from "@/components/NotAFit";
import WhereItWorks from "@/components/WhereItWorks";
import ArchivedHomeSetupCallSection from "@/components/archived/ArchivedHomeSetupCallSection";
import Footer from "@/components/Footer";

export default function AiReceptionistHomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <WhatThisDoes />
      <RevenueLossProof />
      <DemoPreview />
      <HowItInstalls />
      <NotAFit />
      <WhereItWorks />
      <ArchivedHomeSetupCallSection />
      <Footer />
    </div>
  );
}
