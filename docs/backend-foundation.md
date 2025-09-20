# Backend Foundation – Developer 1

## Database Schema Draft (PostgreSQL)

### users
- `id` (UUID, PK)
- `email` (varchar, unique, nullable until login system ready)
- `full_name` (varchar)
- `xrpl_wallet_id` (uuid, FK -> wallets.id, nullable)
- `created_at` (timestamptz, default now)
- `updated_at` (timestamptz)

### wallets
- `id` (UUID, PK)
- `xrpl_address` (varchar, unique)
- `public_key` (varchar)
- `encrypted_secret` (text) – optional, null if self-custody
- `label` (varchar)
- `owner_user_id` (UUID, FK -> users.id, nullable for group wallets)
- `created_at` (timestamptz)

### groups
- `id` (UUID, PK)
- `host_user_id` (UUID, FK -> users.id)
- `title` (varchar)
- `description` (text)
- `group_wallet_id` (UUID, FK -> wallets.id)
- `created_at` (timestamptz)

### group_members
- `id` (UUID, PK)
- `group_id` (UUID, FK -> groups.id)
- `user_id` (UUID, FK -> users.id)
- `role` (enum: host, admin, member)
- `status` (enum: pending, active, removed)
- `joined_at` (timestamptz)

### recurring_plans
- `id` (UUID, PK)
- `group_id` (UUID, FK -> groups.id)
- `created_by` (UUID, FK -> users.id)
- `type` (enum: contribution, payout)
- `amount_drops` (numeric)
- `currency` (varchar, default 'XRP')
- `schedule_cron` (varchar) – simple cron string or interval
- `memo` (varchar)
- `destination_wallet_id` (UUID, FK -> wallets.id)
- `escrow_release_at` (timestamptz, nullable)
- `status` (enum: active, paused, cancelled)
- `created_at` (timestamptz)

### transactions
- `id` (UUID, PK)
- `group_id` (UUID, FK -> groups.id)
- `xrpl_hash` (varchar, unique)
- `type` (enum: contribution, payout, escrow_create, escrow_finish, escrow_cancel, batch)
- `amount_drops` (numeric)
- `currency` (varchar)
- `source_wallet_id` (UUID, FK -> wallets.id)
- `destination_wallet_id` (UUID, FK -> wallets.id)
- `memo` (varchar)
- `status` (enum: pending, confirmed, failed)
- `submitted_at` (timestamptz)
- `confirmed_at` (timestamptz, nullable)

### permissioned_domains
- `id` (UUID, PK)
- `group_id` (UUID, FK -> groups.id)
- `domain` (varchar)
- `label` (varchar)
- `created_by` (UUID, FK -> users.id)
- `verified_at` (timestamptz, nullable)

### cashout_requests
- `id` (UUID, PK)
- `group_id` (UUID, FK -> groups.id)
- `member_id` (UUID, FK -> group_members.id)
- `requested_amount_drops` (numeric)
- `target_domain_id` (UUID, FK -> permissioned_domains.id)
- `status` (enum: pending, approved, rejected, fulfilled)
- `created_at` (timestamptz)
- `resolved_at` (timestamptz, nullable)

## Core API Surface (v0)

### Health & Meta
- `GET /health` → basic service status
- `GET /config/xrpl` → expose XRPL network info for clients

### Auth & Users (placeholder until JWT ready)
- `POST /users` → create lightweight user profile with wallet metadata
- `GET /users/:id` → retrieve user profile and linked wallets

### Groups
- `POST /groups` → create group wallet (host)
- `GET /groups/:id` → group overview (members, balances, plans)
- `POST /groups/:id/members` → invite/join member by wallet address
- `PATCH /groups/:id/members/:memberId` → update role/status (host only)

### Wallets & XRPL integration
- `POST /wallets/xrpl/generate` → create XRPL wallet (testnet/dev only)
- `POST /wallets/xrpl/import` → attach existing XRPL address (no secrets stored)
- `GET /wallets/:id/balance` → fetch XRPL balances (XRP + trust lines)

### Recurring Contributions / Escrow
- `POST /groups/:id/recurring-plans` → configure recurring deposit or payout
- `GET /groups/:id/recurring-plans` → list plans and next execution
- `POST /recurring-plans/:id/activate` → activate escrow/batch job
- `POST /recurring-plans/:id/pause` → pause plan

### Payments & Transactions
- `POST /groups/:groupId/transactions` → 그룹 지갑 트랜잭션 생성 (일회성 Payment/Batch/Escrow 메타 저장)
- `PATCH /groups/:groupId/transactions/:transactionId` → 상태/확정 정보 갱신 (확정 시간, XRPL 해시)
- `GET /groups/:groupId/transactions` → 그룹 트랜잭션 히스토리 조회 (memo/XRPL hash 포함)
- `POST /groups/:groupId/transactions/plans` → 정기 납부/지급 계획 생성 (Escrow/Batch 예약)
- `PATCH /groups/:groupId/transactions/plans/:planId` → 계획 상태/메타 갱신
- `GET /groups/:groupId/transactions/plans/list` → 정기 계획 목록

### Permissioned Domains & Cash-out
- `POST /groups/:groupId/permissioned-domains` → 허가된 게이트웨이 등록
- `GET /groups/:groupId/permissioned-domains` → 등록된 도메인 목록 조회
- `PATCH /groups/:groupId/permissioned-domains/{domainId}/verify` → 도메인 검증 상태 업데이트
- `DELETE /groups/:groupId/permissioned-domains/{domainId}` → 도메인 삭제
- `POST /groups/:groupId/cashout-requests` → member cash-out request *(todo)*
- `PATCH /cashout-requests/:id` → approve/reject/fulfill *(todo)*

## Supporting Services
- XRPL Client service (singleton) for websocket + REST fallback
- Scheduler job queue (BullMQ or node-cron) for recurring plans
- Notification adapter placeholder (WebSocket/SSE) for events

## Open Questions / Alignment Needed
1. Authentication source of truth? (Email/password vs wallet-signature?)
2. Should we persist XRPL secrets server-side or enforce client custody only?
3. Target currency beyond XRP (needs TrustLine design)?
4. Preferred cron granularity for recurring plans (daily/weekly vs cron expression)?

## Immediate Next Actions (P0 focus)
1. Convert Express generator scaffold into layered API structure (`src/app.ts` equivalent) with middleware modules and health route.
2. Introduce dotenv-based configuration loader with validation for XRPL endpoints and secrets (`config/index.js`).
3. Implement base XRPL client wrapper using `xrpl` SDK; expose health/balance mock endpoints for integration testing.
4. Define database migration seeds (Prisma/Knex or SQL) for the schema above and integrate into project bootstrap.
5. Set up linting, formatting, and testing harness (Jest) to support upcoming XRPL integration tests.

## Implementation Snapshot (2025-09-20)
- Express 앱을 `src/` 중심 구조로 재구성하고 `/health`, `/api/health` 엔드포인트를 추가했습니다.
- 공통 미들웨어(요청 로깅, CORS, 에러 핸들링)를 모듈화하고 `.env` 기반 설정 로더(`src/config/index.js`)를 도입했습니다.
- XRPL 클라이언트 스텁(`src/services/xrplClient.js`)을 추가해 네트워크 설정/상태 조회를 추상화했습니다.
- `.env.example`를 제공하여 기본 XRPL 테스트넷 엔드포인트와 서버 포트 구성을 안내합니다.
- Prisma ORM을 세팅하고 `prisma/schema.prisma`에 Users, Wallets, Groups, RecurringPlans 등 도메인 모델을 정의했으며, `src/db/prisma.js`로 클라이언트 유틸리티를 노출했습니다.
- XRPL 지갑 서비스(`src/services/xrpl/walletService.js`)와 `/api/wallets` 라우터를 추가해 지갑 생성·펀딩·잔액 조회 기능을 노출했습니다.
- 그룹 도메인 서비스를 Prisma 기반으로 작성하고 `/api/groups` 라우터를 통해 그룹 생성·멤버 관리 기초 API를 제공합니다.
- 트랜잭션/정기 납부 서비스와 `/api/groups/:groupId/transactions` 라우팅을 구성해 Payment/Batch/Escrow 메타를 저장할 수 있습니다.
- Swagger 기반 문서를 `/docs` 경로에서 제공하며, 주요 라우터에 OpenAPI 주석과 예시 응답을 추가했습니다.
- XRPL 트랜잭션 실행 래퍼와 PermissionedDomains API를 추가해 결제/에스크로 처리와 게이트웨이 화이트리스트 관리를 지원합니다.
- Jest + Supertest 테스트 스위트(`tests/`)로 헬스/지갑/트랜잭션/PermissionedDomains 흐름을 검증했으며 `npx prisma validate`로 스키마 유효성을 확인했습니다.

### 다음 작업 제안
1. Transaction/Plan API에 실제 XRPL 트랜잭션 연동을 추가하고 `/docs` 문서에 샘플 응답을 보강.
2. `npm run prisma:migrate`를 이용한 실제 DB 마이그레이션 파이프라인 및 데이터 시드 작성.
3. Jest 테스트를 확장하고 GitHub Actions 파이프라인에 통합.
4. Docker 및 CI/CD 템플릿 작성으로 배포 자동화 기반 마련.

### 데이터베이스 마이그레이션 노트
- 초기 스키마는 `prisma/migrations/000_init/migration.sql`에서 확인 가능하며, PostgreSQL 환경에 적용하면 됩니다.
- 로컬 개발 시 `docker-compose.yml`을 통해 Postgres 15 컨테이너를 띄운 뒤 `npm run prisma:migrate`를 실행하세요.
- Prisma 클라이언트는 `npm run prisma:generate`로 재생성할 수 있습니다.
- 현재 실행 환경에는 Docker가 없어 DB 컨테이너를 직접 기동하지는 못했습니다. 다른 환경에서 `docker compose up -d` 후 마이그레이션을 진행해야 합니다.
- `/docs`에서 OpenAPI 명세를 확인할 수 있으며, swagger-jsdoc을 통해 라우터 주석에서 스키마가 생성됩니다.
- XRPL 실제 실행에는 seed 등 민감정보가 필요하므로 개발 환경에서만 `xrpl.execute=true` 옵션을 사용하고, 운영 환경에서는 별도 키 관리 계층을 두어야 합니다.
- 2025-09-20 기준 `npx prisma validate` 결과 스키마가 유효함을 확인했습니다.
- 로컬 개발 환경에서 `createdb grouppay` → `npm run prisma:deploy` → `npm run prisma:generate` 순으로 마이그레이션과 클라이언트 재생성을 완료했습니다.
- `Dockerfile`, `.dockerignore`, `.github/workflows/ci.yml`을 추가해 컨테이너 빌드와 CI 파이프라인의 기본 골격을 마련했습니다.

## Developer 1 진행 상황 업데이트 (2025-09-20)
- `dv1.md` 파일에서 Developer 1의 완료/진행/차기 작업 및 의사결정 사항을 명시했습니다.
- 현재 P0 항목은 XRPL 서비스 확장, API 라우터 세분화, DB 마이그레이션 도구 선정, Jest 테스트 환경 구축입니다.
- P1 단계로 Payment/Batch/Escrow, PermissionedDomains, 테스트넷 데모 시나리오 준비가 예정되어 있습니다.
