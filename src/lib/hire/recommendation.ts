import type { DiscoveryState, HireProposal } from './types';
import { applyHireEstimate, buildHireEstimate, primaryPain, requiresHumanJudgment } from './estimates';

export function buildRecommendation(d: DiscoveryState): HireProposal {
  const p = primaryPain(d), hours = buildHireEstimate(d).taskHours;
  const title = p?.title || 'Your workflow';
  const kind = p?.automatable === false || requiresHumanJudgment(d) ? 'keep_human' : hours != null && hours <= 3 ? 'existing_tools' : 'pilot';
  const text = `${title} ${p?.rawDescription || ''}`.toLowerCase();
  let role = 'A clearer work queue';
  let steps = ['Capture each request in one place', 'Prepare a draft or checklist from the information supplied', 'Route anything uncertain to the person responsible', 'Track completion and flag work that needs attention'];
  let metric = 'Minutes spent per completed task, missed steps and corrections needed.';
  let firstMove = 'Pick five recent examples. Mark the repeated steps, the exceptions and who approves the final output.';
  if (/follow|quote|estimat|bid/.test(text)) {
    role = /follow|chas/.test(text) ? 'Quote follow-up without the chasing' : 'Estimate prep, with your final approval';
    steps = /follow|chas/.test(text)
      ? ['Track sent quotes and the next follow-up date', 'Prepare a relevant reminder for each open quote', 'You approve changes to price, scope or promises', 'Log replies and flag quotes that need a personal call']
      : ['Collect the job details in one checklist', 'Prepare a draft using your approved prices and rules', 'You check quantities, scope and the final price', 'Track the sent estimate and its next action'];
    metric = 'Time per quote, overdue follow-ups and replies received. Track wins separately; do not assume a revenue lift.';
    firstMove = 'Take five recent quotes. Write down what happens from request to sent estimate to follow-up.';
  } else if (/lead|missed.call|voicemail/.test(text)) {
    role = 'A clear next step for every inquiry';
    steps = ['Capture the inquiry and contact preference', 'Prepare an acknowledgement and collect missing details', 'Route urgent, sensitive or unusual requests to a person', 'Track the next action so the inquiry does not disappear'];
    metric = 'Response time, unreturned inquiries and appointments booked.';
    firstMove = 'Review five recent inquiries and identify where the next action was delayed or missed.';
  } else if (/schedul|appoint|dispatch|booking/.test(text)) {
    role = 'A calmer schedule';
    steps = ['Collect the request and required job details', 'Check availability and prepare suitable options', 'Have a person approve exceptions and commitments', 'Send permitted reminders and flag changes'];
    metric = 'Scheduling time, back-and-forth messages and missed appointments.';
    firstMove = 'List the booking rules and the exceptions that still need a person.';
  } else if (/invoice|bookkeep|billing|payroll|account/.test(text)) {
    role = 'Paperwork ready for review';
    steps = ['Collect the relevant documents in a review queue', 'Extract and match fields against your records', 'Flag mismatches for your bookkeeper or approver', 'Prepare drafts; never move money or finalize accounts without approval'];
    metric = 'Processing time per document, exceptions and corrections after review.';
    firstMove = 'Use five redacted examples to define required fields and the approval checklist.';
  } else if (/email|inbox|document|paperwork/.test(text)) {
    role = 'An inbox with a clear next action';
    steps = ['Group incoming items by the action needed', 'Prepare a draft reply or task with the relevant context', 'Hold sensitive or uncertain items for human review', 'Track unresolved items and follow-up dates'];
    metric = 'Inbox time, missed actions and drafts needing correction.';
    firstMove = 'Define three useful message categories and which messages must always stay human.';
  } else if (/report|dashboard|spreadsheet/.test(text)) {
    role = 'One reliable view of the work';
    steps = ['Identify the records that answer your key questions', 'Bring the selected fields into one view', 'Flag missing or conflicting information for review', 'Show the next actions while people keep decision authority'];
    metric = 'Weekly reporting time, missing information and corrections.';
    firstMove = 'Choose three questions the report should answer and identify the source for each.';
  }
  if (kind === 'keep_human') {
    role = `Keep ${title.toLowerCase()} human`;
    steps = ['Document what must be decided or done by a person', 'Use a checklist to prepare information beforehand', 'Keep final decisions and hands-on work with qualified people', 'Review whether any separate admin step is worth simplifying'];
    firstMove = 'Separate the human judgment or physical work from preparation and paperwork. Improve only the supporting steps.';
    metric = 'Errors avoided, preparation time and quality of the human handoff.';
  }
  const impact = d.notes.find(n => n.startsWith('impact:'))?.slice(7);
  return applyHireEstimate({
    employeeName: role, roleTitle: role,
    tagline: kind === 'keep_human' ? 'Better support for the person doing the work—not an AI replacement.' : kind === 'existing_tools' ? 'Start with a simpler process or a feature you already own—not a custom build.' : 'Start with one repeatable workflow. Prove it works before expanding.',
    hoursSavedPerWeek: {low:0,high:0}, monthlyHoursSaved: {low:0,high:0},
    problemsSolved: p ? [p.rawDescription, ...(p.whyItHurts ? [p.whyItHurts] : [])] : ['The workflow needs a concrete example before recommending a build.'],
    emotionalPayoff: impact ? `The win you want: ${impact}` : 'Less chasing and fewer loose ends, while you stay in control.',
    jobFromAtoZ: steps,
    howTheyUseIt: {
      interface: p?.tools.length ? `Start by checking what ${p.tools.join(' and ')} already supports. Integration access is not yet verified.` : 'Use the tools you already work in where possible. Tool access still needs checking.',
      dailyLoop: 'Review the prepared work and handle exceptions in one short check-in.',
      approvals: 'You control prices, payments, promises and sensitive customer decisions.',
      humanHandoffs: 'Uncertain inputs stop for review. Keep a record of changes and an easy manual fallback.',
    },
    implementationSketch: 'Map five real examples → check existing-tool features → try a small, reversible pilot → compare against the current process.',
    whyThisFirst: p ? `This addresses the priority you named: ${title.toLowerCase()}. Validate it on a small sample before paying for a larger build.` : 'A concrete example is needed before choosing a first system.',
    secondaryOpportunity: d.pains.find(other => other.id !== p?.id)?.title ?? null,
    fitScore: 0, fitNotes: 'Exploratory recommendation based on your answers, not a technical feasibility assessment.',
    ctaLabel: 'Talk through this plan', recommendationKind: kind, firstMove, successMetric: metric,
  }, d);
}
