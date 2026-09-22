import type { AuditReport } from "@/lib/audit/types";

/** Scoped Stage-3 assessment summary: overall/incomplete, positions, candidates, opportunities. */
export function AssessmentSummary({ report }: { report: AuditReport }) {
  const assessment = report.assessment;
  const direct = report.directRank;
  if (!assessment && !direct) return null;

  const seo = assessment?.seo;
  const ai = assessment?.ai;
  const checks = direct?.checks ?? [];
  const candidates = (direct?.plan.selected ?? assessment?.keywordCandidates ?? []).slice(0, 8);
  const opportunities = (assessment?.opportunities ?? []).filter(o => o.kind !== "measurement_gap");
  const competitors = assessment?.competitors.filter(c => c.status === "verified").slice(0, 3) ?? [];
  const observedCompetitors = assessment?.competitors.filter(c => c.status === "observed").slice(0, 3) ?? [];
  const scopeWarnings = [
    ...new Set([
      ...(ai?.scopeWarnings ?? []),
      ...(report.aiSampling?.scopeWarnings ?? []),
      ...(report.aiSampling?.samples ?? []).map(s => s.scopeWarning).filter((w): w is string => Boolean(w)),
    ]),
  ];

  return (
    <section
      id="acquisition-assessment"
      data-testid="assessment-summary"
      className="min-w-0 space-y-5 rounded-2xl border border-emerald-500/30 bg-zinc-950 p-5 sm:p-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-zinc-100">Acquisition assessment</h2>
        <p className="mt-2 text-sm text-zinc-400">
          Scoped SEO and AI snapshot from verified evidence. Technical Lighthouse scores remain subordinate and are shown separately below.
        </p>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Overall SEO</p>
          {seo && !seo.incomplete && seo.overall !== null ? (
            <p data-testid="assessment-seo-overall" className="mt-2 text-3xl font-bold text-zinc-100">
              {seo.overall}
              <span className="text-base font-normal text-zinc-500"> / 100</span>
            </p>
          ) : (
            <p data-testid="assessment-seo-overall" className="mt-2 text-lg font-semibold text-amber-200">
              Overall assessment incomplete
            </p>
          )}
          {seo?.incompleteReason && <p className="mt-2 text-sm text-zinc-400">{seo.incompleteReason}</p>}
          {seo?.bounds && (
            <p className="mt-1 text-xs text-zinc-500">
              Mathematical bounds if unknowns were 0–100: {seo.bounds.lower}–{seo.bounds.upper} (not a published score)
            </p>
          )}
          {seo && (
            <ul className="mt-3 space-y-1 text-sm text-zinc-400">
              {seo.dimensions.map(d => (
                <li key={d.key}>
                  {d.key}: {d.score === null ? "unknown" : `${d.score}/100`}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">AI visibility snapshot</p>
          {ai && !ai.incomplete && ai.overall !== null ? (
            <p data-testid="assessment-ai-overall" className="mt-2 text-3xl font-bold text-zinc-100">
              {ai.overall}
              <span className="text-base font-normal text-zinc-500"> / 100</span>
            </p>
          ) : (
            <p data-testid="assessment-ai-overall" className="mt-2 text-lg font-semibold text-amber-200">
              AI score pending / incomplete
            </p>
          )}
          {ai && (
            <p className="mt-2 text-sm text-zinc-400">
              Mentions {ai.mentions.count}/{ai.mentions.denominator}; own-domain citations {ai.citations.count}/
              {ai.citations.denominator}. Small-sample snapshot
              {ai.judgmentsUsed ? "" : " (recommendation judgments not fully reviewed)"}.
            </p>
          )}
          {ai?.incompleteReason && <p className="mt-1 text-xs text-zinc-500">{ai.incompleteReason}</p>}
          {scopeWarnings.length > 0 && (
            <ul data-testid="assessment-scope-warnings" className="mt-2 space-y-1 text-xs text-amber-200">
              {scopeWarnings.map(w => (
                <li key={w}>Scope warning: {w}</li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {(checks.length > 0 || candidates.length > 0) && (
        <div>
          <h3 className="font-semibold text-zinc-100">Buyer searches checked</h3>
          {checks.length > 0 ? (
            <ul data-testid="assessment-direct-rank-checks" className="mt-3 space-y-2 text-sm">
              {checks.map(c => {
                const isCandidate = candidates.some(cand => ("query" in cand ? cand.query : "") === c.query);
                return (
                  <li key={c.key} className="rounded-lg border border-zinc-800 p-3 text-zinc-300">
                    <span className="font-medium text-zinc-100">{c.query}</span>
                    <span className="ml-2 text-xs uppercase text-zinc-500">
                      {c.outcome.replace(/_/g, " ")}
                      {c.position != null ? ` · position ${c.position}` : ""}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {c.providerLocation} · {c.device} · depth {c.checkedDepth}
                      {c.completeTop20Window ? "" : " · incomplete top20"} · {c.observedAt}
                    </span>
                    <span className="ml-2 text-xs text-zinc-500">
                      {isCandidate ? "candidate+observed" : "observed"}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">
              No observed positions in an authorized complete check yet.
              {direct?.publicPaidCollection === "disabled"
                ? " Public paid direct-rank collection is disabled until an owner-approved budget is provisioned."
                : ""}
            </p>
          )}
          {candidates.length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-zinc-400">Distinct measurement candidates (not validated recommendations):</p>
              <ul className="mt-2 list-inside list-disc text-sm text-zinc-300">
                {candidates.map(c => (
                  <li key={"query" in c ? c.query : String(c)}>{("query" in c ? c.query : "") as string}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {(competitors.length > 0 || observedCompetitors.length > 0) && (
        <div>
          <h3 className="font-semibold text-zinc-100">Competitor candidates</h3>
          <ul className="mt-3 space-y-2 text-sm text-zinc-300">
            {[...competitors, ...observedCompetitors].slice(0, 5).map(c => (
              <li key={c.domain} className="rounded-lg border border-zinc-800 p-3">
                <span className="font-medium text-zinc-100">{c.domain}</span>
                <span className="ml-2 text-xs uppercase text-zinc-500">{c.status}</span>
                <p className="mt-1 text-zinc-400">{c.note}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {opportunities.length > 0 && (
        <div>
          <h3 className="font-semibold text-zinc-100">Opportunities</h3>
          <ol className="mt-3 grid min-w-0 grid-cols-1 gap-3 md:grid-cols-3">
            {opportunities.map((o, i) => (
              <li key={o.id} className="min-w-0 rounded-xl border border-zinc-800 p-4 text-sm">
                <p className="font-medium text-zinc-100">
                  {i + 1}. {o.problem}
                </p>
                <p className="mt-2 text-zinc-400">{o.offerFit}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {o.kind.replace(/_/g, " ")} · {o.confidence} confidence · {o.effort} effort
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="text-xs text-zinc-500">
        Rubric {seo?.rubricVersion ?? "n/a"} / {ai?.rubricVersion ?? "n/a"}. Geography:{" "}
        {report.auditContext?.geography ?? "legacy local"}. No phantom demand volumes or forecasted revenue are shown.
        Incomplete measurement is not pitched as a paid service opportunity.
      </p>
    </section>
  );
}
