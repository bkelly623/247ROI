"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";
import {
  SITE_LOGO_ALT,
  SITE_LOGO_INTRINSIC,
  SITE_LOGO_PATH,
  siteLogoFooterImageClassName,
} from "@/lib/siteLogo";

const footerColumns: {
  title: string;
  links: { label: string; href: string }[];
}[] = [
  {
    title: "Systems",
    links: [
      { label: "Services", href: "/services" },
      { label: "Business systems audit", href: "/hire" },
      { label: "Process automation", href: "/business-process-automation-consultant" },
      { label: "Workflow automation", href: "/workflow-automation-consultant" },
      { label: "Internal tools", href: "/internal-tools-for-small-business" },
    ],
  },
  {
    title: "AI Agents",
    links: [
      { label: "AI agent roles", href: "/ai-employees" },
      { label: "Custom AI agents", href: "/ai-agents-for-business" },
      { label: "AI automation consultant", href: "/ai-automation-consultant-small-business" },
      { label: "AI Estimator", href: "/ai-estimator" },
    ],
  },
  {
    title: "Tools",
    links: [
      { label: "Articles", href: "/articles" },
      { label: "What to automate first", href: "/what-should-my-business-automate-first" },
      { label: "Admin workflow teardown", href: "/articles/admin-workflow-your-team-should-stop-doing-by-hand" },
      { label: "AI visibility checklist", href: "/articles/local-business-ai-visibility-checklist" },
      { label: "Custom dashboards", href: "/custom-business-dashboard" },
      { label: "ROI calculator", href: "/ai-employee-roi-calculator" },
      { label: "Missed-call calculator", href: "/missed-call-calculator" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Contact", href: "/contact" },
      { label: "Referral partners", href: "/referral-partners" },
      { label: "AI Opportunity Audit", href: "/hire" },
      { label: "AI visibility", href: "/ai-visibility-optimization" },
      { label: "GEO consultant", href: "/generative-engine-optimization-consultant" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms-of-service" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="py-16 border-t border-border">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link
                href="/"
                className="inline-flex mb-4 rounded-lg overflow-hidden ring-1 ring-white/10 px-2 py-1.5 bg-black/40"
              >
                <Image
                  src={SITE_LOGO_PATH}
                  alt={SITE_LOGO_ALT}
                  width={SITE_LOGO_INTRINSIC.width}
                  height={SITE_LOGO_INTRINSIC.height}
                  className={siteLogoFooterImageClassName}
                />
              </Link>
              <p className="text-muted-foreground text-sm max-w-sm">
                Custom automations, dashboards, internal apps, AI agents, and business systems for owners who want cleaner operations and visible ROI.
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
              transition={{ duration: 0.5, delay: 0.08 * index }}
              className="col-span-1"
            >
              <h3 className="font-semibold text-foreground mb-4">{col.title}</h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-muted-foreground text-sm hover:text-primary transition-colors duration-200">
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
          transition={{ duration: 0.5, delay: 0.2 }}
          className="pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <p className="text-muted-foreground text-sm">© {new Date().getFullYear()} 247ROI. All rights reserved.</p>
          <p className="text-muted-foreground text-xs">Built for businesses that want cleaner systems and faster operations.</p>
        </motion.div>
      </div>
    </footer>
  );
}
