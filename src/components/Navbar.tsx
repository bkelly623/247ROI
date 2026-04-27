"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";
import { SITE_LOGO_ALT, SITE_LOGO_PATH } from "@/lib/siteLogo";

const navLinks = [
  { name: "Free audit", href: "/#free-audit" },
  { name: "Services", href: "/services" },
  { name: "What it does", href: "/#what-it-does" },
  { name: "Where it works", href: "/#where-it-works" },
  { name: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] glass-strong backdrop-blur-xl supports-[backdrop-filter]:bg-background/70"
    >
      <div className="container mx-auto px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center group shrink-0" onClick={() => setIsOpen(false)}>
            <span className="inline-flex rounded-lg overflow-hidden ring-1 ring-white/10 px-1.5 py-0.5 bg-black/40">
              <Image
                src={SITE_LOGO_PATH}
                alt={SITE_LOGO_ALT}
                width={160}
                height={40}
                className="h-8 w-auto max-h-9 max-w-[min(180px,52vw)] object-contain object-left transition-transform group-hover:scale-[1.02]"
                priority
              />
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-6 xl:gap-8 relative flex-1 justify-end min-w-0">
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
              <Link href="/#book-call">Book a Setup Call</Link>
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden text-foreground p-2 shrink-0"
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="lg:hidden mt-4 pb-4 overflow-hidden border-t border-border/40 pt-4"
            >
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <a
                    key={link.name}
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors duration-300 text-sm font-medium"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.name}
                  </a>
                ))}
                <a
                  href={PRIMARY_PHONE_HREF}
                  className="flex items-center gap-2 font-display font-semibold text-foreground tabular-nums w-fit"
                  onClick={() => setIsOpen(false)}
                >
                  <Phone className="w-4 h-4 text-primary" aria-hidden />
                  {PRIMARY_PHONE_DISPLAY}
                </a>
                <Button
                  asChild
                  size="lg"
                  className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-6 font-semibold w-fit"
                >
                  <Link href="/#book-call" onClick={() => setIsOpen(false)}>
                    Book a Setup Call
                  </Link>
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
