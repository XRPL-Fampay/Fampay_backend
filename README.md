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
- `POST /api/groups/:id/wallet/bootstrap` - 그룹 지갑 XRPL 부트스트랩 (데모)

`POST /api/groups` 호출 시 `wallet` 필드를 생략하면 서버가 자동으로 새로운 XRPL 그룹 지갑을 생성하고, 응답에 `groupWalletProvisioning.mnemonic`/`seed` 정보를 포함합니다. 24개 단어 니모닉과 시드는 반드시 사용자 측에서 안전하게 보관해야 하며, 직접 준비한 지갑을 쓰고 싶다면 기존처럼 `wallet` 객체를 전달하면 됩니다.

#### 그룹 지갑 XRPL 부트스트랩 (데모)

공유 지갑 생성 버튼을 눌렀을 때 프론트에서 입력한 XRPL 지갑 정보를 활용해 아래 시나리오를 한 번에 실행합니다. 구현 시 [reference/XRPL](../../reference/XRPL) 폴더의 샘플 스크립트를 참고했습니다.

1. **Credential 발급** – 그룹 인원 관리에 등록된 각 멤버의 기본 지갑 주소로 `CredentialCreate` 트랜잭션을 전송합니다. (참고: `xrpl/Credential/createCredential.ts`)
2. **PermissionedDomain 생성** – 위에서 발급된 Credential이 승인되었다고 가정하고 `AcceptedCredentials` 목록을 넣어 `PermissionedDomainSet` 트랜잭션을 수행합니다. (참고: `xrpl/PermissionedDomains/createDomain.ts`)
3. **RLUSD Trustline 설정** – 새 그룹 지갑 계정에 RLUSD 신뢰선을 한도 1,000,000으로 설정합니다. (참고: `xrpl/TrustSet/TrustSet.ts`)

요청 예시:

```bash
curl -X POST http://localhost:3001/api/groups/<GROUP_ID>/wallet/bootstrap \
  -H "Content-Type: application/json" \
  -d '{
        "credentialType": "KYC",
        "credentialTtlSeconds": 86400,
        "trustlineCurrency": "RLUSD",
        "trustlineLimit": "1000000",
        "trustlineIssuer": "r........"  # 생략 시 그룹 호스트 주소 사용
      }'
```

응답에는 각 단계별 XRPL 트랜잭션 해시 및 실패 내역이 포함됩니다. 데모용으로 구현되어 있어 멤버 지갑 누락, XRPL 노드 오류 등 일부 예외 상황은 단순 메시지로만 반환됩니다.


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
XRPL_ENDPOINT=wss://s.altnet.rippletest.net:51233
XRPL_RLUSD_ISSUER= # RLUSD 신뢰선을 열 발행자 주소 (미설정 시 그룹 호스트 주소 사용)
XRPL_RLUSD_CURRENCY=RLUSD
```

## 📞 지원

- **API 문서**: `http://localhost:3001/docs`
- **Health Check**: `http://localhost:3001/api/health`
