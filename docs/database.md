# Database Model

## Core Entities

- `users`: authentication identity.
- `organizations`: restaurant groups owned by a user.
- `branches`: restaurant locations under an organization.
- `reviews`: imported customer reviews with AI analysis fields.
- `ai_replies`: generated reply drafts per review.
- `weekly_reports`: weekly reputation summaries and recommended actions.

## MVP Ownership Model

The first version uses simple owner-based access:

- A user owns organizations.
- Branches, reviews, replies, and reports are reachable through the organization.
- No enterprise roles or multi-tenant permission matrix in the first 90 days.

## Branch Location Fields

Branches store the core location profile used by the dashboard:

- `name`
- `city`
- `address`
- `google_maps_url`

## Local Development

The backend defaults to SQLite when `DATABASE_URL` is omitted. Production should use PostgreSQL.
