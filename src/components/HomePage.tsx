"use client";

import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import FreeAuditSection from "@/components/FreeAuditSection";
import Services from "@/components/Services";
import Features from "@/components/Features";
import Testimonials from "@/components/Testimonials";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <FreeAuditSection />
      <Services />
      <Features />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}
