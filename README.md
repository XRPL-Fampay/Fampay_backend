# 🚀 XRPL Grouppay Backend

XRPL 기반 그룹 지갑 서비스를 위한 백엔드 API입니다.

## 🚀 빠른 시작

### 1. 설치 및 실행

```bash
# 의존성 설치
npm install

# 데이터베이스 설정
npm run prisma:generate
npm run prisma:migrate

# 서버 실행
npm start
```

### 2. API 테스트

```bash
# Health Check
curl http://localhost:3001/api/health

# 회원가입
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","fullName":"Test User"}'

# 로그인
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## 📡 주요 API

### 인증 (`/api/auth/*`)

- `POST /api/auth/register` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/refresh` - 토큰 갱신
- `POST /api/auth/logout` - 로그아웃

### 키 관리 (`/api/keys/*`)

- `POST /api/keys/generate-mnemonic` - 니모닉 생성
- `POST /api/keys/import-wallet` - 지갑 가져오기
- `GET /api/keys/wallets` - 지갑 목록

### 그룹 관리 (`/api/groups/*`)

- `POST /api/groups` - 그룹 생성
- `GET /api/groups` - 그룹 목록
- `POST /api/groups/:id/members` - 멤버 추가

### 트랜잭션 (`/api/transactions/*`)

- `POST /api/transactions/send` - 송금
- `GET /api/transactions` - 트랜잭션 목록

### 현금화 (`/api/cashout/*`)

- `POST /api/cashout/request` - 현금화 요청
- `GET /api/cashout/requests` - 현금화 요청 목록

## 🛠 기술 스택

- **Node.js** + **Express.js**
- **Prisma** + **SQLite**
- **JWT** 인증
- **XRPL** 연동

## 📁 프로젝트 구조

```
src/
├── app.js                 # Express 앱 설정
├── controllers/           # API 컨트롤러
├── services/             # 비즈니스 로직
├── routes/               # 라우터
├── middleware/           # 미들웨어
└── db/                   # 데이터베이스 설정
```

## 🔧 환경 변수

```env
PORT=3001
DATABASE_URL="file:./dev.db"
ACCESS_TOKEN_SECRET=your-secret
REFRESH_TOKEN_SECRET=your-secret
XRPL_NETWORK=testnet
```

## 📞 지원

- **API 문서**: `http://localhost:3001/docs`
- **Health Check**: `http://localhost:3001/api/health`
