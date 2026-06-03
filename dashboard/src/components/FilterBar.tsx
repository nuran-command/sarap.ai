"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

type Branch = {
  id: number;
  name: string;
};

type FilterBarProps = {
  branches: Branch[];
};

export function FilterBar({ branches }: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilterChange = (name: string, value: string) => {
    router.push(pathname + "?" + createQueryString(name, value));
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-stone-200">
      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Branch</label>
        <select
          className="border border-stone-300 rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-mint focus:border-mint outline-none"
          value={searchParams.get("branch_id") || ""}
          onChange={(e) => handleFilterChange("branch_id", e.target.value)}
        >
          <option value="">All Branches</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id.toString()}>
              {branch.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Sentiment</label>
        <select
          className="border border-stone-300 rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-mint focus:border-mint outline-none"
          value={searchParams.get("sentiment") || ""}
          onChange={(e) => handleFilterChange("sentiment", e.target.value)}
        >
          <option value="">All Sentiments</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Urgency</label>
        <select
          className="border border-stone-300 rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-mint focus:border-mint outline-none"
          value={searchParams.get("urgency") || ""}
          onChange={(e) => handleFilterChange("urgency", e.target.value)}
        >
          <option value="">All Urgency</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <div className="flex flex-col gap-1.5 min-w-[150px]">
        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Status</label>
        <select
          className="border border-stone-300 rounded-md py-1.5 px-3 text-sm focus:ring-2 focus:ring-mint focus:border-mint outline-none"
          value={searchParams.get("is_answered") || ""}
          onChange={(e) => handleFilterChange("is_answered", e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="false">Unanswered</option>
          <option value="true">Answered</option>
        </select>
      </div>

      {searchParams.toString() && (
        <div className="flex flex-col gap-1.5 min-w-[100px] mt-auto">
          <button
            onClick={() => router.push(pathname)}
            className="text-sm font-medium text-tomato hover:text-tomato/80 px-2 py-1.5 h-[34px] flex items-center justify-center border border-transparent hover:bg-tomato/5 rounded-md transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
