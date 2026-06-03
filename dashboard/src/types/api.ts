export type User = {
  id: number;
  email: string;
  full_name: string | null;
  created_at: string;
};

export type Organization = {
  id: number;
  owner_id: number;
  name: string;
  city: string;
  created_at: string;
};

export type Branch = {
  id: number;
  organization_id: number;
  name: string;
  city: string;
  address: string | null;
  google_maps_url: string | null;
  current_rating: number;
  review_count: number;
  risk_level: string;
  status_flag: "critical" | "warning" | "stable";
  weekly_negative_reviews: number;
  unanswered_reviews: number;
  last_review_date: string | null;
  created_at: string;
};

export type BranchCreatePayload = {
  name: string;
  city: string;
  address?: string | null;
  google_maps_url?: string | null;
};

export type BranchUpdatePayload = Partial<BranchCreatePayload>;

export type Review = {
  id: number;
  branch_id: number;
  reviewer_name: string | null;
  rating: number;
  text: string;
  review_date: string;
  source: string;
  is_answered: boolean;
  sentiment: string;
  category: string;
  urgency: string;
  language: string;
  summary: string;
  created_at: string;
};

export type DashboardSummary = {
  total_reviews_today: number;
  negative_reviews_today: number;
  critical_reviews_today: number;
  unanswered_reviews_today: number;
  negative_reviews_this_week: number;
  unanswered_negative_reviews: number;
  branches_at_risk: number;
  highest_risk_branch: string | null;
  primary_complaint_today: string | null;
  top_complaint_this_week: string | null;
  rating_change: number;
  ai_replies_prepared: number;
  recommended_action: string;
};

export type WeeklyReport = {
  id: number;
  organization_id: number;
  week_start: string;
  week_end: string;
  total_reviews: number;
  negative_reviews: number;
  unanswered_reviews: number;
  top_complaint: string;
  worst_branch: string;
  rating_change: number;
  summary: string;
  recommended_actions: string[];
  created_at: string;
};
