"use client";

import { FormEvent, useEffect, useState } from "react";
import { BranchRiskCard } from "@/components/BranchRiskCard";
import { createBranch, listBranches, listOrganizations } from "@/lib/api";
import type { Branch, BranchCreatePayload, Organization } from "@/types/api";

const initialBranchForm: BranchCreatePayload = {
  name: "",
  city: "Almaty",
  address: "",
  google_maps_url: "",
};

export default function BranchesPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState<BranchCreatePayload>(initialBranchForm);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function loadInitialState() {
      setIsLoading(true);
      setError(null);
      try {
        const loadedOrganizations = await listOrganizations();
        setOrganizations(loadedOrganizations);
        const activeOrganizationId = loadedOrganizations[0]?.id;

        if (!activeOrganizationId) {
          setBranches([]);
          return;
        }

        setOrganizationId(String(activeOrganizationId));
        setBranches(await listBranches(activeOrganizationId));
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : "Unable to load branches.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadInitialState();
  }, []);

  async function handleOrganizationChange(nextOrganizationId: string) {
    setOrganizationId(nextOrganizationId);
    setError(null);
    if (!nextOrganizationId) {
      setBranches([]);
      return;
    }

    setIsLoading(true);
    try {
      setBranches(await listBranches(Number(nextOrganizationId)));
    } catch (loadError) {
      setBranches([]);
      setError(loadError instanceof Error ? loadError.message : "Unable to load branches.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleCreateBranch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organizationId) {
      setError("Create or select an organization first.");
      return;
    }

    setIsCreating(true);
    setError(null);
    try {
      const branch = await createBranch(Number(organizationId), {
        name: form.name.trim(),
        city: form.city.trim() || "Almaty",
        address: form.address?.trim() || null,
        google_maps_url: form.google_maps_url?.trim() || null,
      });
      setBranches((currentBranches) => [...currentBranches, branch].sort((first, second) => first.name.localeCompare(second.name)));
      setForm(initialBranchForm);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "Unable to create branch.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-ink">Branches</h1>
          <p className="mt-2 text-sm text-stone-600">Manage restaurant locations for the active organization.</p>
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

      <section className="grid gap-5 xl:grid-cols-[360px_1fr]">
        <form onSubmit={handleCreateBranch} className="rounded-lg border border-stone-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Create branch</h2>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Name
              <input
                value={form.name}
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, name: event.target.value }))}
                className="h-10 rounded-md border border-stone-300 px-3 outline-none focus:border-mint"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-stone-700">
              City
              <input
                value={form.city}
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, city: event.target.value }))}
                className="h-10 rounded-md border border-stone-300 px-3 outline-none focus:border-mint"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Address
              <input
                value={form.address ?? ""}
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, address: event.target.value }))}
                className="h-10 rounded-md border border-stone-300 px-3 outline-none focus:border-mint"
              />
            </label>

            <label className="grid gap-1 text-sm font-medium text-stone-700">
              Google Maps URL
              <input
                value={form.google_maps_url ?? ""}
                onChange={(event) => setForm((currentForm) => ({ ...currentForm, google_maps_url: event.target.value }))}
                className="h-10 rounded-md border border-stone-300 px-3 outline-none focus:border-mint"
                type="url"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isCreating}
            className="mt-5 h-10 w-full rounded-md bg-ink px-4 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isCreating ? "Creating branch" : "Create branch"}
          </button>
        </form>

        <div>
          <div className="mb-3 flex items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-ink">Locations</h2>
            <span className="text-sm text-stone-500">{isLoading ? "Loading" : `${branches.length} branches`}</span>
          </div>

          <div className="grid gap-3">
            {branches.map((branch) => (
              <BranchRiskCard key={branch.id} branch={branch} />
            ))}

            {!branches.length && !isLoading ? (
              <div className="rounded-lg border border-stone-200 bg-white p-5 text-sm text-stone-600">
                No branches yet.
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
