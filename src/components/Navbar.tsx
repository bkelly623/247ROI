"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CTA_LABEL_NAV, PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";
import {
  SITE_LOGO_ALT,
  SITE_LOGO_INTRINSIC,
  SITE_LOGO_PATH,
  siteLogoNavImageClassName,
} from "@/lib/siteLogo";

const navLinks = [
  { name: "AI Audit", href: "/hire" },
  { name: "AI Employees", href: "/ai-employees" },
  { name: "Examples", href: "/demo" },
  { name: "Pricing", href: "/pricing" },
  { name: "About", href: "/about" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] glass-strong backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
      >
        <div className="container mx-auto px-4 py-2 sm:px-6 lg:py-3">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center group shrink-0" onClick={() => setIsOpen(false)}>
              <span className="inline-flex rounded-md overflow-hidden ring-1 ring-white/10 px-1.5 py-1 bg-black/40 sm:rounded-lg sm:px-2">
                <Image
                  src={SITE_LOGO_PATH}
                  alt={SITE_LOGO_ALT}
                  width={SITE_LOGO_INTRINSIC.width}
                  height={SITE_LOGO_INTRINSIC.height}
                  className={`${siteLogoNavImageClassName} transition-transform group-hover:scale-[1.02]`}
                  priority
                />
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-5 xl:gap-7 relative flex-1 justify-end min-w-0">
              <div
                className="absolute inset-0 -inset-x-12 -inset-y-4 pointer-events-none"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.2) 35%, transparent 75%)",
                  filter: "blur(18px)",
                }}
              />
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.name}
                  href={link.href}
                  className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm font-medium relative z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.6)] whitespace-nowrap"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 * index, duration: 0.35 }}
                  whileHover={{ y: -2 }}
                >
                  {link.name}
                </motion.a>
              ))}

              <a
                href={PRIMARY_PHONE_HREF}
                className="relative z-10 flex items-center gap-2 font-display font-semibold text-foreground tabular-nums tracking-tight text-sm xl:text-base hover:text-primary transition-colors whitespace-nowrap shrink-0"
              >
                <Phone className="w-4 h-4 text-primary shrink-0" aria-hidden />
                {PRIMARY_PHONE_DISPLAY}
              </a>
              <Button
                asChild
                size="lg"
                className="relative z-10 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 xl:px-8 text-sm font-semibold shadow-[0_0_24px_hsl(174_72%_56%/0.25)] whitespace-nowrap"
              >
                <Link href="/hire">{CTA_LABEL_NAV}</Link>
              </Button>
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(true)}
              className="lg:hidden text-foreground p-2 shrink-0 rounded-lg hover:bg-white/[0.06]"
              aria-label="Open menu"
              aria-expanded={isOpen}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </motion.nav>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[2147483646] bg-background lg:hidden"
          >
            <div className="relative flex min-h-dvh flex-col px-5 pb-6 pt-3">
              <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
                <Link href="/" className="flex items-center group shrink-0" onClick={() => setIsOpen(false)}>
                  <span className="inline-flex rounded-md overflow-hidden ring-1 ring-white/10 px-1.5 py-1 bg-black/40">
                    <Image
                      src={SITE_LOGO_PATH}
                      alt={SITE_LOGO_ALT}
                      width={SITE_LOGO_INTRINSIC.width}
                      height={SITE_LOGO_INTRINSIC.height}
                      className={siteLogoNavImageClassName}
                      priority
                    />
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-lg p-2 text-foreground hover:bg-white/[0.06]"
                  aria-label="Close menu"
                >
                  <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto border-t border-white/10 py-6">
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="rounded-lg px-4 py-4 text-lg font-semibold text-foreground transition-colors hover:bg-white/[0.06]"
                      onClick={() => setIsOpen(false)}
                    >
                      {link.name}
                    </Link>
                  ))}
                  <a
                    href={PRIMARY_PHONE_HREF}
                    className="mt-2 flex items-center gap-3 rounded-lg px-4 py-4 font-display text-lg font-semibold text-foreground tabular-nums transition-colors hover:bg-white/[0.06]"
                    onClick={() => setIsOpen(false)}
                  >
                    <Phone className="h-5 w-5 text-primary" aria-hidden />
                    {PRIMARY_PHONE_DISPLAY}
                  </a>
                </div>
              </div>
              <Button
                asChild
                size="lg"
                className="min-h-[3.5rem] w-full rounded-full bg-primary px-6 font-semibold text-primary-foreground hover:bg-primary/90"
              >
                <Link href="/hire" onClick={() => setIsOpen(false)}>
                  {CTA_LABEL_NAV}
                </Link>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
