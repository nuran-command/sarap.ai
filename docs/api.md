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
