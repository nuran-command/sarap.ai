import type { Branch, DashboardSummary, Organization, Review, User, WeeklyReport } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

type RequestOptions = RequestInit & {
  token?: string;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (options.token) {
    headers.set("Authorization", `Bearer ${options.token}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function getCurrentUser(token: string): Promise<User> {
  return apiRequest<User>("/auth/me", { token });
}

export function listOrganizations(token: string): Promise<Organization[]> {
  return apiRequest<Organization[]>("/organizations", { token });
}

export function listBranches(token: string, organizationId: number): Promise<Branch[]> {
  return apiRequest<Branch[]>(`/organizations/${organizationId}/branches`, { token });
}

export function listReviews(token: string, organizationId: number): Promise<Review[]> {
  return apiRequest<Review[]>(`/organizations/${organizationId}/reviews`, { token });
}

export function getDashboardSummary(token: string, organizationId: number): Promise<DashboardSummary> {
  return apiRequest<DashboardSummary>(`/organizations/${organizationId}/dashboard/today`, { token });
}

export function listWeeklyReports(token: string, organizationId: number): Promise<WeeklyReport[]> {
  return apiRequest<WeeklyReport[]>(`/organizations/${organizationId}/reports/weekly`, { token });
}

