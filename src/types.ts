/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Branch {
  id: string;
  name: string;
  city: string;
  address: string;
}

export interface Staff {
  id: string;
  first_name: string;
  branch_id: string;
  qr_code_uuid: string;
  is_active: boolean;
  role: string;
  avatar?: string;
  // Summary fields that can be calculated
  review_count?: number;
  average_rating?: number;
  top_qualities?: string[];
}

export interface MenuFeedback {
  id: string;
  review_id?: string;
  dish_name: string;
  is_positive: boolean;
  staff_id?: string;
}

export interface Review {
  id: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  urgency: 'low' | 'medium' | 'high';
  is_answered: boolean;
  branch_id: string;
  staff_id?: string;
  review_date: string;
  ai_response_draft?: string;
  platform: '2GIS' | 'Google' | 'Smart Buffer';
  created_at: string;
  dishes_feedback?: { name: string; liked: boolean }[];
}

export interface SmartBufferLog {
  id: string;
  qr_code_uuid: string;
  rating: number;
  comment: string;
  reviewer_name: string;
  dishes: { name: string; liked: boolean }[];
  webhook_sent: boolean;
  webhook_payload?: string;
  created_at: string;
}

export interface SentimentMetric {
  dish_name: string;
  category: string; // 'Stars' | 'Hidden Gems' | 'Problems' | 'Outsiders'
  mentions: number;
  positive_percentage: number;
}
