# XRPL Grouppay Backend API 문서

## 📋 목차

- [개요](#개요)
- [인증](#인증)
- [API 엔드포인트](#api-엔드포인트)
- [에러 처리](#에러-처리)
- [Rate Limiting](#rate-limiting)
- [테스트 방법](#테스트-방법)

## 개요

XRPL Grouppay Backend API는 XRPL 기반 그룹 지갑 서비스를 위한 RESTful API입니다.

**Base URL**: `http://localhost:3001/api`

**API 버전**: v1.0.0

## 인증

### JWT 토큰 기반 인증

대부분의 API는 Bearer Token 인증이 필요합니다.

```http
Authorization: Bearer <your-jwt-token>
```

### 토큰 발급 과정

1. **회원가입** → 사용자 생성
2. **로그인** → Access Token & Refresh Token 발급
3. **토큰 갱신** → Access Token 만료 시 Refresh Token으로 갱신

## API 엔드포인트

### 🔐 인증 (Authentication)

| 메서드 | 엔드포인트              | 설명          | 인증 필요 |
| ------ | ----------------------- | ------------- | --------- |
| POST   | `/auth/register`        | 회원가입      | ❌        |
| POST   | `/auth/login`           | 로그인        | ❌        |
| POST   | `/auth/refresh`         | 토큰 갱신     | ❌        |
| POST   | `/auth/logout`          | 로그아웃      | ❌        |
| GET    | `/auth/profile`         | 프로필 조회   | ✅        |
| POST   | `/auth/connect-wallet`  | 지갑 연결     | ✅        |
| POST   | `/auth/setup-2fa`       | 2FA 설정      | ✅        |
| PUT    | `/auth/change-password` | 비밀번호 변경 | ✅        |

### 🔑 키 관리 (Key Management)

| 메서드 | 엔드포인트                      | 설명                     | 인증 필요 |
| ------ | ------------------------------- | ------------------------ | --------- |
| POST   | `/keys/create-wallet`           | 지갑 생성                | ✅        |
| POST   | `/keys/recover-wallet`          | 지갑 복구                | ✅        |
| POST   | `/keys/setup-multisig`          | 멀티시그 설정            | ✅        |
| POST   | `/keys/setup-social-recovery`   | 소셜 리커버리 설정       | ✅        |
| POST   | `/keys/execute-social-recovery` | 소셜 리커버리 실행       | ✅        |
| POST   | `/keys/setup-hybrid-custody`    | 하이브리드 커스터디 설정 | ✅        |
| POST   | `/keys/create-backup`           | 백업 생성                | ✅        |
| GET    | `/keys/backups`                 | 백업 목록                | ✅        |
| POST   | `/keys/restore-from-backup`     | 백업 복원                | ✅        |

### 👥 그룹 관리 (Groups)

| 메서드 | 엔드포인트            | 설명      | 인증 필요 |
| ------ | --------------------- | --------- | --------- |
| GET    | `/groups`             | 그룹 목록 | ✅        |
| POST   | `/groups`             | 그룹 생성 | ✅        |
| GET    | `/groups/:id`         | 그룹 상세 | ✅        |
| POST   | `/groups/:id/members` | 멤버 추가 | ✅        |

### 💰 현금화 (Cashout)

| 메서드 | 엔드포인트                  | 설명            | 인증 필요 |
| ------ | --------------------------- | --------------- | --------- |
| POST   | `/cashout/setup-domain`     | 도메인 설정     | ✅        |
| GET    | `/cashout/domains`          | 도메인 목록     | ✅        |
| POST   | `/cashout/verify-domain`    | 도메인 검증     | ✅        |
| DELETE | `/cashout/domains/:id`      | 도메인 삭제     | ✅        |
| POST   | `/cashout/register-gateway` | 게이트웨이 등록 | ✅        |
| GET    | `/cashout/gateways`         | 게이트웨이 목록 | ✅        |
| POST   | `/cashout/request`          | 현금화 요청     | ✅        |
| POST   | `/cashout/process/:id`      | 요청 처리       | ✅        |
| GET    | `/cashout/status/:id`       | 요청 상태       | ✅        |

### 🔄 트랜잭션 (Transactions)

| 메서드 | 엔드포인트                 | 설명          | 인증 필요 |
| ------ | -------------------------- | ------------- | --------- |
| GET    | `/transactions`            | 트랜잭션 목록 | ✅        |
| POST   | `/transactions`            | 트랜잭션 생성 | ✅        |
| PUT    | `/transactions/:id/status` | 상태 업데이트 | ✅        |

### 💳 지갑 (Wallets)

| 메서드 | 엔드포인트                   | 설명          | 인증 필요 |
| ------ | ---------------------------- | ------------- | --------- |
| POST   | `/wallets/generate`          | 지갑 생성     | ✅        |
| POST   | `/wallets/faucet`            | 테스트넷 펀딩 | ✅        |
| GET    | `/wallets/:address/info`     | 지갑 정보     | ✅        |
| GET    | `/wallets/validate/:address` | 주소 검증     | ✅        |

### 🏥 헬스체크 (Health)

| 메서드 | 엔드포인트 | 설명      | 인증 필요 |
| ------ | ---------- | --------- | --------- |
| GET    | `/health`  | 서버 상태 | ❌        |

## 요청/응답 예시

### 회원가입

**요청:**

```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "fullName": "John Doe"
}
```

**응답:**

```json
{
  "id": "uuid-here",
  "email": "user@example.com",
  "fullName": "John Doe"
}
```

### 로그인

**요청:**

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답:**

```json
{
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "USER"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshTokenExpiresAt": "2025-09-27T20:42:57.000Z"
}
```

## 에러 처리

### 에러 응답 형식

```json
{
  "error": {
    "message": "에러 메시지",
    "details": "상세 정보 (선택사항)"
  }
}
```

### HTTP 상태 코드

| 코드 | 설명           |
| ---- | -------------- |
| 200  | 성공           |
| 201  | 생성 성공      |
| 400  | 잘못된 요청    |
| 401  | 인증 필요      |
| 403  | 권한 없음      |
| 404  | 리소스 없음    |
| 429  | 요청 한도 초과 |
| 500  | 서버 에러      |

## Rate Limiting

API는 Rate Limiting을 적용하여 서비스 보호를 제공합니다.

- **일반 API**: 분당 100회 요청
- **로그인 API**: 분당 5회 요청
- **인증 필요 API**: 분당 200회 요청

### Rate Limit 헤더

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 테스트 방법

### 1. Swagger UI 사용

서버 실행 후 다음 URL에서 API 문서를 확인할 수 있습니다:

- http://localhost:3001/docs

### 2. Postman 사용

`docs/postman-collection.json` 파일을 Postman에 import하여 사용할 수 있습니다.

### 3. cURL 예시

```bash
# 회원가입
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# 로그인
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# 프로필 조회 (토큰 필요)
curl -X GET http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 개발자 가이드

### 환경 설정

1. `.env` 파일 설정
2. 데이터베이스 연결 (PostgreSQL)
3. XRPL 테스트넷 연결

### 로컬 개발

```bash
# 의존성 설치
npm install

# 서버 실행
npm start

# 테스트 실행
npm test
```

### 배포

```bash
# 프로덕션 빌드
npm run build

# 프로덕션 실행
NODE_ENV=production npm start
```

---

**문의사항이 있으시면 개발팀에 연락해주세요.**

- 이메일: dev@grouppay.com
- GitHub: https://github.com/grouppay/backend
