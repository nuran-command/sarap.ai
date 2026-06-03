import { getAuthToken } from './auth';
import type {
  Branch,
  BranchCreatePayload,
  BranchUpdatePayload,
  DashboardSummary,
  Organization,
  Review,
  User,
  WeeklyReport,
} from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchApi<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requireAuth = true, headers, ...customConfig } = options;

  const config: RequestInit = {
    ...customConfig,
    headers: {
      ...headers,
    },
  };

  if (requireAuth) {
    const token = await getAuthToken();
    if (token) {
      config.headers = {
        ...(config.headers || {}),
        Authorization: `Bearer ${token}`,
      };
    }
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || 'An error occurred during the request');
  }

  return response.json();
}

export function getCurrentUser(): Promise<User> {
  return fetchApi<User>("/auth/me");
}

export function listOrganizations(): Promise<Organization[]> {
  return fetchApi<Organization[]>("/organizations");
}

export function listBranches(organizationId: number): Promise<Branch[]> {
  return fetchApi<Branch[]>(`/organizations/${organizationId}/branches`);
}

export function createBranch(organizationId: number, payload: BranchCreatePayload): Promise<Branch> {
  return fetchApi<Branch>(`/organizations/${organizationId}/branches`, {
    method: "POST",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function getBranch(branchId: number): Promise<Branch> {
  return fetchApi<Branch>(`/branches/${branchId}`);
}

export function updateBranch(branchId: number, payload: BranchUpdatePayload): Promise<Branch> {
  return fetchApi<Branch>(`/branches/${branchId}`, {
    method: "PATCH",
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export function listReviews(
  organizationId: number, 
  searchParams?: Record<string, string>
): Promise<Review[]> {
  const params = new URLSearchParams();
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
  }
  const queryString = params.toString() ? `?${params.toString()}` : '';
  return fetchApi<Review[]>(`/organizations/${organizationId}/reviews${queryString}`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function getDashboardSummary(organizationId: number): Promise<DashboardSummary> {
  return fetchApi<DashboardSummary>(`/organizations/${organizationId}/dashboard/today`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function listWeeklyReports(organizationId: number): Promise<WeeklyReport[]> {
  return fetchApi<WeeklyReport[]>(`/organizations/${organizationId}/reports/weekly`, {
    headers: { 'Content-Type': 'application/json' },
  });
}

export function uploadReviewsCsv(organizationId: number, formData: FormData): Promise<{ imported_reviews: number }> {
  return fetchApi<{ imported_reviews: number }>(`/organizations/${organizationId}/reviews/import`, {
    method: 'POST',
    body: formData,
    // Note: Do NOT set Content-Type header when sending FormData. 
    // The browser/fetch automatically sets it to multipart/form-data with the correct boundary.
  });
}
