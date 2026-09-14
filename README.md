# Research Paper Finder

A full-stack app: enter a research topic/prompt, choose how many papers you
want, and get back a **priority-ranked list of research papers** (title,
authors, year, abstract, link) pulled from multiple research databases.

- **Frontend:** React (Vite) + Tailwind CSS — white theme, blue accents
- **Backend:** Laravel API
- **Sources searched:**
  - ✅ Semantic Scholar — free, no key needed
  - ✅ CrossRef — free, no key needed
  - ✅ arXiv — free, no key needed
  - 🔑 IEEE Xplore — needs a free key from https://developer.ieee.org/
  - 🔑 Google Scholar — Google has no official public API, so this uses
    [SerpApi](https://serpapi.com/) as a proxy (needs a key, has a free tier)

The app works out of the box with the three free sources. Add the two
optional API keys any time to include IEEE and Google Scholar results too.

---

## 1. Backend (Laravel) setup

This zip contains the **custom application code only** (Controller,
Services, routes, config) — not a full framework install, since that's
thousands of generated files. Drop it into a fresh Laravel project:

```bash
# 1. Create a fresh Laravel project
composer create-project laravel/laravel backend-app
cd backend-app

# 2. Copy the custom files from this zip's /backend folder into it,
#    overwriting where prompted:
#    - app/Http/Controllers/PaperSearchController.php
#    - app/Services/*.php
#    - routes/api.php
#    - config/cors.php
#    - merge config/services_additions.php content into config/services.php

# 3. Copy env values
cp .env.example .env   # then fill in IEEE_API_KEY / SERPAPI_KEY if you have them
php artisan key:generate

# 4. Run the server
php artisan serve
# API now runs at http://localhost:8000/api
```

Test it:
```bash
curl -X POST http://localhost:8000/api/search \
  -H "Content-Type: application/json" \
  -d '{"prompt": "machine learning for fraud detection", "limit": 10}'
```

## 2. Frontend (React) setup

```bash
cd frontend
npm install
cp .env.example .env   # points to http://localhost:8000/api by default
npm run dev
# App runs at http://localhost:5173
```

## 3. How ranking works

Each paper gets a **priority score** = citation-count weight + source
reliability weight + recency weight, then results from all sources are
de-duplicated (by title) and sorted highest score first. Only the top N
(the number you chose) are returned.

## 4. Project structure

```
research-paper-finder/
├── backend/
│   ├── app/Http/Controllers/PaperSearchController.php
│   ├── app/Services/
│   │   ├── SemanticScholarService.php
│   │   ├── CrossRefService.php
│   │   ├── ArxivService.php
│   │   ├── IeeeService.php
│   │   └── GoogleScholarService.php
│   ├── routes/api.php
│   ├── config/cors.php
│   ├── config/services_additions.php
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── index.css
│   │   └── components/
│   │       ├── SearchForm.jsx
│   │       ├── ResultsList.jsx
│   │       └── PaperCard.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── .env.example
└── README.md
```

## 5. Notes

- IEEE Xplore and Google Scholar sources are automatically skipped (no
  errors shown) if you don't add their API keys — the app still works
  fine with just the three free sources.
- Google has no official Scholar API; scraping it directly violates their
  Terms of Service, which is why SerpApi (a paid/limited-free proxy) is
  used instead — this is the standard approach used by most apps that
  need Scholar data.
