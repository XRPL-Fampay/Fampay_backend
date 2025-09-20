# Group Wallet on XRPL - TODO List

## ⚡ 15시간 스프린트 계획 ⚡

**데드라인**: 15시간 내 MVP 완성
**목표**: 핵심 기능만 구현하여 데모 가능한 버전 완성

## 프로젝트 개요

> 가족을 위한 소셜 페이먼트 월렛 – 송금은 빠르게, 현금화는 안전하게, 키 관리는 쉽게.

---

## 🚀 15시간 우선순위 작업 (XRPL 레저 활용 MVP)

### ⏰ 0.5시간 - 환경 설정

- [x] 프로젝트 기본 구조 및 Express.js 설정
- [ ] 환경 변수 설정 (.env) - XRPL 테스트넷 설정
- [ ] 기본 미들웨어 설정 (CORS, body-parser 등)

### ⏰ 1시간 - XRPL Wallet 레저

- [ ] **Wallet 레저**: 지갑 생성, 기존 지갑 불러오기
- [ ] **Balance 조회**: trustline, flag 확인
- [ ] XRPL 테스트넷 연결 확인

### ⏰ 1.5시간 - XRPL Payment 레저

- [ ] **Payment 레저**: XRP/IOU 전송 기능
- [ ] Memos 활용한 송금 목적 기록
- [ ] 트랜잭션 상태 확인 및 에러 핸들링

### ⏰ 1시간 - XRPL TrustSet 레저

- [ ] **TrustSet 레저**: TrustLine 설정 (사용자 측)
- [ ] **RequireAuth**: 발행자 승인 시스템
- [ ] 가족 그룹 내 신뢰 관계 구축

### ⏰ 1.5시간 - 가족 그룹 기능

- [ ] 가족 그룹 생성 API
- [ ] 멤버 추가/제거 API
- [ ] 그룹 내 지갑 목록 및 TrustLine 조회

### ⏰ 2시간 - 그룹 송금 분배 로직

- [ ] **Batch 레저**: 여러 트랜잭션을 하나의 Batch로 처리
- [ ] Payment + Batch 조합으로 자동 분배 구현
- [ ] 분배 비율 설정 및 실행 API

### ⏰ 1시간 - XRPL Batch 레저

- [ ] **Batch 레저** 구현: 다중 결제 처리
- [ ] 가스비 최적화 및 원자성 보장
- [ ] Batch 실행 결과 추적

### ⏰ 1시간 - PermissionedDomains 레저

- [ ] **PermissionedDomains**: 현금화 게이트웨이 도메인 관리
- [ ] 허가된 게이트웨이만 연결 가능하도록 제한
- [ ] 도메인 생성/정책 관리 API

### ⏰ 0.5시간 - Credentials 레저

- [ ] **Credentials 레저**: 온체인 신원/권한 증명
- [ ] 가족 구성원 자격 증명
- [ ] 권한 기반 접근 제어

### ⏰ 1시간 - 기본 인증 시스템

- [ ] JWT 기반 로그인/회원가입
- [ ] XRPL 지갑과 연동된 인증
- [ ] 기본 인증 미들웨어

### ⏰ 1.5시간 - 핵심 API 엔드포인트

- [ ] 사용자 관리 API
- [ ] 그룹 송금 API
- [ ] 지갑 조회 API들
- [ ] 트랜잭션 히스토리 API

### ⏰ 1시간 - 테스트 & 데모

- [ ] XRPL 테스트넷 기본 기능 테스트
- [ ] Postman 컬렉션 생성 (각 레저별)
- [ ] 데모 시나리오 준비

### ⏰ 0.5시간 - 문서화

- [ ] XRPL 레저별 API 문서 작성
- [ ] README 업데이트 (레저 활용 설명)

---

## 🔄 연기된 기능 (v2.0)

- **AccountSet 레저**: 계정 설정 변경 (플래그)
- **TokenEscrow 레저**: 토큰 예치-해제 자동화
- **MPtokensV1 레저**: 발행자 승인형 토큰 발행/전송
- **PermissionedDex 레저**: 도메인 규제 적용된 DEX 거래
- **AMM 레저**: DEX 구현 시 필요한 전반적인 AMM 기능
- **Server 레저**: Ripple 노드 및 지원 기능 확인
- 멀티시그 지갑 (Multi-sign)
- 소셜 리커버리
- 고급 보안 기능
- 알림 시스템

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
- [ ] **그룹 지갑 관리 모듈 - 분배 규칙 저장 및 라우팅**
  - 가족 구성원별 지갑 생룹
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
