import type { DashboardSummary } from "@/types/api";

type TodaySummaryCardProps = {
  summary: DashboardSummary;
};

export function TodaySummaryCard({ summary }: TodaySummaryCardProps) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Today overview</h2>
          <p className="mt-1 text-sm text-stone-500">Current operating-day review pressure.</p>
        </div>
        <span className="rounded-md bg-field px-3 py-1 text-sm font-medium text-stone-700">
          {summary.total_reviews_today} total
        </span>
      </div>

      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-stone-500">Primary complaint</dt>
          <dd className="mt-1 font-medium text-ink">{summary.primary_complaint_today ?? "None"}</dd>
        </div>
        <div>
          <dt className="text-sm text-stone-500">Highest-risk branch</dt>
          <dd className="mt-1 font-medium text-ink">{summary.highest_risk_branch ?? "None"}</dd>
        </div>
        <div>
          <dt className="text-sm text-stone-500">Unanswered today</dt>
          <dd className="mt-1 font-medium text-ink">{summary.unanswered_reviews_today}</dd>
        </div>
        <div>
          <dt className="text-sm text-stone-500">Branches at risk</dt>
          <dd className="mt-1 font-medium text-ink">{summary.branches_at_risk}</dd>
        </div>
      </dl>

      <div className="mt-5 rounded-md border border-stone-200 bg-field p-3 text-sm leading-6 text-stone-700">
        {summary.recommended_action}
      </div>
    </section>
  );
}
