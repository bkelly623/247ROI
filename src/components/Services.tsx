"use client";

import { motion } from "framer-motion";
import { Bot, Star, Monitor, TrendingUp, ArrowUpRight } from "lucide-react";

const services = [
  {
    icon: Bot,
    title: "AI Receptionists",
    description:
      "24/7 AI-powered receptionists that answer calls, book appointments, and never miss a lead. Your business, always on.",
    features: ["24/7 Availability", "Natural Conversations", "Appointment Booking", "Lead Capture"],
    gradient: "from-primary to-cyan-400",
  },
  {
    icon: Star,
    title: "5-Star Review Generation",
    description:
      "Automatically collect and boost your Google reviews. Turn happy customers into your best marketing asset.",
    features: ["Automated Follow-ups", "Review Monitoring", "Response Templates", "Analytics Dashboard"],
    gradient: "from-secondary to-pink-500",
  },
  {
    icon: Monitor,
    title: "High-End Web Design",
    description:
      "Premium websites that convert visitors into customers. Stunning designs backed by conversion science.",
    features: ["Custom Design", "Mobile Optimized", "SEO Ready", "Fast Loading"],
    gradient: "from-primary to-secondary",
  },
  {
    icon: TrendingUp,
    title: "Increase Lead Flow",
    description:
      "Supercharge your pipeline with AI-driven lead generation. More appointments, more consultations, more revenue.",
    features: ["Book More Appts", "Schedule Consultations", "Lead Nurturing", "Pipeline Automation"],
    gradient: "from-cyan-400 to-primary",
  },
];

export default function Services() {
  return (
    <section id="services" className="py-24 relative overflow-hidden scroll-mt-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/20 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Our Services</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-6">
            Everything Your Business <span className="gradient-text">Needs to Grow</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Every system we install is aimed at one thing: more captured revenue — calls answered, leads followed
            up, and opportunities turned into dollars, around the clock.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
              className="group relative"
            >
              <div className="glass rounded-2xl p-8 h-full relative overflow-hidden shadow-[0_0_40px_rgba(255,255,255,0.1)] hover:shadow-[0_0_60px_rgba(255,255,255,0.15)] transition-shadow duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}
                >
                  <service.icon className="w-7 h-7 text-primary-foreground" />
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
          ))}
        </div>
      </div>
    </section>
  );
}
