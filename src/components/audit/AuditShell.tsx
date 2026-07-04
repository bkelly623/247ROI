import Link from "next/link";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { BRAND } from "@/lib/audit/config";

export function AuditShell({
  children,
  compact = false,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {!compact && (
        <div className="border-b border-border/60 bg-card/30 px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest text-primary">
                {BRAND.tagline}
              </p>
              <p className="text-sm text-muted-foreground">{BRAND.subtitle}</p>
            </div>
            <a
              href={BRAND.phoneHref}
              className="hidden text-sm text-muted-foreground hover:text-primary sm:block"
            >
              {BRAND.phoneDisplay}
            </a>
          </div>
        </div>
      )}
      {children}
      <Footer />
    </div>
  );
}

export function AuditBrandLink() {
  return (
    <Link href="/audit" className="text-primary hover:underline">
      Run Free Audit
    </Link>
  );
}
