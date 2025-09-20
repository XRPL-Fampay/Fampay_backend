# 개발자 1 XRPL 레거시 파일들

## 📁 이 폴더의 내용

이 폴더에는 **개발자 1이 담당했던 XRPL 결제 시스템** 관련 파일들이 보관되어 있습니다.

### 🗂️ 파일 목록

#### **Services (비즈니스 로직)**

- `xrplTrustSetService.js` - XRPL TrustSet 레저 서비스
- `xrplPaymentService.js` - XRPL Payment 레저 서비스
- `xrplBatchService.js` - XRPL Batch 레저 서비스

#### **Controllers & Routes (API 인터페이스)**

- `trustSetController.js` - TrustSet API 컨트롤러
- `trustSetRoutes.js` - TrustSet API 라우팅

#### **Tests (테스트 파일)**

- `test-trustset.js` - TrustSet 기능 테스트
- `test-xrpl-services.js` - XRPL 서비스 통합 테스트

## 🚫 현재 상태

이 파일들은 **개발자 2의 작업 범위에 포함되지 않아** 메인 프로젝트에서 제외되었습니다.

### 변경 사항:

- `app.js`에서 `trustSetRoutes` 참조 제거 (주석 처리)
- 메인 `src/` 폴더에서 이 폴더로 이동
- 더 이상 서버에서 로드되지 않음

## 🔄 복원 방법

만약 이 기능들이 다시 필요하다면:

1. **파일 복원**:

   ```bash
   # 서비스 파일들 복원
   mv dev1-xrpl-legacy/xrpl*.js src/services/

   # 컨트롤러 & 라우트 복원
   mv dev1-xrpl-legacy/trustSetController.js src/controllers/
   mv dev1-xrpl-legacy/trustSetRoutes.js src/routes/

   # 테스트 파일들 복원
   mv dev1-xrpl-legacy/test-*.js ./
   ```

2. **app.js 수정**:

   ```javascript
   // 주석 해제
   var trustSetRouter = require("./src/routes/trustSetRoutes");

   // 라우트 추가
   app.use("/api/trustset", trustSetRouter);
   ```

## 📋 개발자 1 담당 업무 (TODO 참조)

```
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
```

## 🎯 개발자 2 현재 작업

개발자 2는 다음 업무에 집중하고 있습니다:

- ✅ 키 관리 시스템 (완료)
- ✅ JWT 인증 시스템 (완료)
- ✅ 현금화 게이트웨이 연동 (완료)
- 🔄 테스트 환경 구축
- 🔄 배포 환경 설정

---

**이동 일자**: 2025-09-20
**이유**: 개발자 2 담당 업무 범위 정리
