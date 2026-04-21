"use client";

import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Mitchell",
    role: "Owner, Mitchell Dental",
    content:
      "247ROI's AI receptionist has been a game-changer. We went from missing 30% of calls to capturing every single lead. Our reviews jumped from 3.8 to 4.9 stars in just 3 months.",
    rating: 5,
    image: "SM",
  },
  {
    name: "David Chen",
    role: "CEO, Premier Auto Group",
    content:
      "The ROI speaks for itself. We've seen a 400% increase in booked appointments and our Google ranking has skyrocketed thanks to the review system.",
    rating: 5,
    image: "DC",
  },
  {
    name: "Jessica Williams",
    role: "Director, Luxe Real Estate",
    content:
      "Not only did they build us a stunning website, but the AI handles our after-hours inquiries perfectly. It's like having a 24/7 sales team.",
    rating: 5,
    image: "JW",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24 relative overflow-hidden scroll-mt-28">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Testimonials</span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold mt-4 mb-6">
            Loved by <span className="gradient-text">500+ Businesses</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Don&apos;t just take our word for it. Here&apos;s what our clients have to say about working with 247ROI.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              whileHover={{ y: -5, transition: { duration: 0.3 } }}
              className="group"
            >
              <div className="glass rounded-2xl p-8 h-full relative">
                <Quote className="w-10 h-10 text-primary/20 absolute top-6 right-6" />

                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>

                <p className="text-muted-foreground mb-8 leading-relaxed">&ldquo;{testimonial.content}&rdquo;</p>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <span className="text-primary-foreground font-semibold text-sm">{testimonial.image}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">{testimonial.name}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 text-center"
        >
          <p className="text-muted-foreground text-sm mb-6">Trusted by leading businesses across industries</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-50">
            {["Google Partner", "Meta Certified", "HubSpot", "Salesforce", "Stripe"].map((brand) => (
              <div key={brand} className="text-muted-foreground font-display font-semibold text-lg">
                {brand}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
