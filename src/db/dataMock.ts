import { Branch, Staff, Review, MenuFeedback, SentimentMetric } from '../types';

// Pre-seeded Central Asian branches
export const initialBranches: Branch[] = [
  { id: 'b1', name: 'Almaty Dostyk Gourmet', city: 'Almaty', address: 'Dostyk Ave 104, Almaty' },
  { id: 'b2', name: 'Astana Nomad Palace', city: 'Astana', address: 'Qabanbay Batyr Ave 37, Astana' }
];

// Pre-seeded Central Asian waiter staff with pre-defined QR UUIDs
export const initialStaff: Staff[] = [
  {
    id: 's1',
    first_name: 'Sanzhar',
    branch_id: 'b1',
    qr_code_uuid: 'sanzhar-qr-7777-8888',
    is_active: true,
    role: 'Senior Waiter',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    review_count: 42,
    average_rating: 4.9,
    top_qualities: ['Friendly', 'Polite', 'Quick Beshbarmak serving']
  },
  {
    id: 's2',
    first_name: 'Ainur',
    branch_id: 'b1',
    qr_code_uuid: 'ainur-qr-2222-3333',
    is_active: true,
    role: 'Lead Waitress',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    review_count: 31,
    average_rating: 4.8,
    top_qualities: ['Excellent Recommendations', 'Thorough', 'Attentive']
  },
  {
    id: 's3',
    first_name: 'Temirlan',
    branch_id: 'b2',
    qr_code_uuid: 'temirlan-qr-4444-5555',
    is_active: true,
    role: 'Server',
    review_count: 25,
    average_rating: 4.4,
    top_qualities: ['Fast service', 'Polite']
  },
  {
    id: 's4',
    first_name: 'Madiyar',
    branch_id: 'b2',
    qr_code_uuid: 'madiyar-qr-6666-7777',
    is_active: false,
    role: 'Server',
    review_count: 12,
    average_rating: 3.9,
    top_qualities: ['Helpful']
  }
];

// Seed reviews for Central Asian specialties
export const initialReviews: Review[] = [
  {
    id: 'rev1',
    rating: 5,
    comment: 'The Beshbarmak was absolutely authentic and delicious. Sanzhar served us quickly and was very polite!',
    reviewer_name: 'Kunsulu Akhmetova',
    urgency: 'low',
    is_answered: true,
    branch_id: 'b1',
    staff_id: 's1',
    review_date: '2026-06-20',
    platform: '2GIS',
    created_at: '2026-06-20T18:30:00Z',
    ai_response_draft: 'Құрметті Kunsulu! Біздің Бешбармақ пен Сәнжардың қызметін жоғары бағалағаныңызға көп рахмет! Сізді тағы да күтеміз!',
    dishes_feedback: [
      { name: 'Бешбармак', liked: true },
      { name: 'Бауырсақ', liked: true }
    ]
  },
  {
    id: 'rev2',
    rating: 2,
    comment: 'Manty were completely cold when served. The service was slow today, it took 30 minutes to get our tea.',
    reviewer_name: 'Daniyar Zhusupov',
    urgency: 'high',
    is_answered: false,
    branch_id: 'b1',
    staff_id: 's2',
    review_date: '2026-06-21',
    platform: 'Google',
    created_at: '2026-06-21T12:15:00Z',
    dishes_feedback: [
      { name: 'Манты', liked: false },
      { name: 'Шай', liked: false }
    ]
  },
  {
    id: 'rev3',
    rating: 5,
    comment: 'Wow, incredible Lagman! Spiced perfectly. Ainur was great at keeping our table clean. Definitely coming back.',
    reviewer_name: 'Elena Smirnova',
    urgency: 'low',
    is_answered: false,
    branch_id: 'b1',
    staff_id: 's2',
    review_date: '2026-06-21',
    platform: '2GIS',
    created_at: '2026-06-21T14:40:00Z',
    dishes_feedback: [
      { name: 'Лагман', liked: true },
      { name: 'Бауырсақ', liked: true }
    ]
  },
  {
    id: 'rev4',
    rating: 3,
    comment: 'Plov was average but a bit too greasy for my stomach. The hot Baursaks were amazing though.',
    reviewer_name: 'Arman Mukhanov',
    urgency: 'medium',
    is_answered: false,
    branch_id: 'b2',
    staff_id: 's3',
    review_date: '2026-06-19',
    platform: 'Google',
    created_at: '2026-06-19T09:05:00Z',
    dishes_feedback: [
      { name: 'Плов', liked: false },
      { name: 'Бауырсақ', liked: true }
    ]
  },
  {
    id: 'rev5',
    rating: 5,
    comment: 'Kazy and cold Shubat were outstanding on a hot summer Almaty day.',
    reviewer_name: 'John Doe',
    urgency: 'low',
    is_answered: true,
    branch_id: 'b1',
    review_date: '2026-06-18',
    platform: '2GIS',
    created_at: '2026-06-18T13:20:00Z',
    ai_response_draft: 'Thank you John! Glad you loved our Kazy and refreshing Shubat! Visit us again soon!',
    dishes_feedback: [
      { name: 'Қазы', liked: true }
    ]
  }
];

// Helper to calculate the BCG Sentiment Matrix Categories for dishes listed in the menu feedback
// Categorization criteria:
// - Stars: High Mentions, High Positive rate (Mentions >= 3, Positive >= 70%)
// - Hidden Gems: Low Mentions, High Positive rate (Mentions < 3, Positive >= 70%)
// - Problems: High Mentions, Low Positive rate (Mentions >= 3, Positive < 70%) or specific bad sentiment count
// - Outsiders: Low Mentions, Low Positive rate (Mentions < 3, Positive < 70%)
export function getMenuSentimentMetrics(reviews: Review[]): SentimentMetric[] {
  const counts: Record<string, { total: number; positive: number }> = {};

  // Track initial mock sentiment counts to make sure other central Asian dishes appear nicely
  const defaultDishes = [
    { name: 'Бешбармак', total: 6, positive: 5 },
    { name: 'Бауырсақ', total: 8, positive: 7 },
    { name: 'Манты', total: 5, positive: 2 },
    { name: 'Лагман', total: 4, positive: 3 },
    { name: 'Қазы', total: 3, positive: 3 },
    { name: 'Плов', total: 10, positive: 8 },
    { name: 'Куырдак', total: 2, positive: 2 },
    { name: 'Шай', total: 3, positive: 1 }
  ];

  defaultDishes.forEach(d => {
    counts[d.name] = { total: d.total, positive: d.positive };
  });

  // Aggregate from reviews
  reviews.forEach(r => {
    if (r.dishes_feedback) {
      r.dishes_feedback.forEach(df => {
        if (!counts[df.name]) {
          counts[df.name] = { total: 0, positive: 0 };
        }
        counts[df.name].total += 1;
        if (df.liked) {
          counts[df.name].positive += 1;
        }
      });
    }
  });

  return Object.keys(counts).map(dish_name => {
    const { total, positive } = counts[dish_name];
    const positive_percentage = total > 0 ? Math.round((positive / total) * 100) : 100;
    
    let category = 'Hidden Gems';
    if (total >= 4) {
      category = positive_percentage >= 70 ? 'Stars' : 'Problems';
    } else {
      category = positive_percentage >= 70 ? 'Hidden Gems' : 'Outsiders';
    }

    return {
      dish_name,
      category,
      mentions: total,
      positive_percentage
    };
  });
}
