# Sarap.ai API

Base URL for local development:

```text
http://localhost:8000
```

## Auth

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`

Both return a bearer token. Pass it as:

```text
Authorization: Bearer <token>
```

`GET /auth/me` returns the current authenticated user.

## Organizations And Branches

- `POST /organizations`
- `GET /organizations`
- `GET /organizations/{organization_id}`
- `POST /organizations/{organization_id}/branches`
- `GET /organizations/{organization_id}/branches`
- `GET /branches/{branch_id}`
- `PATCH /branches/{branch_id}`

Branch create/update payload:

```json
{
  "name": "Mega Alma-Ata",
  "city": "Almaty",
  "address": "Rozybakiev 247A",
  "google_maps_url": "https://maps.google.com/..."
}
```

Branch reads also include calculated dashboard fields:

- `status_flag`: `critical`, `warning`, or `stable`.
- `weekly_negative_reviews`
- `unanswered_reviews`
- `last_review_date`

## Reviews

- `POST /organizations/{organization_id}/reviews/import`
- `GET /organizations/{organization_id}/reviews`
- `PATCH /reviews/{review_id}/answered`

CSV fields:

```csv
branch_name,reviewer_name,rating,text,review_date,source,is_answered
Mega Alma-Ata,Aigerim,2,"Ждали заказ 40 минут, официант не подходил.",2026-06-01,google,false
```

## AI Replies

- `GET /reviews/{review_id}/replies`
- `POST /reviews/{review_id}/replies`

Reply generation supports:

- language: `ru`, `kk`.
- tone: `formal`, `warm`, `short`, `apologetic`.

## Reports And Dashboard

- `POST /organizations/{organization_id}/reports/weekly/generate`
- `GET /organizations/{organization_id}/reports/weekly`
- `GET /organizations/{organization_id}/dashboard/today`

Today dashboard fields include:

- `total_reviews_today`
- `negative_reviews_today`
- `critical_reviews_today`
- `unanswered_reviews_today`
- `negative_reviews_this_week`
- `unanswered_negative_reviews`
- `branches_at_risk`
- `highest_risk_branch`
- `primary_complaint_today`
- `top_complaint_this_week`
- `rating_change`
- `ai_replies_prepared`
- `recommended_action`
