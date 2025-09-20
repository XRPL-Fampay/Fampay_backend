# Group Wallet on XRPL - TODO List

## 프로젝트 개요

> 가족을 위한 소셜 페이먼트 월렛 – 송금은 빠르게, 현금화는 안전하게, 키 관리는 쉽게.

## 백엔드 개발자 역할 분배

### 🧑‍💻 개발자 1 - XRPL & Payment 전문

**핵심 역할**: XRPL 블록체인 통합 및 결제 시스템

### 👩‍💻 개발자 2 - Security & Infrastructure 전문

**핵심 역할**: 보안 및 인프라 시스템

---

## Phase 1: 기반 구축 (1-2주)

### ✅ 공통 작업

- [ ] **백엔드 기본 설정 및 프로젝트 구조 설계** `[진행중]`
  - Express.js 기반 구조 개선
  - 환경 설정 파일 구성
  - 폴더 구조 정리
- [ ] **데이터베이스 스키마 설계**
  - 사용자(Users) 테이블
  - 가족그룹(FamilyGroups) 테이블
  - 거래내역(Transactions) 테이블
  - 지갑(Wallets) 테이블
- [ ] **RESTful API 설계 및 문서화 (Swagger/OpenAPI)**
  - API 엔드포인트 정의
  - 요청/응답 스키마 문서화

---

## Phase 2: 핵심 기능 (2-3주)

### 🧑‍💻 개발자 1 담당

- [ ] **XRPL 코어 통합 - Payment/Batch/Escrow 기능 구현**
  - XRPL 라이브러리 연동
  - Payment 트랜잭션 생성/전송
  - Batch 결제 처리
  - Escrow 자동 지급 시스템
- [ ] **가족 지갑 관리 모듈 - 분배 규칙 저장 및 라우팅**
  - 가족 구성원별 지갑 생성
  - 송금 분배 규칙 엔진
  - 자동 분배 로직
- [ ] **알림 시스템 - 거래 알림, 승인 요청 등**
  - 실시간 알림 (WebSocket/SSE)
  - 이메일/SMS 알림 연동
  - 승인 요청 워크플로우

### 👩‍💻 개발자 2 담당

- [ ] **키 관리 시스템 - 니모닉/멀티시그/소셜 리커버리 구현**
  - 니모닉 생성 및 관리
  - 멀티시그 지갑 구현 (2/3 승인)
  - 소셜 리커버리 메커니즘
  - 하이브리드 커스터디 옵션
- [ ] **인증 시스템 - JWT 토큰 관리 및 보안 미들웨어**
  - JWT 기반 인증/인가
  - 생체인증 연동 준비
  - 보안 미들웨어 구현
  - 세션 관리

---

## Phase 3: 고급 기능 (2-3주)

### 👩‍💻 개발자 2 담당

- [ ] **현금화 게이트웨이 연동 - PermissionedDomains 기반 안전 출금**
  - PermissionedDomains 구현
  - 허가된 게이트웨이 관리
  - 현금화 영수증 시스템
  - 은행/모바일머니 API 연동

### ✅ 공통 작업

- [ ] **테스트 환경 구축 및 단위 테스트 작성**
  - Jest/Mocha 테스트 프레임워크 설정
  - API 테스트 작성
  - XRPL 테스트넷 연동
- [ ] **배포 환경 설정 (Docker, CI/CD 파이프라인)**
  - Docker 컨테이너화
  - GitHub Actions CI/CD
  - 환경별 배포 설정

---

## 기술 스택

### Backend

- **Framework**: Express.js
- **Database**: MongoDB/PostgreSQL
- **Authentication**: JWT
- **Blockchain**: XRPL (xrpl.js)
- **Real-time**: WebSocket/Socket.io

### DevOps

- **Containerization**: Docker
- **CI/CD**: GitHub Actions
- **Cloud**: AWS/GCP
- **Monitoring**: PM2, Winston

---

## 진행 상황 추적

### 완료된 작업 ✅

- 프로젝트 Fork 및 로컬 환경 설정

### 현재 진행 중 🔄

- 백엔드 기본 설정 및 프로젝트 구조 설계

### 다음 단계 📋

- 데이터베이스 스키마 설계
- API 설계 및 문서화

---

## 참고 링크

- [XRPL Documentation](https://xrpl.org/docs.html)
- [xrpl.js Library](https://js.xrpl.org/)
- [Project Repository](https://github.com/yelim8902/Fampay_backend)

---

**업데이트 일자**: 2025-09-20
**다음 리뷰 예정**: 2025-09-22
