# MYOOTD 👕
날씨 + 사용자 취향 + 개인 옷장을 기반으로  
오늘/주간 OOTD를 추천하는 개인화 패션 추천 서비스입니다.

---

## 📌 Overview
MYOOTD는 날씨, 설문, 사용자 옷장 데이터를 기반으로  
개인에게 최적화된 옷차림을 추천하는 웹 서비스입니다.

현재 MVP 단계로, 핵심 기능 검증 및 구조 설계가 완료된 상태입니다.

---

## 🏗️ Architecture
- Frontend (Next.js)와 Backend (Spring Boot)를 분리한 구조
- REST API 기반 통신
- JWT 기반 Stateless 인증 처리
- Docker Compose를 통한 통합 실행 환경 구성

---

## 🛠️ Tech Stack

### Frontend
- Next.js (App Router)
- TypeScript
- CSS (공통 UI 컴포넌트 기반)

### Backend
- Spring Boot 3.x
- Spring Security + JWT
- Spring Data JPA
- MariaDB
- OpenWeather API
- Gemini API

### Infra / Deploy
- Docker
- Docker Compose

---

## ✨ Features

### 🔐 인증
- 회원가입 / 로그인 (JWT 기반 인증)

### 🌤️ 날씨 기반 추천
- 오늘 날씨 조회
- 오늘 추천 / 주간 추천

### 🧠 개인화 추천
- 설문 기반 스타일 분석
- Gemini API 기반 추천 생성

### 👕 옷장 관리
- 옷장 CRUD
- OOTD 평가 기반 대체 추천

### 📷 OOTD
- 이미지 업로드
- 사용자 평가 시스템

### 👤 마이페이지
- 활동 요약 UI 제공

---

## 📂 Project Structure
```
ootd/
├─ backend/ # Spring Boot
│ ├─ src/main/java/...
│ ├─ src/main/resources/
│ │ ├─ application.yml
│ │ ├─ application-dev.yml
│ │ └─ application-prod.yml
│ ├─ Dockerfile
│ └─ .env.example
├─ frontend/ # Next.js
│ ├─ app/
│ ├─ components/
│ ├─ lib/
│ ├─ Dockerfile
│ └─ .env.example
├─ docker-compose.yml
├─ .env.example # docker-compose용
└─ README.md
```


---

## ⚙️ Environment Variables

### Backend (backend/.env.example)

| 변수명 | 설명 |
|--------|------|
| SPRING_PROFILES_ACTIVE | 실행 프로필(dev/prod) |
| SERVER_PORT | 백엔드 포트 |
| DB_URL | MariaDB JDBC URL |
| DB_USERNAME | DB 계정 |
| DB_PASSWORD | DB 비밀번호 |
| JWT_SECRET | JWT 서명 키 |
| JWT_ACCESS_TOKEN_EXPIRATION_MS | 토큰 만료 시간 |
| CORS_ALLOWED_ORIGINS | 허용 Origin |
| WEATHER_PROVIDER | 날씨 provider |
| OPENWEATHER_API_KEY | OpenWeather API 키 |
| GEMINI_API_KEY | Gemini API 키 |

---

### Frontend (frontend/.env.example)

| 변수명 | 설명 |
|--------|------|
| NEXT_PUBLIC_API_BASE_URL | 백엔드 API 주소 |

---

## 🚀 Getting Started

### Local 실행

#### Backend
```bash
cd backend
./gradlew bootRun
```
#### Frontend
```
cd frontend
npm install
npm run dev
```
접속:
```
Frontend: http://localhost:3000
Backend: http://localhost:8080
```

🐳 Docker 실행
# 환경변수 복사
```
cp .env.example .env
```
# 실행
```
docker compose up -d --build
```
# 상태 확인
```
docker compose ps
```
# 종료
```
docker compose down
```

🌐 CORS 설정
```
CORS_ALLOWED_ORIGINS=http://localhost:3000
```

복수:
```
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-domain.com
```
⚠️ Security
.env, API Key, DB 비밀번호는 절대 커밋 금지
운영 환경에서는:
강력한 JWT_SECRET 사용
도메인 기반 CORS 제한
외부 환경변수 주입 필수
🚧 Project Status

현재 MVP 단계이며 핵심 기능 검증 완료 상태입니다.

향후 개선 예정
추천 알고리즘 고도화
이미지 저장소 (S3) 이전
UI/UX 개선
성능 최적화 및 캐싱 전략 강화

📌 Notes
이미지 저장은 현재 로컬 기반
향후 클라우드 스토리지로 확장 예정
