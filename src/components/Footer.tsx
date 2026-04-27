"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";
import { SITE_LOGO_ALT, SITE_LOGO_PATH } from "@/lib/siteLogo";

const footerColumns: {
  title: string;
  links: { label: string; href: string }[];
}[] = [
  {
    title: "Product",
    links: [
      { label: "Services", href: "/services" },
      { label: "What this does", href: "/#what-it-does" },
      { label: "Where it works", href: "/#where-it-works" },
      { label: "Free audit (calculator)", href: "/#free-audit" },
      { label: "Try free", href: "#contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Us", href: "#contact" },
      { label: "Contact", href: "#contact" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Calculator", href: "/#free-audit" },
      { label: "Guarantee", href: "/guarantee" },
      { label: "Support", href: "mailto:contact@247roi.com" },
      { label: "Book a call", href: "/#book-call" },
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
              <Link href="/" className="inline-flex mb-4 rounded-lg overflow-hidden ring-1 ring-white/10 px-1.5 py-1 bg-black/40">
                <Image
                  src={SITE_LOGO_PATH}
                  alt={SITE_LOGO_ALT}
                  width={200}
                  height={48}
                  className="h-10 w-auto max-w-[220px] object-contain object-left"
                />
              </Link>
              <p className="text-muted-foreground text-sm max-w-xs">
                Systems that generate ROI around the clock — capture leads, book revenue, and keep pipeline moving
                while you sleep.
              </p>
              <a
                href={PRIMARY_PHONE_HREF}
                className="inline-block mt-4 text-sm text-muted-foreground hover:text-primary transition-colors tabular-nums"
              >
                {PRIMARY_PHONE_DISPLAY}
              </a>
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
