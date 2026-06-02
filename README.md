# 🌟 Sarap.ai | B2B SaaS Reputation & Review Velocity System

Sarap.ai is a premium B2B SaaS reputation management platform specifically tailored for the restaurant and hospitality industry in **Kazakhstan and Central Asia**. 

Rather than just another generic AI reply generator, Sarap.ai serves as a comprehensive mission control for restaurant owners and managers to monitor customer sentiment, detect critical complaints instantly, leverage context-aware AI drafting in Russian and Kazakh, compare branch metrics, and act on structured weekly reputation intelligence.

---

## 🚀 Tech Stack

### Monorepo Structure
* **Frontend (`/dashboard`)**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, REST API integration
* **Backend (`/backend`)**: FastAPI, Python 3.11+, SQLAlchemy/SQLModel ORM, Alembic Migrations, JWT Authentication, Pandas (CSV Parsing), Pydantic v2
* **Infrastructure**: Docker (PostgreSQL database), GitHub Actions for CI/CD

---

## 🛠️ Project Structure

```
sarap-ai/
  ├── backend/           # FastAPI app & database migrations
  ├── dashboard/         # Next.js App Router admin panel
  ├── docs/              # Product schemas, roadmap, database & prompt guidelines
  ├── README.md          # Project roadmap and quickstart
  └── AGENTS.md          # Multi-agent developer instructions
```

---

## 🛫 Quickstart Guide

### 1. Prerequisites
* **Node.js**: >= 18.x
* **Python**: >= 3.11
* **Docker & Docker Compose**

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
docker compose up -d      # Start local PostgreSQL database
uvicorn app.main:app --reload
```
The interactive Swagger API documentation will be available at: http://localhost:8000/docs

### 3. Dashboard Frontend Setup
```bash
cd dashboard
npm install
npm run dev
```
Open http://localhost:3000 to view the responsive Sarap.ai dashboard panel.

---

## 🌍 Localization & Market Context
* **Bi-lingual AI Model**: Specialized response generation in Russian and Kazakh languages, accounting for regional hospitality idioms (e.g., traditional hospitality concepts, localized service levels in Central Asia).
* **Cross-Branch Analytics**: Centralized metrics mapping out branch performance across cities (Almaty, Astana, Shymkent, Tashkent, etc.).
* **Complaints Detection**: Real-time identification of critical health safety issues or severe negative reviews to alert managers instantly.

---

## ⚖️ License
Proprietary B2B Software. Developed by Sarap.ai team. All rights reserved.
