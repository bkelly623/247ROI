"use client";
import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";

const journeys = [
  { id:"missed", name:"Missed call", title:"Give the caller a reason to reply.", intro:"The business is busy. A new customer calls and gets no answer.", steps:[
    ["Call missed", "A missed call is recorded. A call answered by the team would not trigger this example."],
    ["Text back", "Hi, this is Northside Services’ assistant. Sorry we missed your call. What can we help with?"],
    ["Customer replies", "I’d like an estimate for a replacement water heater."],
    ["Team takes over", "The inquiry and reply are in one conversation, with the team notified to follow up."] ] },
  { id:"lead", name:"New inquiry", title:"Keep a new inquiry moving.", intro:"A prospective customer requests an estimate through a website form.", steps:[
    ["Inquiry received", "The request is saved and assigned to the right person."],
    ["Response sent", "Thanks for reaching out to Northside Services. What would you like us to take a look at?"],
    ["Follow-up", "If there is no reply, an approved follow-up is scheduled. Replies and opt-outs stop the relevant sequence."],
    ["Next step", "The customer can arrange a callback or choose an available appointment, depending on your setup."] ] },
  { id:"voice", name:"AI receptionist", title:"An answer when your team is unavailable.", intro:"A scripted illustration of an AI receptionist—not a live call or generated audio.", steps:[
    ["Call answered", "Thanks for calling Northside Services. I’m the automated assistant. How can I help?"],
    ["Details captured", "The caller asks about a service visit. The assistant collects contact details and the reason for calling."],
    ["A useful next step", "For supported requests, the assistant checks approved information and configured appointment availability."],
    ["Human handoff", "Questions outside its instructions go to the team. No invented prices, promises or emergency dispatch."] ] },
  { id:"booking", name:"Booking & reminders", title:"Less phone tag. A clearer schedule.", intro:"A customer is ready to book a routine service appointment.", steps:[
    ["Time selected", "The customer chooses from the business’s configured availability."],
    ["Confirmation", "Your service appointment is confirmed. Here are the visit details and a way to reschedule."],
    ["Reminder", "An approved reminder goes out before the visit, with confirmation or rescheduling instructions."],
    ["Schedule updated", "A cancellation or reschedule updates the calendar and prevents outdated reminders."] ] },
  { id:"reviews", name:"Review requests", title:"Make asking for honest feedback a habit.", intro:"A real customer’s job is marked complete. This example never posts a review.", steps:[
    ["Work completed", "A completion event starts the review-request workflow for eligible customers."],
    ["Request sent", "Thanks for choosing Northside Services. Would you share an honest review of your experience?"],
    ["Customer chooses", "The customer decides whether to leave a review. The same invitation is available regardless of expected rating."],
    ["Team can respond", "New feedback can be reviewed by the team. No fabricated reviews, incentives or filtering out unhappy customers."] ] },
];
export default function LeadJourneyExample() {
  const [selected,setSelected]=useState(0);const [step,setStep]=useState(0);
  const journey=journeys[selected];
  return <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-8" data-testid="lead-journey">
    <p className="text-xs font-bold uppercase tracking-widest text-orange-800">Interactive illustration · fictional business</p>
    <p className="mt-2 text-sm leading-relaxed text-zinc-600">Explore the steps. No calls, messages, bookings or reviews are sent.</p>
    <div className="my-6 flex flex-wrap gap-2" aria-label="Choose an example">
      {journeys.map((item,index)=><button key={item.id} type="button" aria-pressed={selected===index} onClick={()=>{setSelected(index);setStep(0);}} className={`min-h-11 rounded-full border px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-700 ${selected===index?"border-zinc-950 bg-zinc-950 text-white":"border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100"}`}>{item.name}</button>)}
    </div>
    <div className="grid gap-6 md:grid-cols-[1fr_1.1fr]">
      <div><h3 className="font-display text-2xl font-bold text-zinc-950">{journey.title}</h3><p className="mt-3 text-zinc-600">{journey.intro}</p><p className="mt-5 text-sm font-semibold text-orange-800">Step {step+1} of {journey.steps.length}</p></div>
      <div className="min-h-44 rounded-2xl bg-zinc-100 p-6" aria-live="polite" aria-atomic="true"><p className="font-semibold text-zinc-950">{journey.steps[step][0]}</p><p className="mt-3 leading-relaxed text-zinc-700">{journey.steps[step][1]}</p></div>
    </div>
    <div className="mt-6 flex flex-wrap items-center gap-4">
      <button type="button" disabled={step===journey.steps.length-1} onClick={()=>setStep(s=>s+1)} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-orange-700 px-6 font-semibold text-white hover:bg-orange-800 disabled:cursor-default disabled:bg-zinc-200 disabled:text-zinc-600">Next step <ArrowRight size={17} aria-hidden /></button>
      <button type="button" onClick={()=>setStep(0)} className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 text-sm font-semibold text-zinc-700"><RotateCcw size={15} aria-hidden /> Restart example</button>
    </div>
  </div>;
}
