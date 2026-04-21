"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

const footerColumns: {
  title: string;
  links: { label: string; href: string }[];
}[] = [
  {
    title: "Services",
    links: [
      { label: "AI Receptionists", href: "#services" },
      { label: "Review Generation", href: "#services" },
      { label: "Web Design", href: "#services" },
      { label: "Automation", href: "#services" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#contact" },
      { label: "Case Studies", href: "#testimonials" },
      { label: "Careers", href: "#contact" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Free audit (calculator)", href: "/#free-audit" },
      { label: "Guarantee", href: "/guarantee" },
      { label: "Support", href: "mailto:contact@247roi.com" },
      { label: "Book a call", href: "/calendar" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
      { label: "Cookie Policy", href: "/privacy-policy" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-1">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span className="inline-flex rounded-lg overflow-hidden ring-1 ring-white/10">
                  <Image src="/logo-robot.png" alt="247ROI" width={40} height={40} className="h-10 w-auto bg-card" />
                </span>
                <span className="font-display font-bold text-xl text-foreground">247ROI</span>
              </Link>
              <p className="text-muted-foreground text-sm max-w-xs">
                Systems that generate ROI around the clock — capture leads, book revenue, and keep pipeline moving
                while you sleep.
              </p>
            </motion.div>
          </div>

          {footerColumns.map((col, index) => (
            <motion.div
              key={col.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <h3 className="font-semibold text-foreground mb-4">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-muted-foreground text-sm hover:text-primary transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} 247ROI. All rights reserved.</p>
          <div className="flex gap-6">
            {["Twitter", "LinkedIn", "Instagram"].map((social) => (
              <span
                key={social}
                className="text-muted-foreground text-sm cursor-default opacity-60"
                aria-hidden
              >
                {social}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
