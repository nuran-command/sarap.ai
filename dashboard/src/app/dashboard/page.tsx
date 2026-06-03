"use client";

import { useEffect, useMemo, useState } from "react";
import { BranchRiskCard } from "@/components/BranchRiskCard";
import { MetricCard } from "@/components/MetricCard";
import { TodaySummaryCard } from "@/components/TodaySummaryCard";
import { getDashboardSummary, listBranches, listOrganizations } from "@/lib/api";
import type { Branch, DashboardSummary, Organization } from "@/types/api";

export default function DashboardPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadInitialDashboard() {
      setIsLoading(true);
      setError(null);
      try {
        const loadedOrganizations = await listOrganizations();
        setOrganizations(loadedOrganizations);
        const activeOrganizationId = loadedOrganizations[0]?.id;

        if (!activeOrganizationId) {
          setSummary(null);
          setBranches([]);
          return;
        }

        setOrganizationId(String(activeOrganizationId));
        const [nextSummary, nextBranches] = await Promise.all([
          getDashboardSummary(activeOrganizationId),
          listBranches(activeOrganizationId),
        ]);
        setSummary(nextSummary);
        setBranches(nextBranches);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialDashboard();
  }, []);

  async function handleOrganizationChange(nextOrganizationId: string) {
    setOrganizationId(nextOrganizationId);
    setError(null);
    if (!nextOrganizationId) {
      setSummary(null);
      setBranches([]);
      return;
    }

    setIsLoading(true);
    try {
      const activeOrganizationId = Number(nextOrganizationId);
      const [nextSummary, nextBranches] = await Promise.all([
        getDashboardSummary(activeOrganizationId),
        listBranches(activeOrganizationId),
      ]);
      setSummary(nextSummary);
      setBranches(nextBranches);
    } catch (loadError) {
      setSummary(null);
      setBranches([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load dashboard.");
    } finally {
      setIsLoading(false);
    }
  }

  const riskBranches = useMemo(
    () =>
      branches
        .filter((branch) => branch.status_flag !== "stable")
        .sort((first, second) => second.weekly_negative_reviews - first.weekly_negative_reviews)
        .slice(0, 4),
    [branches],
  );

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Dashboard</h1>
          <p className="mt-2 text-sm text-stone-600">Daily reputation state for the selected restaurant group.</p>
        </div>

        <select
          value={organizationId}
          onChange={(event) => void handleOrganizationChange(event.target.value)}
          className="h-10 rounded-md border border-stone-300 bg-white px-3 text-sm outline-none focus:border-mint md:min-w-64"
        >
          <option value="">Organization</option>
          {organizations.map((organization) => (
            <option key={organization.id} value={organization.id}>
              {organization.name}
            </option>
          ))}
        </select>
      </header>

      {error ? <div className="rounded-lg border border-tomato/30 bg-red-50 p-4 text-sm text-tomato">{error}</div> : null}

      {isLoading ? <div className="py-16 text-center text-sm text-stone-500">Loading dashboard data...</div> : null}

      {!isLoading && summary ? (
        <>
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard label="Reviews today" value={summary.total_reviews_today} />
            <MetricCard label="Negative today" value={summary.negative_reviews_today} tone="danger" />
            <MetricCard label="Critical today" value={summary.critical_reviews_today} tone="danger" />
            <MetricCard label="Unanswered today" value={summary.unanswered_reviews_today} tone="warning" />
          </section>

          <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
            <TodaySummaryCard summary={summary} />
            <div className="grid gap-4 sm:grid-cols-2">
              <MetricCard label="Negative this week" value={summary.negative_reviews_this_week} tone="danger" />
              <MetricCard label="Unanswered negative" value={summary.unanswered_negative_reviews} tone="warning" />
              <MetricCard label="Branches at risk" value={summary.branches_at_risk} tone={summary.branches_at_risk ? "warning" : "neutral"} />
              <MetricCard label="Rating change" value={summary.rating_change.toFixed(2)} />
            </div>
          </section>

          <section>
            <div className="mb-3 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold text-ink">Risk branches</h2>
              <span className="text-sm text-stone-500">{riskBranches.length} active</span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {riskBranches.length ? (
                riskBranches.map((branch) => <BranchRiskCard key={branch.id} branch={branch} />)
              ) : (
                <div className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-600">
                  No warning or critical branches in the current selection.
                </div>
              )}
            </div>
          </section>
        </>
      ) : null}

      {!isLoading && !summary ? (
        <section className="rounded-lg border border-stone-200 bg-white p-6 text-sm text-stone-600">
          No organization dashboard is available yet.
        </section>
      ) : null}
    </div>
  );
}
