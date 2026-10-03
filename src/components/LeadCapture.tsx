import Link from "next/link";
import { ArrowRight, MessageSquare, Phone, Workflow, Check } from "lucide-react";

export const MISSED_CALL_PATH = "/missed-call-text-back";
export const RECEPTIONIST_PATH = "/ai-employees/ai-receptionist";
export type LeadOffer = "missed-call-text-back" | "ai-receptionist";
export const offerContact = (offer: string) => `/contact?offer=${encodeURIComponent(offer)}`;
export const offerButton = "inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-700 px-6 py-3 text-center text-sm font-bold text-white transition-colors hover:bg-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-500";

export function LeadCaptureVisual({ voice = false }: { voice?: boolean }) {
  return <div className="rounded-[1.75rem] border border-white/15 bg-zinc-900 p-5 text-white shadow-2xl sm:p-7">
    <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4">
      <span className="text-sm font-semibold">{voice ? "A clearer handoff" : "Keep the conversation open"}</span>
      {voice ? <Phone className="h-5 w-5 text-orange-400" aria-hidden /> : <MessageSquare className="h-5 w-5 text-orange-400" aria-hidden />}
    </div>
    <p className="mt-4 text-xs uppercase tracking-widest text-zinc-400">Illustrative example · not a live demo</p>
    {voice ? <div className="mt-5 space-y-4">
      <p className="rounded-2xl bg-white/5 p-4 text-sm text-zinc-300">“Thanks for calling. I’m the virtual receptionist. How can I help?”</p>
      <div className="rounded-2xl border border-orange-400/25 bg-orange-400/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-orange-300">Call summary for your team</p>
        <dl className="mt-4 space-y-3 text-sm"><div><dt className="text-zinc-400">Request</dt><dd>Customer wants an estimate</dd></div><div><dt className="text-zinc-400">Availability</dt><dd>Tomorrow afternoon</dd></div><div><dt className="text-zinc-400">Next step</dt><dd>Team to confirm a suitable appointment</dd></div></dl>
      </div>
      <p className="text-xs leading-relaxed text-zinc-400">Built around your questions and handoff rules.</p>
    </div> : <div className="mt-5 space-y-4">
      <div className="flex items-center gap-3 rounded-xl bg-white/5 p-3 text-sm text-zinc-300"><Phone className="h-4 w-4 text-orange-400" aria-hidden /> A call comes in. You can’t pick up.</div>
      <div className="mr-5 rounded-2xl rounded-bl-sm bg-zinc-800 p-4 text-sm leading-relaxed">Sorry we missed your call to Example Services. How can we help? Reply STOP to opt out.</div>
      <div className="ml-10 rounded-2xl rounded-br-sm bg-orange-700 p-4 text-sm leading-relaxed">Can I get an estimate for tomorrow?</div>
      <div className="flex items-start gap-3 rounded-xl border border-white/10 p-4"><Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" aria-hidden /><p className="text-sm text-zinc-300">A conversation to follow up on—not just a missed-call notification.</p></div>
      <p className="text-xs leading-relaxed text-zinc-400">Your wording. Your follow-up process.</p>
    </div>}
  </div>;
}

export function LeadCaptureCards({ includeSystems = true }: { includeSystems?: boolean }) {
  const cards = [
    { title: "Missed-call text back", label: "Start simple", body: "Can’t answer? Give eligible missed callers a prompt text and a way to tell you what they need.", href: MISSED_CALL_PATH, icon: MessageSquare, cta: "Explore text back" },
    { title: "AI receptionist", label: "Answer the call", body: "Add overflow or after-hours answering, capture details, and hand the right next step to your team.", href: RECEPTIONIST_PATH, icon: Phone, cta: "Explore AI answering" },
    ...(includeSystems ? [{ title: "Custom business systems", label: "Improve the work behind it", body: "Connect your software, automate follow-up, and give your team a clearer dashboard of what needs attention.", href: "/services", icon: Workflow, cta: "Explore custom systems" }] : []),
  ];
  return <section id="lead-capture" className="scroll-mt-24 border-b border-zinc-200 bg-zinc-50 py-16 text-zinc-950 sm:py-20"><div className="container mx-auto px-5 sm:px-6">
    <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">More conversations. Less chasing.</p>
    <h2 className="mt-3 max-w-3xl font-display text-3xl font-bold sm:text-4xl">Start where opportunities are slipping away.</h2>
    <p className="mt-4 max-w-2xl leading-relaxed text-zinc-600">Respond while the customer is still looking. Then make the follow-through easier for your team.</p>
    <div className={`mt-8 grid gap-5 ${includeSystems ? "lg:grid-cols-3" : "md:grid-cols-2"}`}>{cards.map(card => { const Icon = card.icon; return <Link key={card.href} href={card.href} data-track-event="cta_click" data-track-label={card.title} data-track-source="lead_capture_cards" className="group flex flex-col rounded-2xl border border-zinc-200 bg-white p-6 transition-colors hover:border-orange-500 focus-visible:outline-orange-600">
      <div className="flex items-center justify-between gap-4"><span className="text-xs font-bold uppercase tracking-wider text-orange-700">{card.label}</span><Icon className="h-6 w-6 text-orange-600" aria-hidden /></div>
      <h3 className="mt-6 font-display text-2xl font-bold">{card.title}</h3><p className="mb-8 mt-3 flex-1 text-sm leading-relaxed text-zinc-600">{card.body}</p><span className="flex items-center gap-2 text-sm font-bold">{card.cta}<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden /></span>
    </Link>; })}</div>
  </div></section>;
}
