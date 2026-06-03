import type { Branch } from "@/types/api";

const statusStyles = {
  critical: "border-tomato/40 bg-red-50 text-tomato",
  warning: "border-gold/45 bg-amber-50 text-amber-700",
  stable: "border-mint/35 bg-emerald-50 text-mint",
};

type BranchRiskCardProps = {
  branch: Branch;
};

export function BranchRiskCard({ branch }: BranchRiskCardProps) {
  const statusClassName = statusStyles[branch.status_flag];

  return (
    <article className="rounded-lg border border-stone-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="truncate text-base font-semibold text-ink">{branch.name}</h2>
          <p className="mt-1 truncate text-sm text-stone-500">
            {[branch.city, branch.address].filter(Boolean).join(", ")}
          </p>
        </div>
        <span className={`rounded-md border px-2.5 py-1 text-xs font-semibold uppercase ${statusClassName}`}>
          {branch.status_flag}
        </span>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
        <div>
          <dt className="text-stone-500">Rating</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">{branch.current_rating.toFixed(2)}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Reviews</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">{branch.review_count}</dd>
        </div>
        <div>
          <dt className="text-stone-500">Negative</dt>
          <dd className="mt-1 text-xl font-semibold text-ink">{branch.weekly_negative_reviews}</dd>
        </div>
      </dl>

      <div className="mt-5 grid gap-2 text-sm text-stone-600 sm:grid-cols-2">
        <p>Unanswered: {branch.unanswered_reviews}</p>
        <p>Last review: {branch.last_review_date ?? "None"}</p>
      </div>

      {branch.google_maps_url ? (
        <a
          href={branch.google_maps_url}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex text-sm font-medium text-mint hover:text-ink"
        >
          Open map
        </a>
      ) : null}
    </article>
  );
}
