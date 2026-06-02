# AI Review Analysis And Reply Rules

## Classification

Each review must be classified into:

- sentiment: positive, neutral, negative.
- category: waiting_time, food_quality, staff_behavior, cleanliness, delivery_issue, price_value, atmosphere, reservation, other.
- urgency: low, medium, high, critical.
- language: ru, kk, en, other.
- summary: one short operational summary.

## Reply Rules

Every AI reply must:

- Thank the customer.
- Acknowledge the issue.
- Stay professional.
- Avoid blaming the customer.
- Avoid promising compensation.
- Stay under 90 words.
- Match requested language: Russian or Kazakh.

## MVP Local Fallback

The backend includes deterministic local classification and reply templates so pilots can run before OpenAI billing or prompt tuning is finalized. When `AI_PROVIDER=openai` is enabled later, keep the same schema and quality checklist.

