'use server';

import { getAuthToken } from './auth';
import type { Branch, DashboardSummary, Organization, Review, User, WeeklyReport } from "@/types/api";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface RequestOptions extends RequestInit {
  requireAuth?: boolean;
}

export async function fetchApi<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { requireAuth = true, headers, ...customConfig } = options;

  const config: RequestInit = {
    ...customConfig,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (requireAuth) {
    const token = await getAuthToken();
    if (token) {
      config.headers = {
        ...config.headers,
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

export function listReviews(organizationId: number): Promise<Review[]> {
  return fetchApi<Review[]>(`/organizations/${organizationId}/reviews`);
}

export function getDashboardSummary(organizationId: number): Promise<DashboardSummary> {
  return fetchApi<DashboardSummary>(`/organizations/${organizationId}/dashboard/today`);
}

export function listWeeklyReports(organizationId: number): Promise<WeeklyReport[]> {
  return fetchApi<WeeklyReport[]>(`/organizations/${organizationId}/reports/weekly`);
}
