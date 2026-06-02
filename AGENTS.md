# AGENTS.md

Sarap.ai is a B2B SaaS product for restaurant groups in Kazakhstan and Central Asia.

The MVP is a web dashboard for restaurant reputation management:

- CSV review import.
- AI review analysis.
- AI reply drafts in Russian and Kazakh.
- Branch risk levels.
- Weekly reputation reports.
- Clear recommended actions for managers.

First milestone:

```text
CSV upload -> AI review analysis -> AI reply generation -> weekly report -> dashboard display
```

Do not expand the first version into mobile apps, 2GIS/Kaspi/POS integrations, auto-posting, competitor intelligence, advanced billing, white-label, or enterprise permissions until the core workflow is working.

Keep the repo as a monorepo:

```text
backend/
dashboard/
docs/
data/
```

