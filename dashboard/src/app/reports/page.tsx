"use client";

import { useEffect, useState } from "react";
import { WeeklyReportCard } from "@/components/WeeklyReportCard";
import { listOrganizations, listWeeklyReports } from "@/lib/api";
import type { Organization, WeeklyReport } from "@/types/api";

export default function ReportsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInitialReports() {
      setIsLoading(true);
      setError(null);

      try {
        const loadedOrganizations = await listOrganizations();
        setOrganizations(loadedOrganizations);

        const activeOrganizationId = loadedOrganizations[0]?.id;

        if (!activeOrganizationId) {
          setReports([]);
          setOrganizationId("");
          return;
        }

        setOrganizationId(String(activeOrganizationId));

        const loadedReports = await listWeeklyReports(activeOrganizationId);
        setReports(loadedReports);
      } catch (loadError) {
        setReports([]);
        setError(loadError instanceof Error ? loadError.message : "Unable to load reports.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialReports();
  }, []);

  async function handleOrganizationChange(nextOrganizationId: string) {
    setOrganizationId(nextOrganizationId);
    setError(null);

    if (!nextOrganizationId) {
      setReports([]);
      return;
    }

    setIsLoading(true);

    try {
      const loadedReports = await listWeeklyReports(Number(nextOrganizationId));
      setReports(loadedReports);
    } catch (loadError) {
      setReports([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load reports.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Reports</h1>
          <p className="mt-2 text-sm text-stone-600">
            Weekly performance summaries, branch trends, and operational recommendations.
          </p>
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

      {error ? (
        <div className="rounded-lg border border-tomato/30 bg-red-50 p-4 text-sm text-tomato">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
          Loading reports...
        </div>
      ) : null}

      {!isLoading && reports.length > 0 ? (
        <section className="grid gap-4">
          {reports.map((report) => (
            <WeeklyReportCard key={report.id} report={report} />
          ))}
        </section>
      ) : null}

      {!isLoading && reports.length === 0 ? (
        <section className="rounded-lg border border-stone-200 bg-white p-6">
          <h2 className="text-base font-semibold text-ink">No weekly reports yet</h2>
          <p className="mt-2 text-sm text-stone-600">
            Reports will appear here after they are generated from the backend weekly report endpoint.
          </p>
          <p className="mt-3 text-xs text-stone-500">
            Check FastAPI Swagger at http://localhost:8000/docs and run the weekly report generation endpoint.
          </p>
        </section>
      ) : null}
    </div>
  );
}