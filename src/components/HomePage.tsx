"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FreeAuditSection from "@/components/FreeAuditSection";
import WhatThisDoes from "@/components/WhatThisDoes";
import WhereItWorks from "@/components/WhereItWorks";
import CurrentCampaignSection from "@/components/CurrentCampaignSection";
import HomeSetupCallSection from "@/components/HomeSetupCallSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FreeAuditSection />
      <WhatThisDoes />
      <WhereItWorks />
      <CurrentCampaignSection />
      <HomeSetupCallSection />
      <Footer />
    </div>
  );
}
