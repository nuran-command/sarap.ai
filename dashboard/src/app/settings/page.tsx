"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, listOrganizations } from "@/lib/api";
import type { Organization, User } from "@/types/api";

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [apiUrl, setApiUrl] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      setError(null);

      try {
        setApiUrl(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000");

        const [currentUser, loadedOrganizations] = await Promise.all([
          getCurrentUser(),
          listOrganizations(),
        ]);

        setUser(currentUser);
        setOrganizations(loadedOrganizations);
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load settings.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadSettings();
  }, []);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="border-b border-stone-200 pb-5">
        <h1 className="text-2xl font-semibold text-ink">Settings</h1>
        <p className="mt-2 text-sm text-stone-600">
          Workspace, account, and local development configuration.
        </p>
      </header>

      {error ? (
        <div className="rounded-lg border border-tomato/30 bg-red-50 p-4 text-sm text-tomato">
          {error}
        </div>
      ) : null}

      {isLoading ? (
        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
          Loading settings...
        </div>
      ) : null}

      {!isLoading ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-base font-semibold text-ink">Account</h2>
            <div className="mt-4 grid gap-3 text-sm">
            
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-400">Email</p>
                <p className="mt-1 text-stone-800">{user?.email ?? "Not available"}</p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-base font-semibold text-ink">API Configuration</h2>
            <div className="mt-4 grid gap-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-400">Backend URL</p>
                <p className="mt-1 rounded-md bg-stone-50 px-3 py-2 font-mono text-xs text-stone-700">
                  {apiUrl}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-stone-400">FastAPI Docs</p>
                <p className="mt-1 rounded-md bg-stone-50 px-3 py-2 font-mono text-xs text-stone-700">
                  http://localhost:8000/docs
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-stone-200 bg-white p-5 xl:col-span-2">
            <h2 className="text-base font-semibold text-ink">Organizations</h2>

            {organizations.length > 0 ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-stone-200">
                <table className="w-full border-collapse text-left text-sm">
                  <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
                    <tr>
                      <th className="px-4 py-3">ID</th>
                      <th className="px-4 py-3">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {organizations.map((organization) => (
                      <tr key={organization.id} className="border-t border-stone-200">
                        <td className="px-4 py-3 text-stone-500">{organization.id}</td>
                        <td className="px-4 py-3 font-medium text-stone-800">{organization.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-600">
                No organizations are available yet.
              </p>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}