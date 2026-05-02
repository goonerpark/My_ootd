# my_ootd

Weather-aware AI outfit recommendation service built with Next.js, Spring Boot, MariaDB, OpenWeather, and Gemini.

my_ootd recommends what to wear today by combining live weather, user profile data, daily survey answers, closet items, and OOTD review feedback. The project is designed as a portfolio-grade full-stack service, not just a static UI demo.

---

## Portfolio Highlights

### 1. Cost-aware Gemini recommendation cache

Problem: Calling Gemini every time a user logs in or changes pages wastes tokens and can produce inconsistent results during the same day.

Solution:
- User recommendations are cached in `recommendation_ai_cache` by `cacheDate + userId + gender`.
- The first recommendation of the day is reused for the same user until the date changes.
- Guest recommendations are cached separately.
- Gemini failures fall back to rule-based recommendations so the API does not fail.

### 2. Weather-based recommendation pipeline

Problem: Outfit suggestions need to reflect temperature, rain probability, humidity, and daily temperature range.

Solution:
- Weather data is cached through `WeatherQueryService`.
- Today and weekly recommendation APIs use weather snapshots.
- Gemini prompts include weather, gender, profile, and survey context.

### 3. Profile-based personalization

Problem: Generic weather recommendations are not enough for a styling service.

Solution:
- Users can manage gender, personal color, body type, height, weight, and preferred style.
- Profile data is included in Gemini prompts for member recommendations.

### 4. Closet-aware recommendations

Problem: A recommendation is more useful when it can use clothes the user already owns.

Solution:
- Users can register closet items by category, color, season, thickness, fit, brand, and memo.
- The closet recommendation section maps weather conditions to actual closet items.
- If recommendations cannot be generated, the UI shows a polished empty state instead of a raw server error.

### 5. Recommendation history

Problem: A fashion recommendation service feels incomplete if past recommendations disappear.

Solution:
- Member daily AI recommendations are saved into `daily_recommendations`.
- `/api/recommendations/history` returns recent recommendation history.
- My Page displays recent AI outfit history as portfolio-friendly activity data.

### 6. Demo-ready seed data

For local portfolio review, a demo account is automatically prepared outside production profile.

```text
Email: demo@myootd.com
Password: Demo1234!
```

The demo account includes profile metadata and closet items so reviewers can test the core flow quickly.

---

## Tech Stack

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- Responsive AppShell with desktop sidebar and mobile bottom navigation

### Backend
- Spring Boot 3.3
- Spring Security + JWT
- Spring Data JPA
- MariaDB
- Gemini 2.5 Flash
- OpenWeather One Call API

### Storage
- Local image storage for closet and OOTD uploads
- Designed to be extendable to S3

---

## Main Features

- Auth: signup, login, JWT authentication
- Dashboard: today weather, today AI outfit, closet recommendation, weekly navigation
- Survey: daily outing purpose and notes for personalized recommendation
- AI recommendation: Gemini-based outfit generation with rule-based fallback
- AI caching: daily user cache and guest cache to reduce cost and stabilize output
- Closet: CRUD for clothes and weather-based closet recommendation
- OOTD Review: image upload, Gemini/placeholder evaluation, closet alternatives
- My Page: profile editing, recent OOTD, recent closet items, recommendation history

---

## API Summary

### Auth
- `POST /api/auth/signup`
- `POST /api/auth/login`

### Weather
- `GET /api/weather/today`

### Recommendation
- `GET /api/recommendations/today?gender=MALE`
- `GET /api/recommendations/member/today?gender=MALE`
- `GET /api/recommendations/weekly`
- `GET /api/recommendations/today/closet`
- `GET /api/recommendations/history`

### Survey
- `POST /api/surveys`
- `GET /api/surveys/today`

### Closet
- `POST /api/closet-items`
- `GET /api/closet-items`
- `PUT /api/closet-items/{id}`
- `DELETE /api/closet-items/{id}`

### OOTD
- `POST /api/ootd-reviews`
- `GET /api/ootd-reviews`
- `GET /api/ootd-reviews/{id}`
- `GET /api/ootd-reviews/{id}/closet-suggestions`

---

## Local Setup

### Backend

```bash
cd backend
./gradlew bootRun
```

The backend runs on:

```text
http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on:

```text
http://localhost:3000
```

---

## Environment Variables

### Backend

See `backend/.env.example`.

Required for live AI/weather behavior:

```text
DB_URL
DB_USERNAME
DB_PASSWORD
JWT_SECRET
OPENWEATHER_API_KEY
GEMINI_API_KEY
GEMINI_ENABLED
```

### Frontend

See `frontend/.env.example`.

```text
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
```

---

## Docker

```bash
cp .env.example .env
docker compose up -d --build
```

Stop containers:

```bash
docker compose down
```

---

## Verification Checklist

Recommended checks before a portfolio demo:

```bash
cd backend
./gradlew assemble
```

```bash
cd frontend
npm run build
```

Manual demo flow:

1. Login with `demo@myootd.com / Demo1234!`.
2. Check today's weather and AI recommendation on the dashboard.
3. Logout and login again to confirm the same daily recommendation is reused.
4. Open Closet and verify seeded closet items.
5. Open My Page and confirm profile data and recommendation history.
6. Upload an OOTD image and check evaluation/closet suggestions.

---

## db update ing....
## Notes

- `.env` files and real API keys must not be committed.
- Demo data initializer is disabled in `prod` profile through `@Profile("!prod")`.
- Gemini fallback ensures recommendation APIs remain stable even if external AI calls fail.
