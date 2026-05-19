"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import WhatThisDoes from "@/components/WhatThisDoes";
import WhereItWorks from "@/components/WhereItWorks";
import HomeSetupCallSection from "@/components/HomeSetupCallSection";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <WhatThisDoes />
      <WhereItWorks />
      <HomeSetupCallSection />
      <Footer />
    </div>
  );
}
