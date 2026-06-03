import type { WeeklyReport } from "@/types/api";

type WeeklyReportCardProps = {
  report: WeeklyReport;
};

export function WeeklyReportCard({ report }: WeeklyReportCardProps) {
  return (
    <article className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">
            Weekly Report #{report.id}
          </h2>
          <p className="mt-1 text-sm text-stone-500">
            Organization {report.organization_id}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <ReportMetric label="Total reviews" value={report.total_reviews} />
        <ReportMetric label="Negative reviews" value={report.negative_reviews} />
        <ReportMetric label="Unanswered reviews" value={report.unanswered_reviews} />
      </div>

      <section className="mt-5 rounded-lg bg-stone-50 p-4">
        <h3 className="text-sm font-semibold text-ink">Summary</h3>
        <p className="mt-2 text-sm leading-6 text-stone-600">
          {report.summary || "No summary is available for this report yet."}
        </p>
      </section>

      <section className="mt-5">
        <h3 className="text-sm font-semibold text-ink">Recommended actions</h3>

        {report.recommended_actions?.length ? (
          <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-stone-600">
            {report.recommended_actions.map((action: string, index: number) => (
              <li key={`${action}-${index}`}>{action}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-stone-500">
            No recommendations are available yet.
          </p>
        )}
      </section>
    </article>
  );
}

function ReportMetric({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div className="rounded-lg border border-stone-200 bg-white p-4">
      <p className="text-xs uppercase tracking-wide text-stone-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}