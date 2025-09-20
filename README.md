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
src/
├── services/           # 비즈니스 로직
│   ├── authService.js         # JWT 인증
│   ├── keyManagementService.js # 키 관리  
│   └── cashoutGatewayService.js # 현금화
├── controllers/        # API 컨트롤러
│   ├── authController.js      # 인증 API
│   ├── keyController.js       # 키 관리 API
│   └── cashoutController.js   # 현금화 API
├── middleware/         # 미들웨어
│   └── authMiddleware.js      # 보안 미들웨어
└── routes/            # API 라우팅
    ├── authRoutes.js          # 인증 라우트
    ├── keyRoutes.js           # 키 관리 라우트
    └── cashoutRoutes.js       # 현금화 라우트

dev1-xrpl-legacy/      # 개발자 1 XRPL 파일들 (복원 필요)
test-*.js              # 테스트 파일들
HANDOVER-TO-DEV1.md    # 상세 인수인계 문서
```

---

## 🤝 **개발자 1과의 협업**

### **즉시 필요한 협의사항**
1. **DB 선택**: MongoDB vs PostgreSQL
2. **스키마 설계**: 제안된 테이블 구조 검토
3. **API 통합**: XRPL 결제 API와 인증 API 연동
4. **환경 설정**: 공통 환경변수 및 설정

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
