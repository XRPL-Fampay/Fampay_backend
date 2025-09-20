# 🤝 개발자 1 인수인계 문서

## 📋 **현재 상황 요약**

**개발자 2**가 담당한 **보안 및 인프라 시스템**이 완료되었습니다. 하지만 **실제 데이터베이스 연결**이 필요한 상태로, **개발자 1**과의 협업이 필요합니다.

---

## ✅ **개발자 2 완료 업무**

### **1. 키 관리 시스템**

- ✅ 니모닉 생성 및 관리 (`keyManagementService.js`)
- ✅ 멀티시그 지갑 구현 (2/3 승인)
- ✅ 소셜 리커버리 메커니즘
- ✅ 하이브리드 커스터디 옵션

### **2. JWT 인증 시스템**

- ✅ JWT 기반 인증/인가 (`authService.js`)
- ✅ 생체인증 연동 준비
- ✅ 보안 미들웨어 구현 (`authMiddleware.js`)
- ✅ 세션 관리

### **3. 현금화 게이트웨이 연동**

- ✅ PermissionedDomains 구현 (`cashoutGatewayService.js`)
- ✅ 허가된 게이트웨이 관리
- ✅ 현금화 영수증 시스템
- ✅ 은행/모바일머니 API 연동

### **4. API 엔드포인트 (26개)**

- ✅ `/api/auth/*` - 인증 관련 (8개)
- ✅ `/api/keys/*` - 키 관리 관련 (8개)
- ✅ `/api/cashout/*` - 현금화 관련 (10개)

---

## ⚠️ **DB 연결 필요한 부분들**

현재 **메모리 기반 임시 저장소**를 사용하고 있어 실제 DB 연결이 필요합니다:

### **1. 사용자 관리** (`authController.js`)

```javascript
// 현재: 메모리 저장
this.users = new Map(); // 임시 사용자 저장소
this.sessions = new Map(); // 임시 세션 저장소

// 필요: DB 연결
// - Users 테이블
// - Sessions 테이블
// - UserProfiles 테이블
```

### **2. 키 관리** (`keyController.js`)

```javascript
// 현재: 메모리 저장
this.walletBackups = new Map(); // 임시 백업 저장소
this.recoveryConfigs = new Map(); // 임시 복구 설정 저장소

// 필요: DB 연결
// - WalletBackups 테이블
// - SocialRecoveryConfigs 테이블
// - MultisigConfigs 테이블
```

### **3. 현금화 게이트웨이** (`cashoutGatewayService.js`)

```javascript
// 현재: 메모리 저장
this.approvedGateways = new Map();
this.cashoutRequests = new Map();
this.receipts = new Map();

// 필요: DB 연결
// - ApprovedGateways 테이블
// - CashoutRequests 테이블
// - CashoutReceipts 테이블
```

---

## 🗄️ **필요한 데이터베이스 스키마**

### **1. 사용자 관리 테이블**

```sql
-- Users 테이블
CREATE TABLE users (
    user_id VARCHAR(32) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(50),
    family_role ENUM('admin', 'owner', 'member') DEFAULT 'member',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    two_factor_enabled BOOLEAN DEFAULT false,
    biometric_config JSON,
    last_login TIMESTAMP
);

-- Sessions 테이블
CREATE TABLE sessions (
    session_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    refresh_token TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT true,
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

### **2. 키 관리 테이블**

```sql
-- Wallet Backups 테이블
CREATE TABLE wallet_backups (
    backup_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    wallet_address VARCHAR(50) NOT NULL,
    encrypted_mnemonic TEXT NOT NULL,
    public_key VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    backup_version VARCHAR(10) DEFAULT '1.0',
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- Social Recovery Configs 테이블
CREATE TABLE social_recovery_configs (
    recovery_id VARCHAR(32) PRIMARY KEY,
    user_address VARCHAR(50) NOT NULL,
    guardians JSON NOT NULL, -- 가디언 주소 배열
    threshold INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

-- MultiSig Configs 테이블
CREATE TABLE multisig_configs (
    config_id VARCHAR(32) PRIMARY KEY,
    master_address VARCHAR(50) NOT NULL,
    signers JSON NOT NULL, -- 서명자 배열
    quorum INT NOT NULL,
    transaction_hash VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

### **3. 현금화 게이트웨이 테이블**

```sql
-- Approved Gateways 테이블
CREATE TABLE approved_gateways (
    gateway_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) NOT NULL,
    api_endpoint VARCHAR(500) NOT NULL,
    supported_currencies JSON NOT NULL,
    country VARCHAR(50),
    license_number VARCHAR(100),
    contact_info JSON,
    status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
    trust_score INT DEFAULT 100,
    registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cashout Requests 테이블
CREATE TABLE cashout_requests (
    request_id VARCHAR(32) PRIMARY KEY,
    user_id VARCHAR(32) NOT NULL,
    wallet_address VARCHAR(50) NOT NULL,
    amount DECIMAL(20,8) NOT NULL,
    currency VARCHAR(10) NOT NULL,
    gateway_id VARCHAR(50) NOT NULL,
    destination_account VARCHAR(255) NOT NULL,
    memo TEXT,
    status ENUM('pending', 'processing', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    gateway_transaction_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    gateway_fee DECIMAL(20,8),
    network_fee DECIMAL(20,8),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (gateway_id) REFERENCES approved_gateways(gateway_id)
);

-- Cashout Receipts 테이블
CREATE TABLE cashout_receipts (
    receipt_id VARCHAR(32) PRIMARY KEY,
    request_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    transaction_amount DECIMAL(20,8) NOT NULL,
    transaction_currency VARCHAR(10) NOT NULL,
    from_wallet VARCHAR(50) NOT NULL,
    to_account VARCHAR(255) NOT NULL,
    gateway_info JSON NOT NULL,
    fees JSON NOT NULL,
    status VARCHAR(20) NOT NULL,
    timestamps JSON NOT NULL,
    gateway_transaction_id VARCHAR(100),
    receipt_hash VARCHAR(128) NOT NULL,
    receipt_version VARCHAR(10) DEFAULT '1.0',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (request_id) REFERENCES cashout_requests(request_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id)
);
```

---

## 🔧 **개발자 1이 해야 할 작업**

### **1. 데이터베이스 연결 설정**

```javascript
// 예시: MongoDB 연결 (mongoose 사용)
const mongoose = require("mongoose");

// 또는 PostgreSQL 연결 (pg 사용)
const { Pool } = require("pg");
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

### **2. 모델/스키마 정의**

- User 모델
- Session 모델
- WalletBackup 모델
- SocialRecoveryConfig 모델
- ApprovedGateway 모델
- CashoutRequest 모델
- CashoutReceipt 모델

### **3. 컨트롤러 수정**

각 컨트롤러의 `Map()` 저장소를 실제 DB 쿼리로 교체:

```javascript
// 현재 (authController.js)
this.users.set(email, userData);

// 수정 필요
await User.create(userData);
```

### **4. 환경 변수 설정**

```env
# .env 파일 추가
DATABASE_URL=mongodb://localhost:27017/fampay_db
# 또는
DATABASE_URL=postgresql://user:password@localhost:5432/fampay_db
```

---

## 📂 **공유해야 할 파일들**

### **개발자 2 완성 파일들**

```
src/
├── services/
│   ├── authService.js ✅
│   ├── keyManagementService.js ✅
│   └── cashoutGatewayService.js ✅
├── controllers/
│   ├── authController.js ⚠️ (DB 연결 필요)
│   ├── keyController.js ⚠️ (DB 연결 필요)
│   └── cashoutController.js ⚠️ (DB 연결 필요)
├── middleware/
│   └── authMiddleware.js ✅
└── routes/
    ├── authRoutes.js ✅
    ├── keyRoutes.js ✅
    └── cashoutRoutes.js ✅
```

### **테스트 파일들**

```
test-auth-key-services.js ✅
test-cashout-gateway.js ✅
```

---

## 🎯 **통합 작업 우선순위**

### **Phase 1: 기본 DB 연결** (개발자 1)

1. MongoDB 또는 PostgreSQL 연결 설정
2. 기본 User 모델 생성
3. authController의 회원가입/로그인 DB 연결

### **Phase 2: 키 관리 DB 연결** (개발자 1)

1. WalletBackup, SocialRecovery 모델 생성
2. keyController의 백업/복구 시스템 DB 연결

### **Phase 3: 현금화 시스템 DB 연결** (개발자 1)

1. Gateway, CashoutRequest, Receipt 모델 생성
2. cashoutController의 현금화 시스템 DB 연결

### **Phase 4: XRPL 결제 시스템 통합** (개발자 1)

1. `dev1-xrpl-legacy/` 폴더의 파일들 복원
2. Payment, Batch, TrustSet 시스템과 DB 연결
3. 전체 시스템 통합 테스트

---

## 📞 **협업 포인트**

### **즉시 필요한 협의사항**

1. **DB 선택**: MongoDB vs PostgreSQL
2. **스키마 설계**: 위 제안 스키마 검토
3. **API 통합**: 개발자 1의 XRPL API와 개발자 2의 인증 API 연동
4. **환경 설정**: 공통 환경변수 및 설정 파일

### **장기 협업 계획**

1. **테스트 환경**: Jest/Mocha 테스트 프레임워크 설정
2. **배포 환경**: Docker, CI/CD 파이프라인 구축
3. **모니터링**: 로깅, 에러 추적 시스템
4. **보안 강화**: 실제 운영 환경 보안 설정

---

## 🚀 **다음 단계**

1. **개발자 1과 미팅** - DB 스키마 및 통합 계획 논의
2. **DB 연결 작업** - 개발자 1이 담당
3. **통합 테스트** - 양쪽 시스템 연동 테스트
4. **배포 준비** - Docker, CI/CD 설정

---

**문서 작성일**: 2025-09-20  
**작성자**: 개발자 2  
**상태**: DB 연결 대기 중  
**우선순위**: 높음 🔥
