# 방문 유형(Visit Purpose) 재설계 설계서

## 개요

"새 상담/프로토콜 시작" 모달의 분류 체계가 논리적이지 못해 재설계한다. 기존에는 "상담 유형"이라는 단일 축에 **서비스 카테고리**("일반 상담")와 **프로세스 단계**(HA_1/HA_2/HA_3/사후관리_3개월)를 병렬 나열하여 차원이 다른 개념을 섞어 놓았다. 본 설계는 두 축을 분리하고, 피팅·사후관리 차수를 무제한 확장 가능하게 만든다.

**대상 레포지토리**: https://github.com/oohearing99/jinsim-hearing-crm

**브랜치**: `feat/visit-manager-ux-redesign` 이후 후속 브랜치에서 구현 (예: `feat/visit-purpose-redesign`)

**선행 의존성**: 현재 브랜치의 27 커밋이 병합된 상태. 본 설계는 기존 `VisitType`/`HAStage` 데이터 모델을 대체한다.

---

## 1. 현재 구조의 문제점

### 1.1 분류 축 혼용

"상담 유형" 하위에 다음이 병렬 배치되어 있다:

- **일반 상담 / 청력 검사** — 서비스 카테고리
- **HA_1 / HA_2 / HA_3** — 피팅 프로세스의 단계
- **사후관리(3개월)** — 사후 서비스의 한 시점

차원이 다른 개념이 같은 레벨에 존재하여, 사용자가 "이 환자의 방문은 어느 항목인가?"를 판단할 때 혼란을 겪는다.

### 1.2 실무 시나리오 누락

- **재방문 청력 체크** — 보청기 없이 추이만 확인하는 기존 고객 유형 부재
- **AS·수리** — 고장, 청소, 소모품 교체 방문 카테고리 부재
- **반품·교환** — 불만족에 따른 환불/교환 상담 부재
- **임시 조정** — 정규 피팅 단계 사이 추가 조정 방문 부재
- **4차 이상의 피팅** — 어려운 케이스에서 필요한 추가 차수 불가능
- **1년 초과 장기 사후관리** — 24개월, 36개월 등 장기 점검 불가능

### 1.3 용어·데이터 중복

- `Visit.purpose: string[]` (방문 목적)과 `QuestionnaireData.visit_motives: string[]` (방문 동기)이 개념적으로 유사하지만 데이터 소스와 UI가 분리되어 있음
- 버튼 라벨 오타: "프로**콜** 시작" (→ "프로토콜")
- "1주 후 적응체크", "2주 후 심화조정" 같은 고정 주기 라벨이 실제 환자별 간격과 다를 수 있음

---

## 2. 새 구조: 2단계 축 분리

### 2.1 Step 1 — 방문 목적 (Visit Purpose)

4개 카테고리 중 하나를 선택한다.

| 목적 | 내부 코드 | 설명 | 단계 선택? |
|---|---|---|---|
| **초진 상담** | `INITIAL` | 첫 내원, 문진 + 기초 임상 평가 | 없음 |
| **보청기 피팅** | `FITTING` | 구매 확정 후 실제 피팅 과정 | 1차/2차/3차/4차+ |
| **정기 사후관리** | `AFTERCARE` | 착용 후 정기 점검 | 3M/6M/12M/24M+ |
| **AS·수리** | `SERVICE` | 고장, 청소, 소모품 교체, 반품/교환, 임시 조정 | 없음 |

**제거된 카테고리의 흡수**:
- 반품·교환, 청력 재검사, 임시 조정 → 모두 `SERVICE` 또는 메모 필드로 흡수
- 청력 재검사 중 기존 착용자 → `AFTERCARE`로도 분류 가능

### 2.2 Step 2 — 세부 단계 (해당 목적 시만)

**보청기 피팅 선택 시**:

```
[1차] [2차] [3차] [4차] [+ 추가]
```

- 기본 버튼 4개 고정 표시
- "+ 추가" 클릭 시 다음 차수 버튼 생성 (5차, 6차, 7차, ...)
- 추가된 차수는 로컬 상태에 보관. 해당 고객의 `visits` 리스트에서 최대 `fitting_session_no` + 1 을 다음 기본값으로 제안

**정기 사후관리 선택 시**:

```
[3개월] [6개월] [12개월] [+ 추가]
```

- 기본 버튼 3개 고정 표시
- "+ 추가" 클릭 시 다음 월 단위 생성 (24개월, 36개월, ...)
- 자주 쓰이지 않으므로 custom integer input도 제공 (예: "48" 입력 시 48개월)

**초진 상담 / AS·수리 선택 시**: Step 2 건너뜀 → 바로 Step 3

### 2.3 Step 3 — 방문 정보 (기존 유지)

- 방문 날짜 (date input)
- 방문 목적 라벨 (자동 채움, 읽기 전용)
- 방문 메모 (textarea, 선택)

기존 모달의 이 섹션은 변경하지 않는다.

---

## 3. 데이터 모델

### 3.1 타입 정의

`types.ts`:

```ts
// 대체 (기존 VisitType)
export type VisitPurpose = 'INITIAL' | 'FITTING' | 'AFTERCARE' | 'SERVICE';

export interface Visit extends BaseRecord {
  id: string;
  customer_id: string;
  visit_date: string;
  purpose: string[];                        // 기존 유지 (표시/검색용 라벨)
  memo?: string;
  visit_memo?: string;
  
  // 신규
  visit_purpose: VisitPurpose;              // 필수
  fitting_session_no?: number;              // FITTING일 때만, 1 이상의 정수
  aftercare_month?: number;                 // AFTERCARE일 때만, 3 이상의 정수
  
  // 기존 필드 (후방 호환용, 한시적 유지)
  visit_type: VisitType;                    // deprecated, 다음 릴리즈에 제거
  ha_stage: HAStage | null;                 // deprecated
  ha_stage_label?: string;                  // deprecated
  
  recommended_next_visit_date?: string | null;
  next_visit_rule?: 'WEEKLY' | '3MONTH' | null;
  protocol_version?: string;
}
```

### 3.2 라벨 렌더링 헬퍼

`utils/visitPurposeLabel.ts`:

```ts
export function formatVisitPurpose(v: Visit): string {
  switch (v.visit_purpose) {
    case 'INITIAL': return '초진 상담';
    case 'FITTING':
      return v.fitting_session_no
        ? `${v.fitting_session_no}차 피팅`
        : '피팅';
    case 'AFTERCARE':
      return v.aftercare_month
        ? `${v.aftercare_month}개월 사후관리`
        : '사후관리';
    case 'SERVICE': return 'AS · 수리';
  }
}
```

### 3.3 유효성 규칙

- `visit_purpose === 'FITTING'` → `fitting_session_no` 필수, 1 이상
- `visit_purpose === 'AFTERCARE'` → `aftercare_month` 필수, 3 이상
- `visit_purpose === 'INITIAL'` 또는 `'SERVICE'` → 두 단계 필드 모두 null/undefined

---

## 4. 체크리스트 템플릿 매핑

### 4.1 템플릿 정의

`data/haProtocolTemplates.ts` 확장:

```ts
export const PROTOCOL_TEMPLATES: Record<string, ChecklistItem[]> = {
  INITIAL: [/* 신규: 문진, 이경, 순음, 어음, 상담 */],
  FITTING_1: [/* 기존 HA_1 그대로 */],
  FITTING_2: [/* 기존 HA_2 그대로 */],
  FITTING_3: [/* 기존 HA_3 그대로 */],
  FITTING_EXTRA: [/* 신규: 4차 이상용 공통 "추가 조정" */],
  AFTERCARE_ROUTINE: [/* 신규: 모든 사후관리 주기 공통 */],
  SERVICE: [/* 신규: AS/수리용 간단 체크 */],
};
```

### 4.2 템플릿 선택 규칙

`utils/protocolTemplateResolver.ts`:

```ts
export function resolveTemplate(v: Visit): ChecklistItem[] {
  switch (v.visit_purpose) {
    case 'INITIAL':
      return PROTOCOL_TEMPLATES.INITIAL;
    case 'FITTING':
      const n = v.fitting_session_no ?? 1;
      if (n === 1) return PROTOCOL_TEMPLATES.FITTING_1;
      if (n === 2) return PROTOCOL_TEMPLATES.FITTING_2;
      if (n === 3) return PROTOCOL_TEMPLATES.FITTING_3;
      return PROTOCOL_TEMPLATES.FITTING_EXTRA;  // 4차 이상
    case 'AFTERCARE':
      return PROTOCOL_TEMPLATES.AFTERCARE_ROUTINE;
    case 'SERVICE':
      return PROTOCOL_TEMPLATES.SERVICE;
  }
}
```

### 4.3 신규 템플릿 초안

#### 4.3.1 INITIAL (초진 상담)

```
- intake_review             문진/상담       required
- otoscopy                  귀/중이         required
- pure_tone_ac              청각검사       required
- pure_tone_bc              청각검사       required
- speech_srt                청각검사       required
- cosi_goals_set            문진/상담      optional (권장)
- counseling_next_step      계획            required
```

#### 4.3.2 FITTING_EXTRA (4차 이상 추가 조정)

```
- listening_check           기기점검       required
- issue_identification      조정           required
- fine_tuning               조정           required
- rem_reverify              조정           optional
- datalogging_review        기기점검       optional
- validation_cosi           결과평가       required
- schedule_next             계획            required
```

#### 4.3.3 AFTERCARE_ROUTINE (모든 사후관리 주기 공통)

```
- interim_history           문진/상담      required
- red_flags                 문진/상담      optional
- otoscopy                  귀/중이        required
- deep_cleaning             기기점검       required
- listening_check           기기점검       required
- fine_tuning               조정            optional
- tymp_needed               청각검사       optional
- retest_needed             청각검사       optional
- education_refresh         교육            required
- schedule_next             계획            required
```

#### 4.3.4 SERVICE (AS · 수리)

```
- issue_description         문진/상담      required
- device_inspection         기기점검       required
- repair_or_replacement     기기점검       required
- followup_required         계획            optional
```

---

## 5. 마이그레이션 전략

### 5.1 데이터 변환 규칙

앱 시작 시 `jinsim_visits` 키의 배열을 순회하며 변환. 기존 필드 그대로 유지하고 신규 필드 추가.

| 기존 상태 | → | 신규 필드 |
|---|---|---|
| `visit_type === 'HA_PROTOCOL' && ha_stage === 'HA_1'` | → | `visit_purpose: 'FITTING', fitting_session_no: 1` |
| `ha_stage === 'HA_2'` | → | `fitting_session_no: 2` |
| `ha_stage === 'HA_3'` | → | `fitting_session_no: 3` |
| `ha_stage === 'AFTERCARE_3MO'` | → | `visit_purpose: 'AFTERCARE', aftercare_month: 3` |
| `visit_type === 'GENERAL'` AND 해당 고객의 첫 방문 | → | `visit_purpose: 'INITIAL'` |
| `visit_type === 'GENERAL'` AND 해당 고객의 재방문 | → | `visit_purpose: 'SERVICE'` |

### 5.2 마이그레이션 구현

`utils/migrateVisits.ts`:

```ts
const MIGRATION_VERSION = 2;

export function migrateVisitsIfNeeded(visits: Visit[]): Visit[] {
  const version = Number(localStorage.getItem('jinsim_migration_version') ?? '1');
  if (version >= MIGRATION_VERSION) return visits;

  const byCustomer = new Map<string, Visit[]>();
  for (const v of [...visits].sort((a, b) => a.visit_date.localeCompare(b.visit_date))) {
    const arr = byCustomer.get(v.customer_id) ?? [];
    arr.push(v);
    byCustomer.set(v.customer_id, arr);
  }

  const migrated = visits.map(v => {
    if (v.visit_purpose) return v;  // 이미 마이그레이션됨

    if (v.visit_type === 'HA_PROTOCOL') {
      if (v.ha_stage === 'HA_1') return { ...v, visit_purpose: 'FITTING', fitting_session_no: 1 };
      if (v.ha_stage === 'HA_2') return { ...v, visit_purpose: 'FITTING', fitting_session_no: 2 };
      if (v.ha_stage === 'HA_3') return { ...v, visit_purpose: 'FITTING', fitting_session_no: 3 };
      if (v.ha_stage === 'AFTERCARE_3MO') return { ...v, visit_purpose: 'AFTERCARE', aftercare_month: 3 };
    }

    // GENERAL: 첫 방문 여부 확인
    const customerVisits = byCustomer.get(v.customer_id) ?? [];
    const isFirst = customerVisits[0]?.id === v.id;
    return { ...v, visit_purpose: isFirst ? 'INITIAL' : 'SERVICE' };
  });

  localStorage.setItem('jinsim_migration_version', String(MIGRATION_VERSION));
  return migrated;
}
```

### 5.3 롤백 계획

구 필드(`visit_type`, `ha_stage`, `ha_stage_label`)는 한 릴리즈 동안 함께 저장. 문제 발생 시 UI에서 구 필드 기준으로 렌더링할 수 있도록 양립.

다음 릴리즈에서 구 필드 제거.

---

## 6. UI 컴포넌트 변경

### 6.1 새 상담 시작 모달 (`app/page.tsx` 내 블록 또는 분리 컴포넌트)

구조:

```
<Modal>
  <Header>새 상담 시작</Header>
  <Section title="방문 목적">
    <PurposeGrid>                        // 2x2 버튼
      [초진 상담] [보청기 피팅]
      [정기 사후관리] [AS · 수리]
    </PurposeGrid>
  </Section>

  {visit_purpose === 'FITTING' && (
    <Section title="피팅 차수">
      <StageRow extensible>
        [1차] [2차] [3차] [4차] [+ 추가]
      </StageRow>
    </Section>
  )}

  {visit_purpose === 'AFTERCARE' && (
    <Section title="사후관리 시점">
      <StageRow extensible>
        [3개월] [6개월] [12개월] [+ 추가]
      </StageRow>
      <CustomInput placeholder="직접 입력 (개월)" />
    </Section>
  )}

  <Section title="방문 정보">
    <DateInput /> <PurposeLabel readonly /> <MemoTextarea />
    <Buttons>[취소] [상담 시작 →]</Buttons>
  </Section>
</Modal>
```

### 6.2 신규 컴포넌트

- `components/visit/VisitPurposeModal.tsx` (기존 inline 모달에서 분리)
- `components/visit/PurposeGrid.tsx` (Step 1)
- `components/visit/StageRowExtensible.tsx` (Step 2, 피팅·사후관리 공통)

### 6.3 기존 컴포넌트 영향

| 컴포넌트 | 영향 | 수정 |
|---|---|---|
| `app/page.tsx` | 모달 inline 코드 → 분리 컴포넌트 호출 | Yes |
| `HaProtocolTab.tsx` | `visit.ha_stage` 대신 `visit.visit_purpose + fitting_session_no` 기반 템플릿 로드 | Yes |
| `TopPriorityPanel.tsx` | `stage` prop → `visit` prop 또는 resolver 통해 결정 | 작음 |
| `JourneyDashboard.tsx` | `formatVisitPurpose` 사용하여 라벨 생성 | 작음 |
| `CustomerDetail.tsx` | 방문 목록 렌더링 시 라벨 통일 | 작음 |
| `QuestionnaireWizard.tsx` | 변경 없음 | No |
| `PureToneAudiogram.tsx` | 변경 없음 | No |
| `InputTimer` | 변경 없음 | No |

---

## 7. 테스트 전략

### 7.1 단위 테스트

- `utils/visitPurposeLabel.test.ts`: `formatVisitPurpose` 4개 케이스
- `utils/protocolTemplateResolver.test.ts`: 각 purpose/session 조합별 올바른 템플릿 반환
- `utils/migrateVisits.test.ts`: 6개 마이그레이션 규칙, 재실행 시 idempotent 확인

### 7.2 컴포넌트 테스트

- `VisitPurposeModal.test.tsx`:
  - 초진 선택 시 Step 2 건너뛰고 바로 방문 정보 섹션 표시
  - 피팅 선택 시 1차~4차 버튼 표시
  - "+ 추가" 클릭 시 5차 버튼 생성
  - 사후관리 선택 시 3M/6M/12M 버튼 표시, custom input 존재
  - AS 선택 시 Step 2 건너뛰기
  - 저장 시 올바른 `Visit` 객체 생성

### 7.3 회귀 테스트

- 기존 40개 테스트 모두 통과 유지
- 마이그레이션 후 `JourneyDashboard` / `HaProtocolTab` 렌더링 정상

---

## 8. 완료 기준

- [ ] 기존 "새 상담 시작" 모달이 위 3단계 구조로 교체됨
- [ ] 데이터 모델 `VisitPurpose`, `fitting_session_no`, `aftercare_month` 추가
- [ ] 7개 템플릿(기존 3 + 신규 4) 전부 정의되고 `resolveTemplate`으로 매핑
- [ ] 마이그레이션 스크립트 구현 + 구 필드 일시 보존
- [ ] HA Top 5, Journey Dashboard, CustomerDetail이 새 라벨/템플릿 사용
- [ ] 신규 단위/컴포넌트 테스트 10+ 케이스 추가
- [ ] 전체 테스트 통과 (`npm test`)
- [ ] 프로덕션 빌드 성공 (`npm run build`)
- [ ] Vercel Preview에서 수동 스모크:
  - [ ] 초진 상담 방문 생성 → INITIAL 템플릿 노출
  - [ ] 보청기 피팅 5차 추가 생성 → FITTING_EXTRA 템플릿 노출
  - [ ] 사후관리 24개월 custom 입력 → AFTERCARE_ROUTINE 템플릿 노출
  - [ ] AS 방문 생성 → SERVICE 템플릿 노출
  - [ ] 기존 데이터(마이그레이션된) 정상 표시

---

## 9. 제외 범위 (YAGNI)

다음은 본 스펙에 포함하지 않는다. 필요 시 후속 스펙으로 분리.

- **신규 유형 자체 추가 UI** (관리자 화면에서 VisitPurpose 동적 추가)
- **템플릿 버전 관리** (한 번 저장된 세션에 템플릿 변경 이력)
- **고급 사후관리 알림** (3M/6M 자동 예약 제안)
- **반품/교환 전용 화면** (현재는 SERVICE + 메모로 처리)
- **다국어 라벨**

---

## 10. 참고

- 연관 스펙: `docs/superpowers/specs/2026-04-13-jinsim-crm-enhancement-design.md`, `docs/superpowers/specs/2026-04-14-visit-manager-ux-redesign.md`
- 연관 플랜: `docs/superpowers/plans/2026-04-14-audiologist-workflow-ux.md`
- 선행 브랜치: `feat/visit-manager-ux-redesign`
