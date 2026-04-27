# OOTD - Weather Outfit Recommender

날씨/기온 + 설문 + 옷장 + OOTD 평가를 기반으로 옷차림을 추천하는 서비스입니다.

## 1) 프로젝트 구조

- `backend/`: Spring Boot + JWT + MariaDB + OpenWeather + Gemini
- `frontend/`: Next.js(App Router) + TypeScript
- `docker-compose.yml`: 로컬 컨테이너 통합 실행

## 2) 환경변수 정리

### Backend (`backend/.env.example`)

필수/권장 키:

- `DB_URL`
- `DB_USERNAME`
- `DB_PASSWORD`
- `JWT_SECRET`
- `JWT_ACCESS_TOKEN_EXPIRATION_MS`
- `CORS_ALLOWED_ORIGINS`
- `WEATHER_PROVIDER`
- `WEATHER_CACHE_REFRESH_MINUTES`
- `OPENWEATHER_API_KEY`
- `GEMINI_ENABLED`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`
- `GEMINI_BASE_URL`
- `OOTD_IMAGE_LOCAL_DIR`
- `OOTD_IMAGE_URL_PREFIX`
- `CLOSET_IMAGE_LOCAL_DIR`
- `CLOSET_IMAGE_URL_PREFIX`

문서 호환용(선택):

- `FILE_UPLOAD_DIR` (권장: `uploads`)
- `FILE_PUBLIC_BASE_URL` (권장: `http://localhost:8080/uploads`)

> 주의: 실제 API Key/비밀값은 커밋하지 마세요.

### Frontend (`frontend/.env.example`)

- `NEXT_PUBLIC_API_BASE_URL`

## 3) 운영/개발 환경 분리 기준

- 공통 기본값: `backend/src/main/resources/application.yml`
- 개발 프로필: `application-dev.yml`
- 운영 프로필: `application-prod.yml`
- 실행 시 `SPRING_PROFILES_ACTIVE=dev` 또는 `prod`로 분리

권장 정책:

- `dev`: 로컬 DB/로컬 origin 허용
- `prod`: 실제 도메인 origin만 허용, 비밀값은 환경변수/시크릿 매니저 주입

## 4) CORS 설정

- 현재 CORS는 `CORS_ALLOWED_ORIGINS`(콤마 구분) 환경변수 기반
- 예: `CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend-domain.com`

## 5) 로컬 실행 방법

### Backend

```bash
cd backend
# 예: PowerShell에서 환경변수 설정 후 실행
./gradlew bootRun
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

브라우저:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:8080`

## 6) Docker 실행 방법

1. 루트에서 환경변수 파일 준비

```bash
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env
```

2. `.env` 값 수정 (DB 비밀번호/JWT/Gemini/OpenWeather 키)

3. 컨테이너 실행

```bash
docker compose up -d --build
```

4. 상태 확인

```bash
docker compose ps
```

5. 종료

```bash
docker compose down
```

데이터 유지:

- MariaDB: `mariadb_data` 볼륨
- 업로드 파일: `backend_uploads` 볼륨

## 7) 배포 준비 파일

- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`
- `backend/.env.example`
- `frontend/.env.example`
- `.env.example` (compose용)

