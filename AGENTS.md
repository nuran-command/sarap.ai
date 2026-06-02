# 🤖 Coding Agent Guidelines (AGENTS.md)

Welcome, agent! You are working on **Sarap.ai**, a B2B SaaS reputation system for restaurants in Central Asia. Please adhere to these guidelines to ensure structural cohesion, beautiful designs, and solid programming standards.

---

## 🏛️ Code Architecture Principles

### 1. Backend Standards (FastAPI + SQLModel / SQLAlchemy)
* **Separation of Concerns**: Keep routes (`routes/`), database models (`models/`), schemas (`schemas/`), business logic (`services/`), and helpers (`utils/`) separate.
* **Strict Type Safety**: Use Pydantic schemas for request/response serialization. Enable strict checks where possible.
* **Database Access**: Always use dependency injection (`Depends(get_db)`) to secure database sessions. Ensure proper transaction management.
* **Auth Guarding**: Route paths modifying data must be guarded with JWT JWT Token dependency injections.
* **Migrations**: Never modify the database directly. Always generate a clean Alembic migration (`alembic revision --autogenerate`) for changes.

### 2. Frontend Standards (Next.js + Tailwind CSS)
* **Visual Premium Excellence**: The UI must look clean, responsive, modern, and high-fidelity. Use cohesive custom color systems (slate/emerald/amber/rose palettes), modern custom micro-animations, glassmorphism, and dynamic visual hover indicators. No default styling.
* **App Router Navigation**: Adhere to Next.js App Router rules. Use proper folder nested layouts. Keep components client-side only when reactive (`"use client"`), and server-side by default.
* **Reusable UI Units**: Separate layout shells, data components, and presentation components.
* **Localization**: Keep bi-lingual support in mind. Keep text strings easy to translate (Russian & Kazakh).

---

## 📦 Monorepo Folder Manifest

```
/
├── backend/            # FastAPI, alembic, docker-compose, and requirements
│   ├── app/
│   │   ├── main.py     # Application entry
│   │   ├── models/     # Database models
│   │   ├── schemas/    # Pydantic schemas
│   │   ├── routes/     # Router paths
│   │   ├── services/   # Business logic (OpenAI, reports)
│   │   └── utils/      # Helpers (CSV parsing, auth security)
├── dashboard/          # Next.js 14+ frontend
│   ├── src/
│   │   ├── app/        # App router routes & pages
│   │   ├── components/ # Core design components
│   │   ├── lib/        # API client and auth session wrappers
│   │   └── types/      # TypeScript declarations
└── docs/               # Detailed architectural / product specs
```

---

## 🧭 Workflow Process
1. Before implementing any major feature, create/update an `implementation_plan.md` in the current brain artifacts folder.
2. Track items sequentially inside `task.md`.
3. Verify syntax and run testing routines before final commit pushing.
