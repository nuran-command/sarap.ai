"use client";

import { FormEvent, useState } from "react";
import { MetricCard } from "@/components/MetricCard";
import {
  getCurrentUser,
  getDashboardSummary,
  listBranches,
  listOrganizations,
  listReviews,
  listWeeklyReports,
} from "@/lib/api";
import type { Branch, DashboardSummary, Organization, Review, User, WeeklyReport } from "@/types/api";

type DashboardData = {
  user: User;
  organizations: Organization[];
  branches: Branch[];
  reviews: Review[];
  summary: DashboardSummary | null;
  reports: WeeklyReport[];
};

export default function Home() {
  const [token, setToken] = useState("");
  const [organizationId, setOrganizationId] = useState("");
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function loadDashboard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const user = await getCurrentUser(token);
      const organizations = await listOrganizations(token);
      const activeOrganizationId = Number(organizationId || organizations[0]?.id);

      if (!activeOrganizationId) {
        throw new Error("Create an organization in the backend first.");
      }

      const [branches, reviews, summary, reports] = await Promise.all([
        listBranches(token, activeOrganizationId),
        listReviews(token, activeOrganizationId),
        getDashboardSummary(token, activeOrganizationId),
        listWeeklyReports(token, activeOrganizationId),
      ]);

      setData({ user, organizations, branches, reviews, summary, reports });
      setOrganizationId(String(activeOrganizationId));
    } catch (loadError) {
      setData(null);
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard");
    } finally {
      setIsLoading(false);
    }
  }

  const urgentReviews = data?.reviews.filter((review) => ["critical", "high"].includes(review.urgency)).slice(0, 5) ?? [];

  return (
    <main className="min-h-screen px-5 py-6 text-ink md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-4 border-b border-stone-300 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-mint">Sarap.ai</p>
            <h1 className="mt-2 text-4xl font-semibold">Reputation Dashboard</h1>
          </div>
          <form onSubmit={loadDashboard} className="grid gap-3 rounded-lg border border-stone-300 bg-white p-3 md:grid-cols-[minmax(240px,1fr)_120px_auto]">
            <input
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="Bearer token"
              className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-mint"
              type="password"
              required
            />
            <input
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
              placeholder="Org ID"
              className="rounded-md border border-stone-300 px-3 py-2 text-sm outline-none focus:border-mint"
              inputMode="numeric"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="rounded-md bg-mint px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Loading" : "Load"}
            </button>
          </form>
        </header>

        {error ? <div className="rounded-lg border border-tomato/30 bg-red-50 p-4 text-sm text-tomato">{error}</div> : null}

        {data?.summary ? (
          <>
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Negative this week" value={data.summary.negative_reviews_this_week} tone="danger" />
              <MetricCard label="Unanswered negative" value={data.summary.unanswered_negative_reviews} tone="warning" />
              <MetricCard label="AI replies prepared" value={data.summary.ai_replies_prepared} />
              <MetricCard label="Rating change" value={data.summary.rating_change.toFixed(2)} />
            </section>

            <section className="grid gap-5 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="rounded-lg border border-stone-300 bg-white p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-semibold">Urgent reviews</h2>
                    <p className="text-sm text-stone-500">High and critical reviews from the current organization.</p>
                  </div>
                  <span className="rounded-md bg-field px-3 py-1 text-sm text-stone-600">{urgentReviews.length} shown</span>
                </div>

                <div className="mt-5 divide-y divide-stone-200">
                  {urgentReviews.length ? (
                    urgentReviews.map((review) => (
                      <article key={review.id} className="py-4">
                        <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-stone-500">
                          <span>{review.review_date}</span>
                          <span>{review.sentiment}</span>
                          <span>{review.category}</span>
                          <span className="font-semibold text-tomato">{review.urgency}</span>
                        </div>
                        <p className="mt-2 text-sm leading-6">{review.text}</p>
                        <p className="mt-2 text-xs text-stone-500">{review.summary}</p>
                      </article>
                    ))
                  ) : (
                    <p className="py-6 text-sm text-stone-500">No urgent reviews loaded.</p>
                  )}
                </div>
              </div>

              <aside className="rounded-lg border border-stone-300 bg-white p-5">
                <h2 className="text-xl font-semibold">Today</h2>
                <dl className="mt-5 space-y-4 text-sm">
                  <div>
                    <dt className="text-stone-500">Highest-risk branch</dt>
                    <dd className="font-medium">{data.summary.highest_risk_branch ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Top complaint</dt>
                    <dd className="font-medium">{data.summary.top_complaint_this_week ?? "None"}</dd>
                  </div>
                  <div>
                    <dt className="text-stone-500">Recommended action</dt>
                    <dd className="font-medium leading-6">{data.summary.recommended_action}</dd>
                  </div>
                </dl>
              </aside>
            </section>

            <section className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-lg border border-stone-300 bg-white p-5">
                <h2 className="text-xl font-semibold">Branches</h2>
                <div className="mt-4 grid gap-3">
                  {data.branches.map((branch) => (
                    <div key={branch.id} className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-stone-200 p-3">
                      <div>
                        <p className="font-medium">{branch.name}</p>
                        <p className="text-sm text-stone-500">{branch.city}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p>{branch.current_rating.toFixed(2)}</p>
                        <p className="text-stone-500">{branch.risk_level}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-stone-300 bg-white p-5">
                <h2 className="text-xl font-semibold">Weekly reports</h2>
                <div className="mt-4 grid gap-3">
                  {data.reports.length ? (
                    data.reports.slice(0, 4).map((report) => (
                      <div key={report.id} className="rounded-md border border-stone-200 p-3">
                        <p className="font-medium">
                          {report.week_start} - {report.week_end}
                        </p>
                        <p className="mt-1 text-sm text-stone-500">{report.summary}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-stone-500">No reports generated yet.</p>
                  )}
                </div>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-lg border border-stone-300 bg-white p-8">
            <h2 className="text-2xl font-semibold">Connect to the backend</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-stone-600">
              Register or log in through the backend, paste the bearer token, and load the first organization. The page uses
              `/auth/me`, organization-scoped reviews, branches, reports, and today dashboard endpoints.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}
