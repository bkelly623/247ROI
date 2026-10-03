import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ContactForm } from "@/components/contact/ContactForm";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";
export const metadata: Metadata = { title: "Contact 247ROI | Lead Capture, Custom Software & AI", description: "Talk with Brendan about missed-call text back, AI receptionists, automated workflows or a custom dashboard. No audit required.", alternates: { canonical: "/contact" } };
export default function ContactPage() {
  return <div className="min-h-screen bg-background text-foreground"><Navbar /><main className="container mx-auto grid gap-10 px-6 pb-20 pt-32 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:pt-40">
    <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Talk with Brendan</p><h1 className="mt-4 font-display text-4xl font-bold leading-tight sm:text-5xl">A practical next step for your business.</h1>
      <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">Need a better way to respond to leads? Or software that makes the work behind the scenes easier? Tell us what’s happening and what you’d like to change.</p>
      <div className="mt-8 space-y-4"><a href={PRIMARY_PHONE_HREF} data-track-event="phone_click" data-track-source="contact" className="inline-flex min-h-12 items-center rounded-full bg-orange-700 px-6 font-semibold text-primary-foreground">Call {PRIMARY_PHONE_DISPLAY}</a><p><a href="mailto:contact@247roi.com" data-track-event="email_click" data-track-source="contact" className="inline-block break-all py-2 font-semibold text-primary underline underline-offset-4">contact@247roi.com</a></p></div>
      <div className="mt-10 rounded-2xl border border-white/10 p-6"><h2 className="font-display text-xl font-semibold">What happens next</h2><ol className="mt-4 list-inside list-decimal space-y-3 text-sm leading-relaxed text-muted-foreground"><li>We review your inquiry and current setup.</li><li>We discuss what fits—and what doesn’t.</li><li>You get a clear scope and quote before committing.</li></ol><p className="mt-5 text-sm text-muted-foreground">No audit, payment, or SMS opt-in required to contact us.</p></div>
    </div><ContactForm />
  </main><Footer /></div>;
}
