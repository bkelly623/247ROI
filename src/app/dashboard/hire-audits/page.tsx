import Link from "next/link";
import { createServiceClient } from "@/lib/audit/supabase/server";
import type { DiscoveryState, HireMessage, HireProposal, HireSessionStatus } from "@/lib/hire/types";

type HireAuditRow = {
  id: string;
  created_at: string;
  updated_at: string | null;
  status: HireSessionStatus;
  phase: string | null;
  messages: HireMessage[] | null;
  discovery: DiscoveryState | null;
  proposal: HireProposal | null;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  email: string | null;
  gate_shown_at: string | null;
  gate_submitted_at: string | null;
  unlocked_at: string | null;
  source: string | null;
};

type SearchParams = Promise<{ token?: string }>;

function isAuthorized(token?: string) {
  const expected = process.env.ADMIN_DASHBOARD_TOKEN;
  return Boolean(expected && token && token === expected);
}

function formatDate(value: string | null) {
  if (!value) return "Not captured";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function contactName(row: HireAuditRow) {
  return [row.first_name, row.last_name].filter(Boolean).join(" ") || "No contact yet";
}

function primaryPain(row: HireAuditRow) {
  return row.discovery?.pains?.[0]?.title || "No pain captured";
}

function workflowSummary(row: HireAuditRow) {
  const pain = row.discovery?.pains?.[0];
  if (!pain) return "No workflow details yet.";
  const steps = pain.processSteps?.filter(Boolean).slice(0, 4).join(" -> ");
  return steps || pain.rawDescription || "Pain captured, process not mapped yet.";
}

function hoursLabel(row: HireAuditRow) {
  const hours = row.discovery?.pains?.[0]?.time?.computedHoursPerWeek ?? row.discovery?.pains?.[0]?.time?.statedHoursPerWeek;
  return typeof hours === "number" ? `${hours} hrs/week` : "No hours";
}

function fitLabel(row: HireAuditRow) {
  if (typeof row.proposal?.fitScore === "number") return `${row.proposal.fitScore}/100`;
  return "No fit score";
}

function userMessageCount(row: HireAuditRow) {
  return row.messages?.filter((message) => message.role === "user").length ?? 0;
}

async function loadRows(): Promise<{ rows: HireAuditRow[]; error: string | null }> {
  const supabase = createServiceClient();
  if (!supabase) {
    return {
      rows: [],
      error:
        "Supabase server client is not configured. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.",
    };
  }

  const { data, error } = await supabase
    .from("hire_sessions")
    .select(
      "id,created_at,updated_at,status,phase,messages,discovery,proposal,first_name,last_name,phone,email,gate_shown_at,gate_submitted_at,unlocked_at,source"
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return { rows: [], error: error.message };
  }

  return { rows: (data ?? []) as HireAuditRow[], error: null };
}

export default async function HireAuditsDashboard({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  if (!isAuthorized(params.token)) {
    return (
      <main className="min-h-screen bg-zinc-950 px-5 py-16 text-zinc-100">
        <div className="mx-auto max-w-2xl rounded-lg border border-white/10 bg-white/[0.03] p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">Restricted</p>
          <h1 className="mt-3 font-display text-3xl font-bold">Audit sessions dashboard</h1>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            Set `ADMIN_DASHBOARD_TOKEN` in the deployment environment, then open this page with `?token=...`.
            This keeps lead and discovery data out of public routes.
          </p>
          <Link href="/" className="mt-5 inline-flex text-sm font-semibold text-orange-300 hover:text-orange-200">
            Back to site
          </Link>
        </div>
      </main>
    );
  }

  const { rows, error } = await loadRows();
  const unlocked = rows.filter((row) => row.status === "unlocked").length;
  const gateReady = rows.filter((row) => row.status === "gate_ready").length;
  const withPain = rows.filter((row) => row.discovery?.pains?.length).length;
  const withContact = rows.filter((row) => row.phone || row.email).length;

  return (
    <main className="min-h-screen bg-zinc-950 px-5 py-10 text-zinc-100 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-orange-400">247ROI internal</p>
            <h1 className="mt-3 font-display text-4xl font-bold">AI Opportunity Audit Sessions</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Recent discovery sessions from `hire_sessions`, including captured pains, workflow detail, fit, gate status,
              and lead contact fields.
            </p>
          </div>
          <Link href="/ai-opportunity-audit" className="text-sm font-semibold text-orange-300 hover:text-orange-200">
            Open audit page
          </Link>
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">{error}</div>
        ) : null}

        <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Recent sessions", rows.length],
            ["Pain captured", withPain],
            ["Gate ready", gateReady],
            ["Contact submitted", withContact || unlocked],
          ].map(([label, value]) => (
            <div key={label} className="rounded-lg border border-white/10 bg-white/[0.035] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-500">{label}</p>
              <p className="mt-2 text-3xl font-bold text-zinc-50">{value}</p>
            </div>
          ))}
        </section>

        <section className="mt-6 overflow-hidden rounded-lg border border-white/10">
          <div className="grid grid-cols-[1.1fr_0.85fr_1.35fr_0.7fr_0.75fr_1fr] gap-3 bg-white/[0.06] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
            <span>Lead</span>
            <span>Status</span>
            <span>Discovery</span>
            <span>Depth</span>
            <span>Fit</span>
            <span>Updated</span>
          </div>
          <div className="divide-y divide-white/10">
            {rows.map((row) => (
              <article
                key={row.id}
                className="grid grid-cols-1 gap-3 bg-zinc-950 px-4 py-4 text-sm hover:bg-white/[0.025] lg:grid-cols-[1.1fr_0.85fr_1.35fr_0.7fr_0.75fr_1fr]"
              >
                <div>
                  <p className="font-semibold text-zinc-100">{contactName(row)}</p>
                  <p className="mt-1 text-xs text-zinc-500">{row.phone || row.email || row.id}</p>
                  <p className="mt-1 text-xs text-zinc-600">{row.source || "unknown source"}</p>
                </div>
                <div>
                  <p className="font-medium text-orange-300">{row.status}</p>
                  <p className="mt-1 text-xs text-zinc-500">{row.phase || "no phase"}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-100">{row.discovery?.businessType || "Business unknown"}</p>
                  <p className="mt-1 text-zinc-400">{primaryPain(row)}</p>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{workflowSummary(row)}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-100">{userMessageCount(row)} user msgs</p>
                  <p className="mt-1 text-xs text-zinc-500">{hoursLabel(row)}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-100">{fitLabel(row)}</p>
                  <p className="mt-1 text-xs text-zinc-500">{row.proposal?.roleTitle || "No proposal"}</p>
                </div>
                <div>
                  <p className="font-medium text-zinc-100">{formatDate(row.updated_at ?? row.created_at)}</p>
                  <p className="mt-1 text-xs text-zinc-500">Started {formatDate(row.created_at)}</p>
                  {row.unlocked_at ? <p className="mt-1 text-xs text-orange-300">Unlocked {formatDate(row.unlocked_at)}</p> : null}
                </div>
              </article>
            ))}
            {!rows.length && !error ? (
              <div className="bg-zinc-950 px-4 py-10 text-center text-sm text-zinc-500">
                No hire audit sessions found yet.
              </div>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
