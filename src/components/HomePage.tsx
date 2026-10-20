"use client";
import Link from "next/link";
import { ArrowRight, PhoneMissed, PhoneCall, CalendarCheck, MessageSquare, Star, Check, Layers3 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import LeadJourneyExample from "@/components/LeadJourneyExample";
import { PRIMARY_PHONE_DISPLAY, PRIMARY_PHONE_HREF } from "@/app/components/cta";

const AI_DEMO_PHONE_HREF = "tel:+16109987247";
const AI_DEMO_PHONE_DISPLAY = "(610) 998-7247";

const offers=[
 {icon:MessageSquare,tag:"A practical place to start",title:"Keep new leads from going cold.",body:"Text back missed callers, respond to new inquiries and follow up until there’s a clear next step—not another forgotten message.",items:["Missed-call text back","New-inquiry response","Follow-up & team notifications"],href:"/contact?offer=lead-capture&source=homepage",cta:"Discuss lead follow-up",featured:true},
 {icon:PhoneCall,tag:"When calls need an answer",title:"An AI receptionist when you can’t pick up.",body:"Give routine callers an answer, capture what they need and help them book or reach the right person. Built around your hours, services and handoff rules.",items:["After-hours or overflow coverage","Caller details & summaries","Booking & human handoff"],href:"/contact?offer=ai-receptionist&source=homepage",cta:"Discuss call coverage",featured:false},
 {icon:CalendarCheck,tag:"Keep the next step simple",title:"Less phone tag. Fewer forgotten appointments.",body:"Let customers choose a time, receive a confirmation and get a useful reminder. Make rescheduling easier for them and your team.",items:["Online booking","Confirmations & reminders","Rescheduling follow-up"],href:"/contact?offer=lead-capture&source=homepage-booking",cta:"Discuss booking & reminders",featured:false},
 {icon:Star,tag:"Build trust after the job",title:"Ask for honest reviews—without chasing.",body:"Request feedback after completed work, give customers a simple review link and help your team keep up with responses.",items:["Post-service review requests","Approved reminder timing","Feedback visibility for your team"],href:"/contact?offer=workflow-automation&source=homepage-reviews",cta:"Discuss review requests",featured:false},
];
const button="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-orange-700 px-6 py-3 font-semibold text-white hover:bg-orange-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700";
export default function HomePage(){return <div className="min-h-screen bg-zinc-50 text-zinc-950">
  <Navbar offerFirst />
  <main>
    <section className="relative overflow-hidden bg-zinc-950 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(255,106,0,0.16),transparent_45%)]" />
      <div className="container relative mx-auto grid gap-10 px-5 pb-14 pt-32 sm:px-6 sm:pb-20 lg:grid-cols-[1.2fr_0.8fr] lg:items-center lg:gap-14 lg:pt-40">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">247ROI · Customer follow-up & business automation</p>
          <h1 className="mt-5 max-w-3xl font-display text-4xl font-bold leading-[1.06] sm:text-5xl lg:text-6xl">Respond faster.<br />Stay in the conversation.<br /><span className="text-orange-400">Win more business.</span></h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-zinc-300">Turn missed calls and new inquiries into conversations your team can act on—with automated follow-up, AI call answering and easier booking.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><a href={AI_DEMO_PHONE_HREF} className={button} data-track-event="demo_phone_click" data-track-lane="ai-voice" data-track-source="homepage_hero"><PhoneCall size={18} aria-hidden />Call the AI demo</a><Link href="/contact?offer=lead-capture&source=homepage-hero" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/30 px-6 py-3 font-semibold text-white hover:bg-white/10" data-track-event="cta_click" data-track-label="Talk to Brendan" data-track-source="homepage_hero">Talk to Brendan</Link></div>
          <p className="mt-4 text-sm leading-relaxed text-zinc-300">AI voice demo: <a href={AI_DEMO_PHONE_HREF} className="font-semibold text-white underline decoration-white/40 underline-offset-4" data-track-event="demo_phone_click" data-track-lane="ai-voice" data-track-source="homepage_hero_number">{AI_DEMO_PHONE_DISPLAY}</a>. Talk with our AI assistant about your business, then ask Brendan for a custom demo.</p>
          <a href="#examples" className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-orange-300 underline-offset-4 hover:underline" data-track-event="cta_click" data-track-label="Explore examples" data-track-source="homepage_hero">See how it works <ArrowRight size={16} aria-hidden /></a>
          <p className="mt-6 text-sm text-zinc-400">Need something built around your business? <a href="#custom-software" className="font-semibold text-white underline decoration-white/40 underline-offset-4">We also build custom software & AI.</a></p>
        </div>
        <div className="rounded-3xl border border-white/15 bg-white/[0.04] p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-widest text-zinc-300">One missed call. A new conversation.</p><PhoneMissed className="shrink-0 text-orange-400" aria-hidden /></div>
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-4"><p className="text-xs text-orange-300">A customer calls while you’re busy</p><p className="mt-2 font-semibold text-white">You can’t answer right now.</p></div>
            <div className="mr-4 rounded-2xl rounded-tl-none bg-white p-4 text-zinc-900"><p className="text-xs font-bold text-orange-800">YOUR BUSINESS · AUTOMATED TEXT</p><p className="mt-2 text-sm leading-relaxed">Sorry we missed your call. What can we help you with?</p></div>
            <div className="ml-8 rounded-2xl rounded-tr-none border border-orange-400/30 bg-orange-400/10 p-4"><p className="text-xs font-bold text-orange-300">CUSTOMER</p><p className="mt-2 text-sm text-white">Can someone give me an estimate?</p></div>
            <div className="flex items-center gap-3 text-sm text-zinc-200"><span className="rounded-full bg-orange-700 p-1"><Check size={14} aria-hidden /></span>A conversation to follow up—not just a missed number.</div>
          </div>
          <p className="mt-6 text-xs leading-relaxed text-zinc-400">Illustrative conversation. Not a customer result or a live messaging demo.</p>
        </div>
      </div>
    </section>
    <section id="solutions" className="scroll-mt-28 py-14 sm:py-20">
      <div className="container mx-auto px-5 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-widest text-orange-800">Make more of the inquiries you already get</p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl font-bold sm:text-4xl">Start with the gap costing you conversations.</h2>
        <p className="mt-4 max-w-2xl leading-relaxed text-zinc-600">You don’t need every automation. Start where calls, follow-up, booking or customer feedback are slipping through.</p>
        <div className="mt-9 grid gap-5 md:grid-cols-2">{offers.map(({icon:Icon,...offer})=><article key={offer.title} className={`flex flex-col rounded-3xl border p-6 sm:p-8 ${offer.featured?"border-orange-300 bg-orange-50":"border-zinc-200 bg-white"}`}>
          <div className="flex items-center gap-3"><Icon className="h-6 w-6 shrink-0 text-orange-800" aria-hidden /><p className="text-xs font-bold uppercase tracking-wider text-orange-800">{offer.tag}</p></div>
          <h3 className="mt-5 font-display text-2xl font-bold">{offer.title}</h3><p className="mt-3 leading-relaxed text-zinc-700">{offer.body}</p>
          <ul className="my-6 space-y-2">{offer.items.map(item=><li key={item} className="flex items-center gap-2 text-sm text-zinc-700"><Check size={15} className="shrink-0 text-orange-800" aria-hidden />{item}</li>)}</ul>
          <Link href={offer.href} className="mt-auto inline-flex min-h-11 items-center gap-2 font-semibold text-orange-800 underline-offset-4 hover:underline">{offer.cta}<ArrowRight size={17} aria-hidden /></Link>
        </article>)}</div>
        <p className="mt-6 max-w-3xl text-sm leading-relaxed text-zinc-600">Already have customers you’d like to hear from again? We can also discuss past-customer follow-up, where your contact permissions and records support it.</p>
      </div>
    </section>
    <section id="examples" className="scroll-mt-28 border-y border-zinc-200 bg-zinc-100 py-14 sm:py-20"><div className="container mx-auto px-5 sm:px-6"><div className="mb-8 max-w-2xl"><p className="text-xs font-bold uppercase tracking-widest text-orange-800">See the customer experience</p><h2 className="mt-3 font-display text-3xl font-bold sm:text-4xl">A simple next step. Not another dead end.</h2></div><LeadJourneyExample /></div></section>
    <section id="custom-software" className="scroll-mt-28 bg-zinc-950 py-14 text-white sm:py-20"><div className="container mx-auto grid gap-8 px-5 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"><div><p className="text-xs font-semibold uppercase tracking-widest text-orange-300">Custom software & AI</p><h2 className="mt-4 font-display text-3xl font-bold sm:text-4xl">When your business needs more than a standard setup.</h2><p className="mt-5 max-w-2xl leading-relaxed text-zinc-300">We also build dashboards, internal tools, integrations and AI-assisted workflows around the way your team works. A focused custom project can be your starting point—not something you have to buy a package to reach.</p><Link className={`${button} mt-7`} href="/contact?offer=custom-software&source=homepage-custom">Discuss a custom project <ArrowRight size={17} aria-hidden /></Link></div><div className="grid gap-3">{[["Custom dashboards","See jobs, tasks and business data in one useful view."],["Connected workflows","Move information between the tools you already use."],["Internal apps & AI assistants","Reduce repetitive work, with approval where judgment matters."]].map(([title,body])=><div key={title} className="rounded-2xl border border-white/15 p-5"><h3 className="flex items-center gap-3 font-semibold"><Layers3 size={18} className="text-orange-400" aria-hidden />{title}</h3><p className="mt-2 text-sm leading-relaxed text-zinc-300">{body}</p></div>)}<Link href="/demo" className="min-h-11 py-3 text-sm font-semibold text-orange-300 underline underline-offset-4">Try the custom-workflow example →</Link></div></div></section>
    <section className="py-14 sm:py-20"><div className="container mx-auto px-5 sm:px-6"><h2 className="font-display text-3xl font-bold">A useful setup. A clear handoff.</h2><div className="mt-8 grid gap-7 md:grid-cols-3">{[["01","Choose the first fix","Look at your calls, inquiries and current tools. Pick one clear problem to address."],["02","Configure and test","Agree on the wording, routing, booking rules and when a person should step in. Test before going live."],["03","Support and improve","Review what happened: replies, bookings and missed handoffs. Adjust the setup around real use."]].map(([n,title,body])=><div key={n}><p className="font-display text-xl font-bold text-orange-800">{n}</p><h3 className="mt-3 text-xl font-bold">{title}</h3><p className="mt-3 leading-relaxed text-zinc-600">{body}</p></div>)}</div><p className="mt-8 max-w-3xl text-sm leading-relaxed text-zinc-600">Setup, support scope and usage costs are agreed before you commit. Phone compatibility, messaging consent and registration are checked before activation.</p></div></section>
    <section className="border-t border-zinc-200 bg-white py-14"><div className="container mx-auto flex flex-col justify-between gap-7 px-5 sm:px-6 lg:flex-row lg:items-center"><div><h2 className="font-display text-3xl font-bold">What happens when you can’t respond?</h2><p className="mt-3 max-w-2xl text-zinc-600">Tell us where customers get stuck. We’ll discuss a practical first fix.</p></div><div className="flex shrink-0 flex-col gap-3"><Link className={button} href="/contact?offer=lead-capture&source=homepage-footer">Talk through your setup <ArrowRight size={17} aria-hidden /></Link><a href={PRIMARY_PHONE_HREF} className="py-2 text-center font-semibold text-zinc-800">{PRIMARY_PHONE_DISPLAY}</a></div></div></section>
  </main><Footer />
</div>;}
