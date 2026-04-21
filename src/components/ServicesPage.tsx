"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { Bot, Star, Monitor, TrendingUp, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";

const aiReceptionist = {
  icon: Bot,
  title: "AI Receptionist",
  description:
    "24/7 AI-powered receptionists that answer calls, book appointments, and never miss a lead. Your business, always on.",
  features: ["24/7 Availability", "Natural Conversations", "Appointment Booking", "Lead Capture"],
  gradient: "from-primary to-cyan-400",
};

const otherServices: {
  icon: LucideIcon;
  title: string;
  description: string;
  features: string[];
  gradient: string;
}[] = [
  {
    icon: Star,
    title: "Review Generation",
    description:
      "Automatically collect and boost your Google reviews. Turn happy customers into your best marketing asset.",
    features: ["Automated Follow-ups", "Review Monitoring", "Response Templates", "Analytics Dashboard"],
    gradient: "from-secondary to-pink-500",
  },
  {
    icon: Monitor,
    title: "Web Design",
    description:
      "Premium websites that convert visitors into customers. Stunning designs backed by conversion science.",
    features: ["Custom Design", "Mobile Optimized", "SEO Ready", "Fast Loading"],
    gradient: "from-primary to-secondary",
  },
  {
    icon: TrendingUp,
    title: "Automation",
    description:
      "Supercharge your pipeline with AI-driven workflows. More appointments, more consultations, more revenue.",
    features: ["Book More Appts", "Schedule Consultations", "Lead Nurturing", "Pipeline Automation"],
    gradient: "from-cyan-400 to-primary",
  },
];

export default function ServicesPage() {
  const PrimaryIcon = aiReceptionist.icon;

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-28 md:pt-32">
        <section className="relative pb-16 md:pb-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-muted/15 via-transparent to-transparent pointer-events-none" />
          <div className="container mx-auto px-6 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55 }}
            >
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">247ROI</span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold mt-4 mb-6 leading-tight">
                AI &amp; <span className="gradient-text">Automation Services</span>
              </h1>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg leading-relaxed">
                Every system we install is aimed at one thing: more captured revenue — calls answered, leads followed
                up, and opportunities turned into dollars, around the clock.
              </p>
            </motion.div>
          </div>
        </section>

        <section id="ai-receptionist" className="pb-12 md:pb-16 scroll-mt-28">
          <div className="container mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 36 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.65 }}
              className="relative max-w-6xl mx-auto rounded-3xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/25 via-secondary/15 to-primary/10" />
              <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-primary/20 blur-3xl pointer-events-none" />
              <div className="absolute -bottom-32 -left-20 w-80 h-80 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none" />

              <div className="relative rounded-3xl border border-primary/25 glass-strong shadow-[0_0_80px_hsl(174_72%_56%/0.14),inset_0_1px_0_rgba(255,255,255,0.06)]">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

                <div className="relative p-8 md:p-12 lg:p-16 lg:grid lg:grid-cols-12 lg:gap-12 lg:items-center">
                  <div className="lg:col-span-7">
                    <span className="inline-flex items-center rounded-full border border-primary/35 bg-primary/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary mb-6">
                      Primary focus
                    </span>
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-foreground mb-5 flex flex-wrap items-center gap-3">
                      {aiReceptionist.title}
                      <ArrowUpRight className="hidden sm:inline w-8 h-8 text-primary shrink-0" aria-hidden />
                    </h2>
                    <p className="text-muted-foreground text-lg leading-relaxed mb-8 max-w-xl">
                      {aiReceptionist.description}
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-3 max-w-xl">
                      {aiReceptionist.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-center gap-3 text-sm text-foreground/90 rounded-xl border border-white/[0.08] bg-background/40 px-4 py-3 backdrop-blur-sm"
                        >
                          <span className="w-2 h-2 rounded-full bg-primary shrink-0 shadow-[0_0_10px_hsl(174_72%_56%/0.8)]" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="lg:col-span-5 mt-12 lg:mt-0 flex justify-center lg:justify-end">
                    <div className="relative">
                      <div
                        className={`absolute inset-0 rounded-[2rem] bg-gradient-to-br ${aiReceptionist.gradient} opacity-35 blur-2xl scale-110`}
                        aria-hidden
                      />
                      <div
                        className={`relative flex h-52 w-52 sm:h-64 sm:w-64 items-center justify-center rounded-[2rem] bg-gradient-to-br ${aiReceptionist.gradient} shadow-2xl ring-1 ring-white/20`}
                      >
                        <PrimaryIcon className="w-24 h-24 sm:w-32 sm:h-32 text-primary-foreground drop-shadow-lg" strokeWidth={1.25} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="py-20 md:py-24 relative overflow-hidden border-t border-border/40 scroll-mt-28">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/15 to-transparent pointer-events-none" />

          <div className="container mx-auto px-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55 }}
              className="text-center mb-14 md:mb-16"
            >
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">Also available</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-5">
                Other <span className="gradient-text">services</span>
              </h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-lg leading-relaxed">
                Same build quality — stacked behind the receptionist because that&apos;s where most revenue leaks
                happen first.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {otherServices.map((service, index) => {
                const Icon = service.icon;
                return (
                  <motion.div
                    key={service.title}
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.55, delay: index * 0.1 }}
                    whileHover={{ y: -8, transition: { duration: 0.3 } }}
                    className="group relative"
                  >
                    <div className="glass rounded-2xl p-8 h-full relative overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] transition-shadow duration-500">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div
                        className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <Icon className="w-7 h-7 text-primary-foreground" />
                      </div>

                      <h3 className="text-xl font-display font-bold text-foreground mb-4 flex items-center gap-2">
                        {service.title}
                        <ArrowUpRight className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </h3>
                      <p className="text-muted-foreground mb-6">{service.description}</p>

                      <ul className="space-y-2">
                        {service.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                            {feature}
                          </li>
                        ))}
                      </ul>

                      <div
                        className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${service.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <CTA />
      </main>

      <Footer />
    </div>
  );
}
