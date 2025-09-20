# Fampay Backend - Group Wallet on XRPL

> 가족을 위한 소셜 페이먼트 월렛 – 송금은 빠르게, 현금화는 안전하게, 키 관리는 쉽게.

## 🚀 프로젝트 개요

**Fampay**는 XRPL(XRP Ledger) 기반의 가족 그룹 지갑 시스템입니다. 가족 구성원들이 안전하고 편리하게 자금을 관리하고 송금할 수 있는 소셜 페이먼트 플랫폼을 제공합니다.

### 핵심 기능

- 🔐 **보안 키 관리**: 니모닉, 멀티시그, 소셜 리커버리
- 🔑 **JWT 인증 시스템**: 생체인증, 2FA, 세션 관리
- 💰 **현금화 게이트웨이**: PermissionedDomains 기반 안전 출금
- 🏦 **은행/모바일머니 연동**: 글로벌 결제 지원

---

## 📋 **개발자 2 완료 업무 (인수인계)**

### ✅ **구현 완료된 시스템**

#### **1. 키 관리 시스템** (`src/services/keyManagementService.js`)

- **니모닉 생성/관리**: 12/24단어 BIP39 니모닉, AES 암호화/복호화
- **멀티시그 지갑**: 2/3 승인 체계, XRPL SignerListSet 활용
- **소셜 리커버리**: 가디언 기반 지갑 복구 메커니즘
- **하이브리드 커스터디**: Self/Shared/Full 커스터디 옵션
- **지갑 백업/복원**: 암호화된 백업 시스템

#### **2. JWT 인증 시스템** (`src/services/authService.js`)

- **JWT 토큰 관리**: Access/Refresh 토큰, 자동 갱신
- **비밀번호 보안**: bcrypt 해싱 (12 rounds)
- **생체인증 준비**: 지문/얼굴/음성 인증 메타데이터
- **2FA 지원**: TOTP 기반 이중 인증
- **XRPL 지갑 서명 검증**: 블록체인 기반 인증

#### **3. 보안 미들웨어** (`src/middleware/authMiddleware.js`)

- **인증/인가**: JWT 토큰 검증, 역할 기반 접근 제어
- **Rate Limiting**: API 호출 횟수 제한 (로그인, 일반 API)
- **보안 헤더**: Helmet 기반 CSP, HSTS 설정
- **CORS 관리**: 허용된 도메인만 접근 가능
- **요청 로깅**: 민감한 엔드포인트 접근 추적

#### **4. 현금화 게이트웨이** (`src/services/cashoutGatewayService.js`)

- **PermissionedDomains**: XRPL DIDSet을 활용한 도메인 관리
- **게이트웨이 관리**: Binance, Wise, M-Pesa 등 다중 제공업체
- **현금화 영수증**: SHA256 해시 기반 검증 시스템
- **은행 API 연동**: SWIFT/IBAN 지원
- **모바일머니 연동**: M-Pesa, MTN, Airtel 지원

### 🔗 **API 엔드포인트 (26개)**

#### **인증 API** (`/api/auth/*`)

- `POST /register` - 사용자 회원가입
- `POST /login` - 로그인
- `POST /refresh` - 토큰 갱신
- `POST /logout` - 로그아웃
- `POST /connect-wallet` - 지갑 연결
- `POST /setup-2fa` - 2FA 설정
- `POST /setup-biometric` - 생체인증 설정
- `GET /profile` - 프로필 조회
- `PUT /change-password` - 비밀번호 변경

#### **키 관리 API** (`/api/keys/*`)

- `POST /create-wallet` - 새 지갑 생성
- `POST /recover-wallet` - 니모닉 복구
- `POST /setup-multisig` - 멀티시그 설정
- `POST /setup-social-recovery` - 소셜 리커버리 설정
- `POST /execute-social-recovery` - 소셜 리커버리 실행
- `POST /setup-hybrid-custody` - 하이브리드 커스터디
- `POST /create-backup` - 백업 생성
- `POST /restore-from-backup` - 백업 복원
- `GET /backups` - 백업 목록

#### **현금화 API** (`/api/cashout/*`)

- `POST /setup-domains` - PermissionedDomains 설정
- `POST /register-gateway` - 게이트웨이 등록
- `GET /gateways` - 게이트웨이 목록
- `POST /request` - 현금화 요청
- `POST /process/:requestId` - 요청 처리
- `GET /status/:requestId` - 상태 조회
- `POST /receipt/:requestId` - 영수증 생성
- `GET /receipt/:receiptId` - 영수증 조회
- `POST /bank-transfer` - 은행 이체
- `POST /mobile-money` - 모바일머니 이체

---

## ⚠️ **개발자 1 인수인계 사항**

### 🗄️ **DB 연결 필요**

현재 **메모리 기반 임시 저장소**(`Map()`)를 사용 중입니다. 실제 운영을 위해 데이터베이스 연결이 필요합니다.

#### **필요한 테이블**

```sql
-- 사용자 관리
users, sessions

-- 키 관리
wallet_backups, social_recovery_configs, multisig_configs

-- 현금화
approved_gateways, cashout_requests, cashout_receipts
```

#### **DB 연결 대상 파일들**

- `src/controllers/authController.js` - 사용자/세션 관리
- `src/controllers/keyController.js` - 백업/복구 설정
- `src/controllers/cashoutController.js` - 게이트웨이/요청 관리

### 🔄 **XRPL 시스템 통합**

개발자 1의 XRPL 결제 시스템이 `dev1-xrpl-legacy/` 폴더에 보관되어 있습니다.

#### **복원 필요한 파일들**

```
dev1-xrpl-legacy/
├── xrplBatchService.js      # 배치 결제
├── xrplPaymentService.js    # 결제 처리
├── xrplTrustSetService.js   # 신뢰 관계
├── trustSetController.js    # API 컨트롤러
├── trustSetRoutes.js        # API 라우팅
└── test-*.js               # 테스트 파일
```

#### **통합 작업**

1. 위 파일들을 원래 위치로 복원
2. `app.js`에서 라우트 주석 해제
3. 개발자 2의 인증 시스템과 연동
4. 통합 테스트 실행

### 📋 **협업 우선순위**

#### **Phase 1: DB 연결** (개발자 1)

1. MongoDB 또는 PostgreSQL 선택
2. 스키마 설계 및 모델 생성
3. 컨트롤러의 `Map()` → DB 쿼리 교체

#### **Phase 2: XRPL 통합** (개발자 1)

1. `dev1-xrpl-legacy/` 파일들 복원
2. Payment/Batch/TrustSet 시스템 DB 연결
3. 인증 시스템과 연동

#### **Phase 3: 테스트 & 배포** (공통)

1. Jest/Mocha 테스트 프레임워크
2. Docker 컨테이너화
3. CI/CD 파이프라인

---

## 🛠️ **기술 스택**

### **Backend**

- **Framework**: Express.js
- **Database**: MongoDB/PostgreSQL (선택 필요)
- **Authentication**: JWT + bcrypt
- **Blockchain**: XRPL (xrpl.js)
- **Security**: Helmet, CORS, Rate Limiting

### **Dependencies**

```json
{
  "xrpl": "^4.4.1",
  "jsonwebtoken": "JWT 토큰 관리",
  "bcryptjs": "비밀번호 해싱",
  "bip39": "니모닉 생성",
  "crypto-js": "암호화",
  "helmet": "보안 헤더",
  "express-rate-limit": "Rate Limiting"
}
```

---

## 🧪 **테스트**

### **테스트 실행**

```bash
# 인증 & 키 관리 테스트
node test-auth-key-services.js

# 현금화 게이트웨이 테스트
node test-cashout-gateway.js

# 서버 실행
npm start
```

### **테스트 커버리지**

- ✅ JWT 인증 시스템 (토큰 생성/검증/갱신)
- ✅ 키 관리 시스템 (니모닉/멀티시그/소셜리커버리)
- ✅ 현금화 게이트웨이 (게이트웨이 등록/요청 처리/영수증)
- ✅ 보안 기능 (로깅/검증/세션 관리)

---

## 📁 **프로젝트 구조**

```
Fampay_backend/
├── 📁 src/                    # 소스 코드 디렉토리
│   ├── 📁 services/           # 🔧 비즈니스 로직 서비스
│   │   ├── authService.js         # JWT 인증, 2FA, 생체인증 서비스
│   │   ├── keyManagementService.js # 니모닉, 멀티시그, 소셜리커버리 서비스
│   │   ├── cashoutGatewayService.js # 현금화, 게이트웨이, 은행/모바일머니 서비스
│   │   ├── groupService.js        # 그룹 관리 서비스
│   │   ├── transactionService.js  # 트랜잭션 관리 서비스
│   │   └── xrpl/                  # XRPL 관련 서비스
│   │       ├── walletService.js       # XRPL 지갑 서비스
│   │       └── transactionExecutor.js # XRPL 트랜잭션 실행
│   │
│   ├── 📁 controllers/        # 🎮 API 컨트롤러
│   │   ├── authController.js      # 회원가입/로그인/프로필 API
│   │   ├── keyController.js       # 지갑생성/백업/복구 API
│   │   ├── cashoutController.js   # 현금화 요청/처리/영수증 API
│   │   ├── groupController.js     # 그룹 관리 API
│   │   ├── transactionController.js # 트랜잭션 관리 API
│   │   └── walletController.js    # 지갑 관리 API
│   │
│   ├── 📁 middleware/         # 🛡️ 미들웨어
│   │   ├── authMiddleware.js      # JWT검증, Rate Limiting, CORS
│   │   ├── errorHandler.js        # 에러 처리 미들웨어
│   │   ├── requestLogger.js       # 요청 로깅 미들웨어
│   │   └── notFound.js           # 404 처리 미들웨어
│   │
│   ├── 📁 routes/            # 🛣️ API 라우팅
│   │   ├── 📁 api/               # API 라우트
│   │   │   ├── auth.js               # /api/auth/* 라우트
│   │   │   ├── keys.js               # /api/keys/* 라우트
│   │   │   ├── cashout.js            # /api/cashout/* 라우트
│   │   │   ├── groups.js             # /api/groups/* 라우트
│   │   │   ├── transactions.js       # /api/transactions/* 라우트
│   │   │   ├── wallets.js            # /api/wallets/* 라우트
│   │   │   └── health.js             # /api/health 라우트
│   │   ├── docs.js               # Swagger 문서 라우트
│   │   ├── health.js             # 헬스체크 라우트
│   │   └── index.js              # 기본 라우트
│   │
│   ├── 📁 db/                # 🗄️ 데이터베이스
│   │   └── prisma.js             # Prisma 클라이언트
│   │
│   ├── 📁 config/            # ⚙️ 설정
│   │   └── index.js              # 환경 설정
│   │
│   └── app.js                # 🚀 Express 앱 메인 파일
│
├── 📁 prisma/                # 🗄️ 데이터베이스 스키마
│   ├── schema.prisma             # Prisma 스키마 정의
│   └── migrations/               # 데이터베이스 마이그레이션
│       ├── 000_init/
│       ├── 20250920101201_add_auth_cashout/
│       └── 20250920102334_add_permissioned_domain_timestamp/
│
├── 📁 docs/                  # 📚 문서
│   ├── API_DOCUMENTATION.md      # API 문서
│   └── postman-collection.json   # Postman 컬렉션
│
├── 📁 tests/                 # 🧪 테스트
│   ├── health.test.js            # 헬스체크 테스트
│   ├── permissionedDomains.test.js # 도메인 테스트
│   ├── transactions.test.js       # 트랜잭션 테스트
│   └── walletService.test.js      # 지갑 서비스 테스트
│
├── 📁 bin/                   # ⚙️ 실행 스크립트
│   └── www                       # 서버 시작 스크립트
│
├── 📄 package.json           # 📦 프로젝트 의존성 및 스크립트
├── 📄 package-lock.json      # 📦 의존성 버전 잠금
├── 📄 jest.config.js         # 🧪 Jest 테스트 설정
├── 📄 Dockerfile             # 🐳 Docker 이미지 설정
├── 📄 docker-compose.yml     # 🐳 Docker Compose 설정
└── 📄 README.md              # 📋 프로젝트 문서
```

### 🔍 **파일별 상세 설명**

#### **🔧 Services (비즈니스 로직) - 개발자 2 완성**

**`src/services/authService.js`** (488줄)

- **JWT 토큰 관리**: Access/Refresh 토큰 생성, 검증, 갱신
- **비밀번호 보안**: bcrypt 해싱 (12 rounds), 검증
- **사용자 관리**: 회원가입, 로그인, 프로필 관리
- **2FA 시스템**: TOTP 기반 이중 인증, 백업 코드 생성
- **생체인증**: 지문/얼굴/음성 인증 메타데이터 관리
- **XRPL 지갑 검증**: 지갑 서명 검증 기능
- **보안 로깅**: 로그인/로그아웃/보안 이벤트 추적

**`src/services/keyManagementService.js`** (364줄)

- **니모닉 관리**: BIP39 12/24단어 생성, AES 암호화/복호화
- **지갑 백업/복원**: 암호화된 백업 생성 및 복원
- **멀티시그 지갑**: 2/3 승인 체계, XRPL SignerListSet 활용
- **소셜 리커버리**: 가디언 기반 지갑 복구 시스템
- **하이브리드 커스터디**: Self/Shared/Full 커스터디 옵션
- **XRPL 연결**: devnet 테스트넷 연결 관리

**`src/services/cashoutGatewayService.js`** (590줄)

- **PermissionedDomains**: XRPL DIDSet 기반 도메인 관리
- **게이트웨이 관리**: Binance, Wise, M-Pesa 등 다중 제공업체
- **현금화 요청**: 요청 생성, 처리, 상태 추적
- **영수증 시스템**: SHA256 해시 기반 검증 영수증
- **은행 API**: SWIFT/IBAN 기반 은행 이체 시뮬레이션
- **모바일머니**: M-Pesa, MTN, Airtel 이체 시뮬레이션
- **XRPL 연결**: PermissionedDomains 트랜잭션 처리

#### **🎮 Controllers (API 컨트롤러) - 개발자 2 완성**

**`src/controllers/authController.js`** (597줄)

- **회원가입**: 이메일/비밀번호 검증, 사용자 생성
- **로그인/로그아웃**: JWT 토큰 발급, 세션 관리
- **토큰 갱신**: Refresh 토큰 기반 액세스 토큰 재발급
- **프로필 관리**: 사용자 정보 조회, 비밀번호 변경
- **지갑 연결**: XRPL 지갑 서명 검증 및 연결
- **2FA/생체인증**: 이중 인증 및 생체인증 설정
- **⚠️ DB 연결 필요**: 현재 `Map()` 사용, 실제 DB 연결 필요

**`src/controllers/keyController.js`** (600줄)

- **지갑 생성**: 새 지갑 및 니모닉 생성
- **지갑 복구**: 니모닉 기반 지갑 복원
- **멀티시그 설정**: 2/3 승인 멀티시그 지갑 구성
- **소셜 리커버리**: 가디언 설정 및 복구 실행
- **백업 관리**: 지갑 백업 생성, 복원, 목록 조회
- **하이브리드 커스터디**: 다양한 커스터디 옵션 설정
- **⚠️ DB 연결 필요**: 현재 `Map()` 사용, 실제 DB 연결 필요

**`src/controllers/cashoutController.js`** (423줄)

- **도메인 설정**: PermissionedDomains XRPL 트랜잭션
- **게이트웨이 등록**: 현금화 제공업체 등록 및 관리
- **현금화 요청**: 요청 생성, 처리, 상태 조회
- **영수증 관리**: 영수증 생성 및 조회
- **은행/모바일머니**: 실제 이체 처리 API
- **⚠️ DB 연결 필요**: 현재 `Map()` 사용, 실제 DB 연결 필요

#### **🛡️ Middleware (보안 미들웨어) - 개발자 2 완성**

**`src/middleware/authMiddleware.js`** (보안 중심)

- **JWT 인증**: Bearer 토큰 검증, 사용자 정보 추출
- **역할 기반 접근**: admin/owner/member 권한 체크
- **지갑 소유권 검증**: 요청 지갑과 사용자 지갑 매칭
- **Rate Limiting**: API 호출 횟수 제한 (일반/로그인 분리)
- **보안 헤더**: Helmet 기반 CSP, HSTS, XSS 방지
- **CORS 관리**: 허용된 도메인만 접근 허용
- **요청 로깅**: 모든 API 요청 및 민감한 엔드포인트 추적
- **에러 처리**: 보안 관련 에러 통합 처리

#### **🛣️ Routes (API 라우팅) - 개발자 2 완성**

**`src/routes/authRoutes.js`** (152줄) - `/api/auth/*`

```javascript
POST /register      # 회원가입 (Rate Limited)
POST /login         # 로그인 (Rate Limited)
POST /refresh       # 토큰 갱신
POST /logout        # 로그아웃 (인증 필요)
POST /connect-wallet # 지갑 연결 (인증 필요)
POST /setup-2fa     # 2FA 설정 (인증 필요)
POST /setup-biometric # 생체인증 설정 (인증 필요)
GET  /profile       # 프로필 조회 (인증 필요)
PUT  /change-password # 비밀번호 변경 (인증 필요, Rate Limited)
```

**`src/routes/keyRoutes.js`** (171줄) - `/api/keys/*`

```javascript
POST /create-wallet       # 지갑 생성 (인증 필요, Rate Limited)
POST /recover-wallet      # 지갑 복구 (인증 필요, Rate Limited)
POST /setup-multisig      # 멀티시그 설정 (Admin만, Rate Limited)
POST /setup-social-recovery # 소셜 리커버리 설정 (인증+지갑검증)
POST /execute-social-recovery # 소셜 리커버리 실행 (Public)
POST /setup-hybrid-custody # 하이브리드 커스터디 (인증 필요)
POST /create-backup       # 백업 생성 (인증 필요, Rate Limited)
POST /restore-from-backup # 백업 복원 (인증 필요, Rate Limited)
GET  /backups            # 백업 목록 (인증 필요)
```

**`src/routes/cashoutRoutes.js`** (190줄) - `/api/cashout/*`

```javascript
POST /setup-domains      # 도메인 설정 (Admin만, Rate Limited)
POST /register-gateway   # 게이트웨이 등록 (Admin만, Rate Limited)
GET  /gateways          # 게이트웨이 목록 (인증 필요)
POST /request           # 현금화 요청 (인증+지갑검증, Rate Limited)
POST /process/:requestId # 요청 처리 (Admin만, Rate Limited)
GET  /status/:requestId  # 상태 조회 (인증 필요)
POST /receipt/:requestId # 영수증 생성 (인증 필요, Rate Limited)
GET  /receipt/:receiptId # 영수증 조회 (인증 필요)
POST /bank-transfer     # 은행 이체 (인증 필요, Rate Limited)
POST /mobile-money      # 모바일머니 (인증 필요, Rate Limited)
```

#### **🔄 XRPL Legacy (개발자 1 작업) - 복원 대기**

**`dev1-xrpl-legacy/` 폴더 내용**

- **xrplBatchService.js**: XRPL 배치 결제 처리 서비스
- **xrplPaymentService.js**: XRPL 개별 결제 서비스
- **xrplTrustSetService.js**: XRPL 신뢰관계 설정 서비스
- **trustSetController.js**: TrustSet API 컨트롤러
- **trustSetRoutes.js**: `/api/trustset/*` 라우트
- **test-\*.js**: XRPL 기능 테스트 파일들

**복원 방법 (개발자 1 작업)**:

1. 파일들을 원래 위치로 이동
2. `app.js`에서 주석 처리된 라우트 활성화
3. DB 연결 및 개발자 2 인증 시스템과 통합

#### **🧪 테스트 파일들**

**`test-auth-key-services.js`** (270줄)

- 인증 서비스 테스트: JWT, 2FA, 생체인증
- 키 관리 서비스 테스트: 니모닉, 멀티시그, 소셜 리커버리
- XRPL 연결 테스트
- 보안 기능 테스트

**`test-cashout-gateway.js`** (270줄)

- 게이트웨이 등록 및 관리 테스트
- 현금화 요청 생성 및 처리 테스트
- 영수증 생성 및 조회 테스트
- 은행/모바일머니 이체 테스트

#### **📋 문서 파일들**

**`HANDOVER-TO-DEV1.md`** (356줄)

- 개발자 1 상세 인수인계 문서
- DB 스키마 설계 (SQL)
- 통합 작업 가이드
- 협업 우선순위

**`README-DEV2.md`** (180줄)

- 개발자 2 완료 업무 상세 문서
- API 엔드포인트 목록
- 기술 스택 및 구현 통계

---

## 🤝 **개발자 1과의 협업**

### 🚨 **즉시 필요한 작업**

#### **1. 데이터베이스 연결 (최우선)**

현재 모든 데이터가 메모리(`Map()`)에 저장되어 서버 재시작 시 손실됩니다.

**필요한 DB 테이블**:

```sql
-- 사용자 관리
users (user_id, email, password_hash, wallet_address, family_role, ...)
sessions (session_id, user_id, refresh_token, ip_address, ...)

-- 키 관리
wallet_backups (backup_id, user_id, encrypted_mnemonic, ...)
social_recovery_configs (recovery_id, user_address, guardians, ...)
multisig_configs (config_id, master_address, signers, ...)

-- 현금화
approved_gateways (gateway_id, name, domain, api_endpoint, ...)
cashout_requests (request_id, user_id, amount, currency, status, ...)
cashout_receipts (receipt_id, request_id, receipt_hash, ...)
```

**DB 연결 파일 수정 필요**:

- `src/controllers/authController.js` (라인 13-14)
- `src/controllers/keyController.js` (라인 13-14)
- `src/controllers/cashoutController.js` (서비스 내 Map 객체들)

#### **2. XRPL 결제 시스템 복원**

`dev1-xrpl-legacy/` 폴더의 파일들을 원래 위치로 복원하고 통합:

```bash
# 파일 복원
mv dev1-xrpl-legacy/xrpl*.js src/services/
mv dev1-xrpl-legacy/trustSetController.js src/controllers/
mv dev1-xrpl-legacy/trustSetRoutes.js src/routes/
mv dev1-xrpl-legacy/test-*.js ./

# app.js 수정 (라인 10, 39)
# 주석 해제: trustSetRouter 관련 코드
```

### 📋 **단계별 통합 가이드**

#### **Step 1: 환경 설정**

```bash
# 프로젝트 클론
git clone https://github.com/XRPL-Fampay/Fampay_backend.git
cd Fampay_backend
git checkout feature/developer2-backend

# 의존성 설치
npm install

# 환경 변수 설정
cp .env.example .env
# JWT_SECRET, DATABASE_URL 등 설정
```

#### **Step 2: 데이터베이스 설정**

```bash
# MongoDB 사용 시
npm install mongoose

# PostgreSQL 사용 시
npm install pg sequelize
```

#### **Step 3: 테스트 실행**

```bash
# 개발자 2 시스템 테스트
node test-auth-key-services.js
node test-cashout-gateway.js

# 서버 실행
npm start
```

### 🔗 **API 통합 포인트**

개발자 1의 XRPL 시스템과 개발자 2의 인증 시스템 연동:

```javascript
// XRPL 서비스에서 인증 확인 예시
const authMiddleware = require("../middleware/authMiddleware");

// 기존 XRPL 라우트에 인증 추가
router.post(
  "/create-trustline",
  authMiddleware.authenticateToken(), // 개발자 2 인증
  authMiddleware.verifyWalletOwnership(), // 지갑 소유권 검증
  trustSetController.createTrustLine // 개발자 1 XRPL 로직
);
```

### 📞 **협업 체크리스트**

#### **개발자 1 TODO**

- [ ] DB 선택 및 연결 설정
- [ ] 사용자/세션 모델 생성
- [ ] authController DB 연결
- [ ] keyController DB 연결
- [ ] cashoutController DB 연결
- [ ] XRPL 레거시 파일 복원
- [ ] 인증 시스템과 XRPL 시스템 통합
- [ ] 통합 테스트 실행

#### **공통 TODO**

- [ ] Jest/Mocha 테스트 프레임워크 설정
- [ ] Docker 컨테이너화
- [ ] GitHub Actions CI/CD
- [ ] API 문서화 (Swagger)
- [ ] 배포 환경 설정

### 📧 **문의사항**

상세한 인수인계 내용은 `HANDOVER-TO-DEV1.md` 파일을 참조하세요.

---

## 🚀 **빠른 시작 (개발자 1용)**

### **1. 프로젝트 설정**

```bash
git clone https://github.com/XRPL-Fampay/Fampay_backend.git
cd Fampay_backend
git checkout feature/developer2-backend
npm install
```

### **2. 환경 변수 설정**

```env
# .env 파일 생성
JWT_SECRET=your-jwt-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
XRPL_SERVER=wss://s.devnet.rippletest.net:51233
DATABASE_URL=mongodb://localhost:27017/fampay_db
```

### **3. 개발자 2 시스템 테스트**

```bash
# 모든 기능이 정상 작동하는지 확인
node test-auth-key-services.js
node test-cashout-gateway.js
```

### **4. 서버 실행**

```bash
npm start
# 서버가 http://localhost:3000 에서 실행됩니다
```

### **5. API 테스트**

```bash
# 회원가입 테스트
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@fampay.com","password":"test123","confirmPassword":"test123","walletAddress":"rTestAddress123"}'

# 로그인 테스트
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@fampay.com","password":"test123"}'
```

### **즉시 필요한 협의사항**

1. **DB 선택**: MongoDB vs PostgreSQL
2. **스키마 설계**: 제안된 테이블 구조 검토
3. **API 통합**: XRPL API와 인증 API 연동 방식
4. **환경 설정**: 공통 환경변수 및 보안 설정

---

## 🔧 **기술 상세 정보**

### **보안 아키텍처**

```
🔐 보안 계층 구조:
┌─────────────────────────────────────┐
│  🛡️ Security Headers (Helmet)       │ ← CORS, CSP, HSTS
├─────────────────────────────────────┤
│  ⏱️ Rate Limiting                   │ ← API 호출 제한
├─────────────────────────────────────┤
│  🔑 JWT Authentication              │ ← Bearer 토큰 검증
├─────────────────────────────────────┤
│  👤 Role-Based Access Control       │ ← admin/owner/member
├─────────────────────────────────────┤
│  💼 Wallet Ownership Verification   │ ← XRPL 지갑 소유권
├─────────────────────────────────────┤
│  🔧 Business Logic Services         │ ← 실제 기능 처리
└─────────────────────────────────────┘
```

### **인증 플로우**

```
📱 클라이언트 요청
     ↓
🛡️ Security Headers 적용
     ↓
⏱️ Rate Limiting 체크
     ↓
🔑 JWT 토큰 검증
     ↓
👤 사용자 역할 확인
     ↓
💼 지갑 소유권 검증 (필요시)
     ↓
🔧 비즈니스 로직 실행
     ↓
📊 응답 및 로깅
```

### **데이터 흐름**

```
🗄️ 현재 (메모리 기반):
Controller → Map() 저장소 → 메모리

🗄️ 목표 (DB 기반):
Controller → Model/Schema → Database
```

---

## ⚠️ **알려진 이슈 및 해결방법**

### **Issue 1: 메모리 기반 저장소**

**문제**: 서버 재시작 시 모든 데이터 손실
**해결**: 개발자 1이 DB 연결 작업 필요

### **Issue 2: XRPL 시스템 분리**

**문제**: 개발자 1의 XRPL 파일들이 `dev1-xrpl-legacy/`에 보관됨
**해결**: 파일 복원 및 인증 시스템과 통합 필요

### **Issue 3: 니모닉-지갑 매핑**

**문제**: 현재 니모닉과 실제 XRPL 지갑이 독립적으로 생성됨
**해결**: BIP39 → XRPL 지갑 생성 로직 개선 필요

### **Issue 4: 실제 게이트웨이 API**

**문제**: 현재 시뮬레이션 API 사용
**해결**: 실제 Binance, Wise, M-Pesa API 연동 필요

---

## 📊 **성능 및 확장성**

### **현재 구현 특징**

- **동시 접속**: Express.js 기본 처리량
- **보안**: 엔터프라이즈급 JWT + 미들웨어
- **확장성**: 모듈화된 서비스 구조
- **테스트**: 모든 기능 검증 완료

### **운영 환경 고려사항**

- **DB 커넥션 풀**: 동시 접속 최적화 필요
- **Redis 세션**: 분산 환경 세션 관리
- **로드 밸런싱**: 다중 서버 운영 준비
- **모니터링**: Winston, PM2 로깅 시스템

---

## 🎯 **마일스톤**

### **✅ 완료된 마일스톤**

- **M1**: 보안 인프라 구축 (개발자 2)
- **M2**: 키 관리 시스템 (개발자 2)
- **M3**: 현금화 게이트웨이 (개발자 2)

### **🔄 진행 중인 마일스톤**

- **M4**: DB 통합 (개발자 1 진행 예정)
- **M5**: XRPL 결제 통합 (개발자 1 진행 예정)

### **📋 예정된 마일스톤**

- **M6**: 테스트 자동화 (공통)
- **M7**: 배포 파이프라인 (공통)
- **M8**: 모니터링 시스템 (공통)

3. **API 통합**: XRPL 결제 API와 인증 API 연동
4. **환경 설정**: 공통 환경변수 및 설정

---

## 🔍 **개발자 1을 위한 디버깅 가이드**

### **현재 작동하는 기능들**

```bash
# ✅ 정상 작동 확인
curl -X GET http://localhost:3000/api/auth/profile  # 401 에러 (정상 - 토큰 없음)
curl -X GET http://localhost:3000/api/keys/backups  # 401 에러 (정상 - 토큰 없음)
curl -X GET http://localhost:3000/api/cashout/gateways # 401 에러 (정상 - 토큰 없음)
```

### **DB 연결 후 확인할 사항**

```bash
# 회원가입 → 로그인 → API 호출 플로우 테스트
# 1. 회원가입
curl -X POST http://localhost:3000/api/auth/register -H "Content-Type: application/json" -d '{"email":"dev1@test.com","password":"test123","confirmPassword":"test123","walletAddress":"rDev1TestAddress"}'

# 2. 로그인 (토큰 획득)
curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"email":"dev1@test.com","password":"test123"}'

# 3. 인증이 필요한 API 호출 (토큰 사용)
curl -X GET http://localhost:3000/api/auth/profile -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### **XRPL 시스템 통합 체크포인트**

```javascript
// dev1-xrpl-legacy 파일 복원 후 확인할 사항

// 1. 라우트 활성화 확인
app.use("/api/trustset", trustSetRouter); // app.js에서 주석 해제

// 2. 인증 미들웨어 추가
router.post('/create-trustline',
  authMiddleware.authenticateToken(),     // 개발자 2 인증
  trustSetController.createTrustLine      // 개발자 1 XRPL
);

// 3. 통합 테스트
curl -X POST http://localhost:3000/api/trustset/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userSeed":"...","issuerAddress":"...","currencyCode":"USD","limit":"1000"}'
```

### **DB 스키마 우선순위**

```sql
-- 1순위: 사용자 시스템 (즉시 필요)
CREATE TABLE users (...);
CREATE TABLE sessions (...);

-- 2순위: 키 관리 시스템
CREATE TABLE wallet_backups (...);
CREATE TABLE social_recovery_configs (...);

-- 3순위: 현금화 시스템
CREATE TABLE approved_gateways (...);
CREATE TABLE cashout_requests (...);

-- 4순위: XRPL 통합 (개발자 1 복원 후)
CREATE TABLE trust_lines (...);
CREATE TABLE payment_history (...);
```

### **환경 변수 체크리스트**

```env
# 필수 환경 변수
JWT_SECRET=강력한-비밀키-32자-이상
JWT_REFRESH_SECRET=리프레시-비밀키-32자-이상
DATABASE_URL=데이터베이스-연결-문자열
XRPL_SERVER=wss://s.devnet.rippletest.net:51233

# 선택적 환경 변수
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
BCRYPT_SALT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 📞 **개발자 1 지원**

### **연락처 및 문서**

- **상세 인수인계**: `HANDOVER-TO-DEV1.md` 참조
- **개발자 2 완료 문서**: `README-DEV2.md` 참조
- **XRPL 레거시 파일**: `dev1-xrpl-legacy/README.md` 참조

---

## 📈 **다음 단계**

1. **개발자 1과 미팅** - DB 및 통합 계획 논의
2. **DB 연결 작업** - 스키마 구현 및 마이그레이션
3. **XRPL 시스템 통합** - 결제 시스템 복원 및 연동
4. **통합 테스트** - 전체 시스템 검증
5. **배포 준비** - Docker, CI/CD 설정

---

## 🎯 **현재 상태**

- ✅ **개발자 2 업무**: 100% 완료
- ⚠️ **DB 연결**: 개발자 1 작업 필요
- ⚠️ **XRPL 통합**: 개발자 1 작업 필요
- 🔄 **테스트 환경**: 구축 예정
- 🔄 **배포 환경**: 구축 예정

**개발자 1의 DB 연결 및 XRPL 통합 작업을 기다리고 있습니다.**

---

**문서 업데이트**: 2025-09-20  
**개발자 2**: 보안 및 인프라 시스템 완료  
**상태**: 개발자 1 인수인계 준비 완료 🚀
