# Sarap.ai

Sarap.ai is an AI-powered reputation management platform for restaurant groups in Kazakhstan and Central Asia.

The first product goal is to prove one workflow:

```text
CSV upload -> AI review analysis -> AI reply generation -> weekly report -> dashboard display
```

The MVP stays focused on restaurants first: no mobile app, no 2GIS/Kaspi/POS integrations, no auto-posting, and no advanced billing until the core workflow is validated.

## What Exists Now

The backend currently includes:

- JWT authentication.
- Organization and branch management.
- Branch address and Google Maps metadata.
- CSV review import.
- Deterministic local review analysis fallback.
- Russian and Kazakh reply draft generation.
- Review filters.
- Branch risk levels.
- Today dashboard summary.
- Weekly report generation.
- Alembic migration scaffold.

The frontend includes cookie-authenticated login/register screens, a persistent sidebar layout, and a branch management page.

## Repository Structure

```text
sarap.ai/
  backend/
    app/
      main.py
      config.py
      database.py
      models/
      schemas/
      routes/
      services/
      utils/
    alembic/
    alembic.ini
    requirements.txt
    Dockerfile
    docker-compose.yml
    .env.example

  dashboard/
    src/
      app/
      components/
      lib/
      types/
    package.json

  data/
    sample_reviews.csv

  docs/
    api.md
    database.md
    outreach.md
    product.md
    prompts.md
    roadmap.md
```

## Backend Setup

Use Python 3.12. The Dockerfile is pinned to Python 3.12, and `backend/.python-version` documents the same local runtime.

```bash
cd backend
cp .env.example .env
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Backend URL:

```text
http://127.0.0.1:8000
```

Swagger docs:

```text
http://127.0.0.1:8000/docs
```

If `DATABASE_URL` is omitted, the backend defaults to local SQLite. For PostgreSQL:

```bash
cd backend
docker compose up -d
alembic upgrade head
uvicorn app.main:app --reload
```

## Alembic

From `backend/`:

```bash
alembic upgrade head
alembic revision --autogenerate -m "describe change"
```

The initial migration creates:

- `users`
- `organizations`
- `branches`
- `reviews`
- `ai_replies`
- `weekly_reports`

## Dashboard Setup

```bash
cd dashboard
npm install
npm run dev
```

Dashboard URL:

```text
http://localhost:3000
```

The dashboard reads `NEXT_PUBLIC_API_BASE_URL`; if omitted, it uses `http://127.0.0.1:8000`.

## Environment Variables

Backend variables are documented in `backend/.env.example`.

Important defaults:

- `DATABASE_URL`: PostgreSQL in production; SQLite fallback for local development.
- `SECRET_KEY`: must be changed before production.
- `AI_PROVIDER=local`: uses deterministic local MVP analysis/replies.
- `OPENAI_API_KEY`: optional until OpenAI-backed analysis is enabled.

## API Endpoints

See `docs/api.md` for details.

### Health

```text
GET /health
```

### Auth

```text
POST /auth/register
POST /auth/login
GET /auth/me
```

### Organizations

```text
POST /organizations
GET /organizations
GET /organizations/{organization_id}
```

### Branches

```text
POST /organizations/{organization_id}/branches
GET /organizations/{organization_id}/branches
GET /branches/{branch_id}
PATCH /branches/{branch_id}
```

### Reviews

```text
POST /organizations/{organization_id}/reviews/import
GET /organizations/{organization_id}/reviews
PATCH /reviews/{review_id}/answered
```

Supported review filters:

```text
branch_id
sentiment
category
urgency
is_answered
```

### AI Replies

```text
GET /reviews/{review_id}/replies
POST /reviews/{review_id}/replies
```

### Reports And Dashboard

```text
POST /organizations/{organization_id}/reports/weekly/generate
GET /organizations/{organization_id}/reports/weekly
GET /organizations/{organization_id}/dashboard/today
```

## Sample CSV

Use `data/sample_reviews.csv` to test review import.

Expected CSV fields:

```csv
branch_name,reviewer_name,rating,text,review_date,source,is_answered
Mega Alma-Ata,Aigerim,2,"Ждали заказ 40 минут, официант не подходил.",2026-06-01,google,false
```

## MVP Priorities

1. Keep the backend workflow stable.
2. Finish the dashboard screens around the existing API.
3. Test the full flow with sample restaurant data.
4. Use pilot feedback before adding integrations.

## License

Private project. All rights reserved.
