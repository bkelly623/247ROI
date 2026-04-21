"use client";

import { motion } from "framer-motion";
import { Zap, Shield, TrendingUp, Clock, Users, BarChart3 } from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Lightning Fast Setup",
    description: "Get up and running in minutes, not weeks. Our AI learns your business instantly.",
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and compliance. Your data is always safe with us.",
  },
  {
    icon: TrendingUp,
    title: "Proven ROI",
    description: "Track calls, bookings, and pipeline impact — real numbers, not vanity metrics.",
  },
  {
    icon: Clock,
    title: "24/7 Availability",
    description: "Never miss a call again. AI that works while you sleep.",
  },
  {
    icon: Users,
    title: "Human Handoff",
    description: "Seamless transfer to your team when needed. AI + human, perfectly balanced.",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description: "Track every call, review, and conversion. Data-driven decisions made easy.",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 relative overflow-hidden scroll-mt-28">
      <div className="container mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Why Choose Us</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-6">
              Built for ROI That <span className="gradient-text">Doesn&apos;t Sleep</span>
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              We don&apos;t sell software for its own sake — we deploy systems that capture opportunities and turn
              them into revenue while you&apos;re off the clock.
            </p>

            <div className="grid grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="glass rounded-xl p-6"
              >
                <div className="font-display font-semibold text-foreground leading-snug">Always-on capture</div>
                <div className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  Inbound handled when you&apos;re busy or closed.
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="glass rounded-xl p-6"
              >
                <div className="font-display font-semibold text-foreground leading-snug">Clean handoff</div>
                <div className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  AI first — your team when it matters.
                </div>
              </motion.div>
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className="group"
              >
                <div className="glass rounded-xl p-6 h-full hover:border-primary/30 transition-colors duration-300">
                  <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-4 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all duration-300">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
