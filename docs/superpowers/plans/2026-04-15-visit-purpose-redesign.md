# Visit Purpose Redesign (v3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 진심히어링 CRM의 "새 상담/프로토콜 시작" 카테고리를 방문 목적 × 단계 × 구매 사이클 3차원 모델로 재설계하고, 인터뷰에서 발견된 7가지 구조적 누락(SERVICE 과포화, 청력재검 귀속, AFTERCARE 단일 템플릿, purpose[] 중복, 마이그레이션 휴리스틱, 복수 목적 방문, 재구매 사이클)을 모두 해소한다.

**Architecture:** 기존 2축 설계서(`2026-04-14-visit-purpose-redesign-design.md`)를 베이스라인으로 두고, 시드 YAML(`2026-04-15-visit-purpose-redesign-seed.yaml`)의 7개 Gap 결정을 스키마/마이그레이션/템플릿/UI 4개 레이어에 반영한다. 기존 localStorage 데이터는 MIGRATION_VERSION을 3으로 올려 1회성 신호 기반 재분류한다. 구 필드(`visit_type`, `ha_stage`)는 이번 릴리즈에서 deprecated로 유지한다.

**Tech Stack:** Next.js 15 + React 19 + TypeScript, Vitest + Testing Library, localStorage 영속성, Vercel 배포.

**Baseline files:**
- Spec: `docs/superpowers/specs/2026-04-14-visit-purpose-redesign-design.md`
- Seed: `docs/superpowers/specs/2026-04-15-visit-purpose-redesign-seed.yaml`
- 현재 타입: `types.ts:26-42`
- 템플릿 소스: `data/haProtocolTemplates.ts`

---

## Task 1: 타입 스키마 확장 (VisitPurpose 5개 + 신규 필드)

**Files:**
- Modify: `types.ts:26-42`

시드 온톨로지 §ontology_schema 반영. G1/G3/G4/G6/G7 해소.

- [ ] **Step 1: 테스트 작성 — 신규 Visit 타입 컴파일 보장**

Create: `utils/visitTypes.test.ts`

```ts
import { describe, it, expectTypeOf } from 'vitest';
import type { Visit, VisitPurpose, AftercareBucket } from '../types';

describe('Visit schema v3', () => {
  it('VisitPurpose has 5 members', () => {
    const values: VisitPurpose[] = ['INITIAL', 'FITTING', 'AFTERCARE', 'SERVICE', 'REFUND_EXCHANGE'];
    expectTypeOf(values).toEqualTypeOf<VisitPurpose[]>();
  });
  it('AftercareBucket has 4 members', () => {
    const values: AftercareBucket[] = ['M3', 'M6', 'M12', 'LONGTERM'];
    expectTypeOf(values).toEqualTypeOf<AftercareBucket[]>();
  });
  it('Visit includes purchase_cycle_id and primary_purpose_memo', () => {
    const v = {} as Visit;
    expectTypeOf(v.purchase_cycle_id).toEqualTypeOf<string | undefined>();
    expectTypeOf(v.primary_purpose_memo).toEqualTypeOf<string | undefined>();
    expectTypeOf(v.aftercare_bucket).toEqualTypeOf<AftercareBucket | undefined>();
  });
});
```

- [ ] **Step 2: 테스트 실행 → 실패 확인**

Run: `npx vitest run utils/visitTypes.test.ts`
Expected: FAIL (타입 정의 미존재)

- [ ] **Step 3: types.ts 업데이트**

`types.ts:26-42`를 다음으로 교체 (구 타입 유지):

```ts
export type VisitType = 'GENERAL' | 'HA_PROTOCOL';           // deprecated
export type HAStage = 'HA_1' | 'HA_2' | 'HA_3' | 'AFTERCARE_3MO'; // deprecated

export type VisitPurpose = 'INITIAL' | 'FITTING' | 'AFTERCARE' | 'SERVICE' | 'REFUND_EXCHANGE';
export type AftercareBucket = 'M3' | 'M6' | 'M12' | 'LONGTERM';

export interface Visit extends BaseRecord {
  id: string;
  customer_id: string;
  visit_date: string;
  memo?: string;
  visit_memo?: string;

  // v3 신규 (필수)
  visit_purpose: VisitPurpose;
  visit_motives: string[];                      // 기존 purpose[] 대체 (G4)
  primary_purpose_memo?: string;                // 복수 목적 방문 시 부차 목적 (G6)

  // FITTING
  fitting_session_no?: number;                  // 1 이상
  purchase_cycle_id?: string;                   // 재구매 사이클 식별자 (G7)

  // AFTERCARE
  aftercare_month?: number;                     // 3 이상
  aftercare_bucket?: AftercareBucket;           // M3/M6/M12/LONGTERM (G3)

  // deprecated (한시 유지, 마이그레이션 후에도 유지)
  purpose?: string[];                           // G4로 제거되었지만 롤백용 보존
  visit_type?: VisitType;
  ha_stage?: HAStage | null;
  ha_stage_label?: string;

  recommended_next_visit_date?: string | null;
  next_visit_rule?: 'WEEKLY' | '3MONTH' | null;
  protocol_version?: string;
}
```

- [ ] **Step 4: 테스트 재실행 → 통과**

Run: `npx vitest run utils/visitTypes.test.ts`
Expected: PASS

- [ ] **Step 5: 빌드 컴파일 확인**

Run: `npx tsc --noEmit`
Expected: 0 errors (기존 `visit_type`/`ha_stage` 접근 코드는 deprecated로 남아있으므로 컴파일 통과)

- [ ] **Step 6: Commit**

```bash
git add types.ts utils/visitTypes.test.ts
git commit -m "feat(types): add VisitPurpose v3 with 5 categories and purchase_cycle_id"
```

---

## Task 2: 라벨 렌더링 헬퍼 (5카테고리 + bucket 인식)

**Files:**
- Create: `utils/visitPurposeLabel.ts`
- Test: `utils/visitPurposeLabel.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { formatVisitPurpose } from './visitPurposeLabel';
import type { Visit } from '../types';

const base = { id: '1', customer_id: 'c1', visit_date: '2026-04-15', visit_motives: [] } as unknown as Visit;

describe('formatVisitPurpose', () => {
  it('INITIAL', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'INITIAL' })).toBe('초진 상담');
  });
  it('FITTING with session', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'FITTING', fitting_session_no: 2 })).toBe('2차 피팅');
  });
  it('FITTING with purchase cycle 2 shows cycle suffix', () => {
    const v = { ...base, visit_purpose: 'FITTING' as const, fitting_session_no: 1, purchase_cycle_id: 'cycle-2' };
    expect(formatVisitPurpose(v)).toBe('1차 피팅 (재구매)');
  });
  it('AFTERCARE M3', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'AFTERCARE', aftercare_month: 3, aftercare_bucket: 'M3' })).toBe('3개월 사후관리');
  });
  it('AFTERCARE LONGTERM with month', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'AFTERCARE', aftercare_month: 24, aftercare_bucket: 'LONGTERM' })).toBe('24개월 사후관리');
  });
  it('SERVICE', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'SERVICE' })).toBe('AS · 수리');
  });
  it('REFUND_EXCHANGE', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'REFUND_EXCHANGE' })).toBe('반품 · 교환');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run utils/visitPurposeLabel.test.ts`
Expected: FAIL (파일 미존재)

- [ ] **Step 3: 구현 작성**

Create `utils/visitPurposeLabel.ts`:

```ts
import type { Visit } from '../types';

export function formatVisitPurpose(v: Visit): string {
  switch (v.visit_purpose) {
    case 'INITIAL': return '초진 상담';
    case 'FITTING': {
      const n = v.fitting_session_no;
      const base = n ? `${n}차 피팅` : '피팅';
      const isSecondCycle = v.purchase_cycle_id && v.purchase_cycle_id !== 'cycle-1';
      return isSecondCycle ? `${base} (재구매)` : base;
    }
    case 'AFTERCARE':
      return v.aftercare_month ? `${v.aftercare_month}개월 사후관리` : '사후관리';
    case 'SERVICE': return 'AS · 수리';
    case 'REFUND_EXCHANGE': return '반품 · 교환';
  }
}

export function deriveAftercareBucket(month: number): 'M3' | 'M6' | 'M12' | 'LONGTERM' {
  if (month <= 3) return 'M3';
  if (month <= 6) return 'M6';
  if (month <= 12) return 'M12';
  return 'LONGTERM';
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run utils/visitPurposeLabel.test.ts`
Expected: PASS (7 케이스)

- [ ] **Step 5: Commit**

```bash
git add utils/visitPurposeLabel.ts utils/visitPurposeLabel.test.ts
git commit -m "feat(utils): visit purpose label formatter with 5 categories and cycle-aware FITTING"
```

---

## Task 3: 신호 기반 INITIAL 분류기 (G5)

**Files:**
- Create: `utils/classifyInitialVisit.ts`
- Test: `utils/classifyInitialVisit.test.ts`

배경: 단순 "첫 방문 = INITIAL" 휴리스틱은 기존 착용자 이관 케이스를 오분류함. audiogram/문진표 존재 신호로 판정.

- [ ] **Step 1: 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { classifyGeneralVisit } from './classifyInitialVisit';

const signals = {
  hasAudiogram: false,
  hasQuestionnaire: false,
  hasHearingAidExperience: false,
  isFirstVisit: false,
};

describe('classifyGeneralVisit (signal-based)', () => {
  it('첫 방문 + 문진표 + audiogram → INITIAL', () => {
    expect(classifyGeneralVisit({ ...signals, isFirstVisit: true, hasAudiogram: true, hasQuestionnaire: true })).toBe('INITIAL');
  });
  it('첫 방문이지만 기존 착용자 신호 → SERVICE (이관 케이스)', () => {
    expect(classifyGeneralVisit({ ...signals, isFirstVisit: true, hasHearingAidExperience: true })).toBe('SERVICE');
  });
  it('재방문 + 문진표/audiogram 없음 → SERVICE', () => {
    expect(classifyGeneralVisit({ ...signals, isFirstVisit: false })).toBe('SERVICE');
  });
  it('첫 방문 + 문진표만 있음 (audiogram 없음) → INITIAL', () => {
    expect(classifyGeneralVisit({ ...signals, isFirstVisit: true, hasQuestionnaire: true })).toBe('INITIAL');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run utils/classifyInitialVisit.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `utils/classifyInitialVisit.ts`:

```ts
export interface ClassifySignals {
  hasAudiogram: boolean;
  hasQuestionnaire: boolean;
  hasHearingAidExperience: boolean;
  isFirstVisit: boolean;
}

export function classifyGeneralVisit(s: ClassifySignals): 'INITIAL' | 'SERVICE' {
  // G2: 기존 착용자가 첫 방문이어도 SERVICE/AFTERCARE로 분류
  if (s.hasHearingAidExperience) return 'SERVICE';
  if (s.isFirstVisit && (s.hasQuestionnaire || s.hasAudiogram)) return 'INITIAL';
  if (s.isFirstVisit) return 'INITIAL'; // 신호 없어도 첫 방문은 INITIAL (보수적)
  return 'SERVICE';
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run utils/classifyInitialVisit.test.ts`
Expected: PASS (4 케이스)

- [ ] **Step 5: Commit**

```bash
git add utils/classifyInitialVisit.ts utils/classifyInitialVisit.test.ts
git commit -m "feat(utils): signal-based INITIAL vs SERVICE classifier (G5)"
```

---

## Task 4: 마이그레이션 v3 (신호 기반 + purchase_cycle + aftercare_bucket)

**Files:**
- Create: `lib/migrations/visit-purpose.ts`
- Test: `lib/migrations/visit-purpose.test.ts`

시드 acceptance_criteria: "MIGRATION_VERSION 3으로 증가", "기존 Visit 레코드 전부 신 스키마로 이전 후에도 기존 UI 정상 렌더".

- [ ] **Step 1: 테스트 작성**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { migrateVisitsV3 } from './visit-purpose';
import type { Visit } from '../../types';

const mk = (over: Partial<Visit>): Visit => ({
  id: over.id ?? 'v1', customer_id: over.customer_id ?? 'c1',
  visit_date: over.visit_date ?? '2026-01-01', visit_motives: [],
  brand_id: '', center_id: '', counselor_name: '', created_at: '', updated_at: '',
  visit_purpose: undefined as unknown as Visit['visit_purpose'],
  ...over,
});

describe('migrateVisitsV3', () => {
  beforeEach(() => { localStorage.clear(); });

  it('HA_1 → FITTING session 1 + purchase_cycle_id "cycle-1"', () => {
    const input = [mk({ visit_type: 'HA_PROTOCOL', ha_stage: 'HA_1' })];
    const out = migrateVisitsV3(input, { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0].visit_purpose).toBe('FITTING');
    expect(out[0].fitting_session_no).toBe(1);
    expect(out[0].purchase_cycle_id).toBe('cycle-1');
  });

  it('AFTERCARE_3MO → aftercare_bucket M3', () => {
    const input = [mk({ visit_type: 'HA_PROTOCOL', ha_stage: 'AFTERCARE_3MO' })];
    const out = migrateVisitsV3(input, { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0].visit_purpose).toBe('AFTERCARE');
    expect(out[0].aftercare_month).toBe(3);
    expect(out[0].aftercare_bucket).toBe('M3');
  });

  it('GENERAL 첫 방문 + 문진표 존재 → INITIAL (신호 기반)', () => {
    const v = mk({ id: 'v1', visit_type: 'GENERAL' });
    const out = migrateVisitsV3([v], {
      questionnairesByVisit: new Map([['v1', true]]),
      audiogramsByVisit: new Map([['v1', true]]),
    });
    expect(out[0].visit_purpose).toBe('INITIAL');
  });

  it('GENERAL 재방문 → SERVICE', () => {
    const v1 = mk({ id: 'v1', visit_date: '2026-01-01', visit_type: 'GENERAL' });
    const v2 = mk({ id: 'v2', visit_date: '2026-02-01', visit_type: 'GENERAL' });
    const out = migrateVisitsV3([v1, v2], { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0].visit_purpose).toBe('INITIAL');
    expect(out[1].visit_purpose).toBe('SERVICE');
  });

  it('purpose[] → visit_motives 이전 (G4)', () => {
    const v = mk({ purpose: ['재검', '청소'], visit_type: 'GENERAL' });
    const out = migrateVisitsV3([v], { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0].visit_motives).toEqual(['재검', '청소']);
    expect(out[0].purpose).toEqual(['재검', '청소']); // deprecated 보존
  });

  it('이미 v3인 데이터는 idempotent', () => {
    const v = mk({ visit_purpose: 'FITTING', fitting_session_no: 2, purchase_cycle_id: 'cycle-1' });
    const out = migrateVisitsV3([v], { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0]).toEqual(v);
  });

  it('MIGRATION_VERSION을 3으로 기록', () => {
    migrateVisitsV3([], { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(localStorage.getItem('jinsim_migration_version')).toBe('3');
  });

  it('재실행 시 version 3 이상이면 변환 스킵', () => {
    localStorage.setItem('jinsim_migration_version', '3');
    const v = mk({ visit_type: 'HA_PROTOCOL', ha_stage: 'HA_1' });
    const out = migrateVisitsV3([v], { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0].visit_purpose).toBeUndefined();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/migrations/visit-purpose.test.ts`
Expected: FAIL (파일 미존재)

- [ ] **Step 3: 디렉토리 생성 + 구현 작성**

```bash
mkdir -p lib/migrations
```

Create `lib/migrations/visit-purpose.ts`:

```ts
import type { Visit } from '../../types';
import { classifyGeneralVisit } from '../../utils/classifyInitialVisit';
import { deriveAftercareBucket } from '../../utils/visitPurposeLabel';

export const MIGRATION_VERSION = 3;
const STORAGE_KEY = 'jinsim_migration_version';

export interface MigrationContext {
  questionnairesByVisit: Map<string, boolean>;
  audiogramsByVisit: Map<string, boolean>;
  hearingAidExperienceByCustomer?: Map<string, boolean>;
}

export function migrateVisitsV3(visits: Visit[], ctx: MigrationContext): Visit[] {
  const current = Number(localStorage.getItem(STORAGE_KEY) ?? '1');
  if (current >= MIGRATION_VERSION) return visits;

  const byCustomer = new Map<string, Visit[]>();
  for (const v of [...visits].sort((a, b) => a.visit_date.localeCompare(b.visit_date))) {
    const arr = byCustomer.get(v.customer_id) ?? [];
    arr.push(v);
    byCustomer.set(v.customer_id, arr);
  }

  const migrated = visits.map(v => {
    if (v.visit_purpose) return v;

    const motives = v.visit_motives?.length ? v.visit_motives : (v.purpose ?? []);

    if (v.visit_type === 'HA_PROTOCOL') {
      if (v.ha_stage === 'HA_1') return { ...v, visit_purpose: 'FITTING' as const, fitting_session_no: 1, purchase_cycle_id: 'cycle-1', visit_motives: motives };
      if (v.ha_stage === 'HA_2') return { ...v, visit_purpose: 'FITTING' as const, fitting_session_no: 2, purchase_cycle_id: 'cycle-1', visit_motives: motives };
      if (v.ha_stage === 'HA_3') return { ...v, visit_purpose: 'FITTING' as const, fitting_session_no: 3, purchase_cycle_id: 'cycle-1', visit_motives: motives };
      if (v.ha_stage === 'AFTERCARE_3MO') return { ...v, visit_purpose: 'AFTERCARE' as const, aftercare_month: 3, aftercare_bucket: deriveAftercareBucket(3), visit_motives: motives };
    }

    const isFirst = byCustomer.get(v.customer_id)?.[0]?.id === v.id;
    const result = classifyGeneralVisit({
      hasAudiogram: ctx.audiogramsByVisit.get(v.id) ?? false,
      hasQuestionnaire: ctx.questionnairesByVisit.get(v.id) ?? false,
      hasHearingAidExperience: ctx.hearingAidExperienceByCustomer?.get(v.customer_id) ?? false,
      isFirstVisit: isFirst,
    });
    return { ...v, visit_purpose: result, visit_motives: motives };
  });

  localStorage.setItem(STORAGE_KEY, String(MIGRATION_VERSION));
  return migrated;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run lib/migrations/visit-purpose.test.ts`
Expected: PASS (8 케이스)

- [ ] **Step 5: Commit**

```bash
git add lib/migrations/visit-purpose.ts lib/migrations/visit-purpose.test.ts
git commit -m "feat(migration): v3 signal-based classification with purchase_cycle_id and aftercare_bucket"
```

---

## Task 5: 템플릿 11개 정의 (AFTERCARE 4분기 + REFUND_EXCHANGE)

**Files:**
- Modify: `data/haProtocolTemplates.ts`
- Create: `lib/templates/aftercare.ts`

시드 G3: 3M/6M/12M/LONGTERM 4구간. 12M는 청력재검 필수.

- [ ] **Step 1: 테스트 작성**

Create `lib/templates/aftercare.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { AFTERCARE_TEMPLATES } from './aftercare';

describe('AFTERCARE templates', () => {
  it('4개 bucket 모두 정의', () => {
    expect(Object.keys(AFTERCARE_TEMPLATES).sort()).toEqual(['LONGTERM', 'M12', 'M3', 'M6']);
  });
  it('M12는 청력재검(pure_tone_ac) 필수 포함', () => {
    const m12 = AFTERCARE_TEMPLATES.M12;
    const retest = m12.find(i => i.key === 'pure_tone_ac');
    expect(retest).toBeDefined();
    expect(retest?.required).toBe(true);
  });
  it('M3는 청력재검 필수가 아님', () => {
    const m3 = AFTERCARE_TEMPLATES.M3;
    const retest = m3.find(i => i.key === 'pure_tone_ac');
    expect(retest?.required ?? false).toBe(false);
  });
  it('LONGTERM은 장기 착용자 이슈 체크 포함', () => {
    const lt = AFTERCARE_TEMPLATES.LONGTERM;
    expect(lt.some(i => i.key === 'device_lifecycle_review')).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run lib/templates/aftercare.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현**

```bash
mkdir -p lib/templates
```

Create `lib/templates/aftercare.ts`:

```ts
import type { ChecklistItem } from '../../data/haProtocolTemplates';
import type { AftercareBucket } from '../../types';

const BASE: ChecklistItem[] = [
  { key: 'interim_history', label: '경과 불편/만족/사용환경 변화', section: '문진/상담', required: true, defaultStatus: 'DONE' },
  { key: 'red_flags', label: '통증/분비물/갑작스런 변화', section: '문진/상담', required: false, defaultStatus: 'DONE' },
  { key: 'otoscopy', label: '이경검사', section: '귀/중이', required: true, defaultStatus: 'DONE' },
  { key: 'deep_cleaning', label: '딥 클리닝/소모품 교체', section: '기기점검', required: true, defaultStatus: 'DONE' },
  { key: 'listening_check', label: '보청기 청취점검', section: '기기점검', required: true, defaultStatus: 'DONE' },
  { key: 'fine_tuning', label: '미세조정', section: '조정', required: false, defaultStatus: 'DONE' },
  { key: 'education_refresh', label: '사용/관리 교육 리프레시', section: '교육', required: true, defaultStatus: 'DONE' },
  { key: 'schedule_next', label: '다음 방문 예약', section: '계획', required: true, defaultStatus: 'DONE' },
];

export const AFTERCARE_TEMPLATES: Record<AftercareBucket, ChecklistItem[]> = {
  M3: BASE,
  M6: [
    ...BASE,
    { key: 'satisfaction_check', label: '6개월 만족도/COSI 재평가', section: '결과평가', required: true, defaultStatus: 'DONE' },
  ],
  M12: [
    ...BASE,
    { key: 'pure_tone_ac', label: '순음청력 재검 (기도)', section: '청각검사', required: true, defaultStatus: 'DONE' },
    { key: 'pure_tone_bc', label: '골도 재검 (변동 시)', section: '청각검사', required: false, defaultStatus: 'DONE' },
    { key: 'annual_review', label: '연간 종합 리뷰 / 교체 상담', section: '결과평가', required: true, defaultStatus: 'DONE' },
  ],
  LONGTERM: [
    ...BASE,
    { key: 'pure_tone_ac', label: '순음청력 재검 (1년 주기)', section: '청각검사', required: true, defaultStatus: 'DONE' },
    { key: 'device_lifecycle_review', label: '기기 수명/교체 주기 검토', section: '기기점검', required: true, defaultStatus: 'DONE' },
    { key: 'battery_replacement_plan', label: '배터리/소모품 장기 계획', section: '기기점검', required: false, defaultStatus: 'DONE' },
  ],
};
```

- [ ] **Step 4: 기존 템플릿 파일에 INITIAL/FITTING_EXTRA/SERVICE/REFUND_EXCHANGE 추가**

Modify `data/haProtocolTemplates.ts` — 파일 끝에 export 추가:

```ts
export const INITIAL_TEMPLATE: ChecklistItem[] = [
  { key: 'intake_review', label: '문진/상담 (불편, 목표, 기대치)', section: '문진/상담', required: true, defaultStatus: 'DONE' },
  { key: 'otoscopy', label: '이경검사', section: '귀/중이', required: true, defaultStatus: 'DONE' },
  { key: 'pure_tone_ac', label: '순음청력검사 (기도)', section: '청각검사', required: true, defaultStatus: 'DONE' },
  { key: 'pure_tone_bc', label: '골도검사', section: '청각검사', required: true, defaultStatus: 'DONE' },
  { key: 'speech_srt', label: 'SRT 어음검사', section: '청각검사', required: true, defaultStatus: 'DONE' },
  { key: 'cosi_goals_set', label: 'COSI 목표 TOP3 설정', section: '문진/상담', required: false, defaultStatus: 'DONE' },
  { key: 'counseling_next_step', label: '다음 단계 상담', section: '계획', required: true, defaultStatus: 'DONE' },
];

export const FITTING_EXTRA_TEMPLATE: ChecklistItem[] = [
  { key: 'listening_check', label: '보청기 청취점검', section: '기기점검', required: true, defaultStatus: 'DONE' },
  { key: 'issue_identification', label: '불편 사항 파악', section: '조정', required: true, defaultStatus: 'DONE' },
  { key: 'fine_tuning', label: '미세조정', section: '조정', required: true, defaultStatus: 'DONE' },
  { key: 'rem_reverify', label: 'REM 재검증', section: '조정', required: false, defaultStatus: 'DONE' },
  { key: 'validation_cosi', label: 'COSI 재평가', section: '결과평가', required: true, defaultStatus: 'DONE' },
  { key: 'schedule_next', label: '다음 방문 예약', section: '계획', required: true, defaultStatus: 'DONE' },
];

export const SERVICE_TEMPLATE: ChecklistItem[] = [
  { key: 'issue_description', label: '증상/요청 기록', section: '문진/상담', required: true, defaultStatus: 'DONE' },
  { key: 'device_inspection', label: '기기 점검', section: '기기점검', required: true, defaultStatus: 'DONE' },
  { key: 'repair_or_replacement', label: '수리/교체 조치', section: '기기점검', required: true, defaultStatus: 'DONE' },
  { key: 'followup_required', label: '후속 조치 필요 여부', section: '계획', required: false, defaultStatus: 'DONE' },
];

export const REFUND_EXCHANGE_TEMPLATE: ChecklistItem[] = [
  { key: 'dissatisfaction_reason', label: '불만족 사유 청취', section: '문진/상담', required: true, defaultStatus: 'DONE' },
  { key: 'adjustment_attempt_log', label: '기 조정 이력 확인', section: '조정', required: true, defaultStatus: 'DONE' },
  { key: 'refund_exchange_decision', label: '반품/교환 결정', section: '계획', required: true, defaultStatus: 'DONE' },
  { key: 'accounting_handoff', label: '정산/회계 인계', section: '계획', required: true, defaultStatus: 'DONE' },
];
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npx vitest run lib/templates/aftercare.test.ts`
Expected: PASS (4 케이스)

- [ ] **Step 6: Commit**

```bash
git add data/haProtocolTemplates.ts lib/templates/aftercare.ts lib/templates/aftercare.test.ts
git commit -m "feat(templates): add INITIAL/FITTING_EXTRA/SERVICE/REFUND_EXCHANGE + 4-bucket AFTERCARE"
```

---

## Task 6: 템플릿 Resolver (purpose + bucket 라우팅)

**Files:**
- Create: `utils/protocolTemplateResolver.ts`
- Test: `utils/protocolTemplateResolver.test.ts`

- [ ] **Step 1: 테스트 작성**

```ts
import { describe, it, expect } from 'vitest';
import { resolveTemplate } from './protocolTemplateResolver';
import type { Visit } from '../types';

const base = { visit_motives: [] } as unknown as Visit;

describe('resolveTemplate', () => {
  it('INITIAL → INITIAL template', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'INITIAL' });
    expect(t.some(i => i.key === 'intake_review')).toBe(true);
  });
  it('FITTING 1차 → HA_1', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'FITTING', fitting_session_no: 1 });
    expect(t.some(i => i.key === 'cosi_goals_set')).toBe(true);
  });
  it('FITTING 5차 → EXTRA', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'FITTING', fitting_session_no: 5 });
    expect(t.some(i => i.key === 'issue_identification')).toBe(true);
  });
  it('AFTERCARE M12 → 청력재검 포함', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'AFTERCARE', aftercare_bucket: 'M12', aftercare_month: 12 });
    expect(t.some(i => i.key === 'pure_tone_ac' && i.required)).toBe(true);
  });
  it('AFTERCARE bucket 누락 시 month로 derive', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'AFTERCARE', aftercare_month: 24 });
    expect(t.some(i => i.key === 'device_lifecycle_review')).toBe(true);
  });
  it('SERVICE', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'SERVICE' });
    expect(t.some(i => i.key === 'device_inspection')).toBe(true);
  });
  it('REFUND_EXCHANGE', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'REFUND_EXCHANGE' });
    expect(t.some(i => i.key === 'refund_exchange_decision')).toBe(true);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run utils/protocolTemplateResolver.test.ts`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `utils/protocolTemplateResolver.ts`:

```ts
import type { Visit } from '../types';
import {
  HA_PROTOCOL_TEMPLATES, INITIAL_TEMPLATE, FITTING_EXTRA_TEMPLATE,
  SERVICE_TEMPLATE, REFUND_EXCHANGE_TEMPLATE, type ChecklistItem,
} from '../data/haProtocolTemplates';
import { AFTERCARE_TEMPLATES } from '../lib/templates/aftercare';
import { deriveAftercareBucket } from './visitPurposeLabel';

export function resolveTemplate(v: Visit): ChecklistItem[] {
  switch (v.visit_purpose) {
    case 'INITIAL': return INITIAL_TEMPLATE;
    case 'FITTING': {
      const n = v.fitting_session_no ?? 1;
      if (n === 1) return HA_PROTOCOL_TEMPLATES.HA_1;
      if (n === 2) return HA_PROTOCOL_TEMPLATES.HA_2;
      if (n === 3) return HA_PROTOCOL_TEMPLATES.HA_3;
      return FITTING_EXTRA_TEMPLATE;
    }
    case 'AFTERCARE': {
      const bucket = v.aftercare_bucket ?? deriveAftercareBucket(v.aftercare_month ?? 3);
      return AFTERCARE_TEMPLATES[bucket];
    }
    case 'SERVICE': return SERVICE_TEMPLATE;
    case 'REFUND_EXCHANGE': return REFUND_EXCHANGE_TEMPLATE;
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run utils/protocolTemplateResolver.test.ts`
Expected: PASS (7 케이스)

- [ ] **Step 5: Commit**

```bash
git add utils/protocolTemplateResolver.ts utils/protocolTemplateResolver.test.ts
git commit -m "feat(resolver): template routing by purpose and aftercare bucket"
```

---

## Task 7: PurposeGrid UI (5 카테고리)

**Files:**
- Create: `components/visit/PurposeGrid.tsx`
- Test: `components/visit/PurposeGrid.test.tsx`

- [ ] **Step 1: 테스트 작성**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PurposeGrid } from './PurposeGrid';

describe('PurposeGrid', () => {
  it('5개 카테고리 버튼 렌더', () => {
    render(<PurposeGrid value={null} onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /초진 상담/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /보청기 피팅/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /정기 사후관리/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /AS · 수리/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /반품 · 교환/ })).toBeInTheDocument();
  });
  it('클릭 시 onChange 호출', () => {
    const fn = vi.fn();
    render(<PurposeGrid value={null} onChange={fn} />);
    fireEvent.click(screen.getByRole('button', { name: /반품 · 교환/ }));
    expect(fn).toHaveBeenCalledWith('REFUND_EXCHANGE');
  });
  it('선택된 버튼은 aria-pressed=true', () => {
    render(<PurposeGrid value="FITTING" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /보청기 피팅/ })).toHaveAttribute('aria-pressed', 'true');
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run components/visit/PurposeGrid.test.tsx`
Expected: FAIL

- [ ] **Step 3: 구현**

```bash
mkdir -p components/visit
```

Create `components/visit/PurposeGrid.tsx`:

```tsx
'use client';
import type { VisitPurpose } from '../../types';

const OPTIONS: { value: VisitPurpose; label: string }[] = [
  { value: 'INITIAL', label: '초진 상담' },
  { value: 'FITTING', label: '보청기 피팅' },
  { value: 'AFTERCARE', label: '정기 사후관리' },
  { value: 'SERVICE', label: 'AS · 수리' },
  { value: 'REFUND_EXCHANGE', label: '반품 · 교환' },
];

export function PurposeGrid({ value, onChange }: { value: VisitPurpose | null; onChange: (v: VisitPurpose) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="방문 목적">
      {OPTIONS.map(o => (
        <button
          key={o.value}
          type="button"
          aria-pressed={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-4 py-3 rounded border ${value === o.value ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-gray-300'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run components/visit/PurposeGrid.test.tsx`
Expected: PASS (3 케이스)

- [ ] **Step 5: Commit**

```bash
git add components/visit/PurposeGrid.tsx components/visit/PurposeGrid.test.tsx
git commit -m "feat(ui): PurposeGrid with 5 categories including REFUND_EXCHANGE"
```

---

## Task 8: StageRowExtensible (FITTING 차수 + AFTERCARE bucket)

**Files:**
- Create: `components/visit/StageRowExtensible.tsx`
- Test: `components/visit/StageRowExtensible.test.tsx`

- [ ] **Step 1: 테스트 작성**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StageRowExtensible } from './StageRowExtensible';

describe('StageRowExtensible — FITTING', () => {
  it('1~4차 버튼 표시', () => {
    render(<StageRowExtensible mode="fitting" value={null} onChange={() => {}} />);
    ['1차', '2차', '3차', '4차'].forEach(l => expect(screen.getByRole('button', { name: l })).toBeInTheDocument());
  });
  it('+ 추가 클릭 시 5차 생성', () => {
    const { rerender } = render(<StageRowExtensible mode="fitting" value={null} onChange={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ 추가/ }));
    rerender(<StageRowExtensible mode="fitting" value={null} onChange={() => {}} />);
    expect(screen.queryByRole('button', { name: '5차' })).toBeInTheDocument();
  });
});

describe('StageRowExtensible — AFTERCARE', () => {
  it('M3/M6/M12/LONGTERM 버튼 표시', () => {
    render(<StageRowExtensible mode="aftercare" value={null} onChange={() => {}} />);
    ['3개월', '6개월', '12개월', '장기(24+)'].forEach(l =>
      expect(screen.getByRole('button', { name: l })).toBeInTheDocument());
  });
  it('LONGTERM 선택 시 custom input 노출', () => {
    render(<StageRowExtensible mode="aftercare" value="LONGTERM" onChange={() => {}} />);
    expect(screen.getByPlaceholderText(/직접 입력/)).toBeInTheDocument();
  });
  it('custom input 값 변경 시 onChange에 bucket+month 전달', () => {
    const fn = vi.fn();
    render(<StageRowExtensible mode="aftercare" value="LONGTERM" onChange={fn} />);
    fireEvent.change(screen.getByPlaceholderText(/직접 입력/), { target: { value: '36' } });
    expect(fn).toHaveBeenCalledWith({ bucket: 'LONGTERM', month: 36 });
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run components/visit/StageRowExtensible.test.tsx`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `components/visit/StageRowExtensible.tsx`:

```tsx
'use client';
import { useState } from 'react';
import type { AftercareBucket } from '../../types';

type FittingChange = { session: number };
type AftercareChange = { bucket: AftercareBucket; month: number };

interface FittingProps {
  mode: 'fitting';
  value: number | null;
  onChange: (c: FittingChange) => void;
}
interface AftercareProps {
  mode: 'aftercare';
  value: AftercareBucket | null;
  onChange: (c: AftercareChange) => void;
}

export function StageRowExtensible(props: FittingProps | AftercareProps) {
  if (props.mode === 'fitting') return <FittingRow {...props} />;
  return <AftercareRow {...props} />;
}

function FittingRow({ value, onChange }: FittingProps) {
  const [maxSession, setMaxSession] = useState(4);
  return (
    <div className="flex gap-2 flex-wrap">
      {Array.from({ length: maxSession }, (_, i) => i + 1).map(n => (
        <button key={n} type="button"
          aria-pressed={value === n}
          onClick={() => onChange({ session: n })}
          className={`px-3 py-2 border rounded ${value === n ? 'bg-blue-600 text-white' : ''}`}>
          {n}차
        </button>
      ))}
      <button type="button" onClick={() => setMaxSession(m => m + 1)} className="px-3 py-2 border rounded border-dashed">+ 추가</button>
    </div>
  );
}

function AftercareRow({ value, onChange }: AftercareProps) {
  const BUCKETS: { bucket: AftercareBucket; label: string; defaultMonth: number }[] = [
    { bucket: 'M3', label: '3개월', defaultMonth: 3 },
    { bucket: 'M6', label: '6개월', defaultMonth: 6 },
    { bucket: 'M12', label: '12개월', defaultMonth: 12 },
    { bucket: 'LONGTERM', label: '장기(24+)', defaultMonth: 24 },
  ];
  const [customMonth, setCustomMonth] = useState<number>(24);
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {BUCKETS.map(b => (
          <button key={b.bucket} type="button"
            aria-pressed={value === b.bucket}
            onClick={() => onChange({ bucket: b.bucket, month: b.defaultMonth })}
            className={`px-3 py-2 border rounded ${value === b.bucket ? 'bg-blue-600 text-white' : ''}`}>
            {b.label}
          </button>
        ))}
      </div>
      {value === 'LONGTERM' && (
        <input type="number" min={13} placeholder="직접 입력 (개월)"
          value={customMonth}
          onChange={e => {
            const m = Number(e.target.value);
            setCustomMonth(m);
            onChange({ bucket: 'LONGTERM', month: m });
          }}
          className="px-2 py-1 border rounded w-40" />
      )}
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run components/visit/StageRowExtensible.test.tsx`
Expected: PASS (5 케이스)

- [ ] **Step 5: Commit**

```bash
git add components/visit/StageRowExtensible.tsx components/visit/StageRowExtensible.test.tsx
git commit -m "feat(ui): StageRowExtensible with fitting + aftercare bucket modes"
```

---

## Task 9: VisitPurposeModal — 복수목적 primary+memo + 재구매 토글

**Files:**
- Create: `components/visit/VisitPurposeModal.tsx`
- Test: `components/visit/VisitPurposeModal.test.tsx`

시드 G6 (복수 목적 primary 1개 강제 + memo) + G7 (FITTING "신규 구매 사이클" 토글).

- [ ] **Step 1: 테스트 작성**

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VisitPurposeModal } from './VisitPurposeModal';

describe('VisitPurposeModal', () => {
  it('FITTING 선택 시 "신규 구매 사이클" 토글 노출', () => {
    render(<VisitPurposeModal customerId="c1" existingPurchaseCycles={['cycle-1']} onSubmit={() => {}} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /보청기 피팅/ }));
    expect(screen.getByLabelText(/신규 구매 사이클/)).toBeInTheDocument();
  });
  it('신규 구매 사이클 토글 on → purchase_cycle_id=cycle-2, session=1', () => {
    const fn = vi.fn();
    render(<VisitPurposeModal customerId="c1" existingPurchaseCycles={['cycle-1']} onSubmit={fn} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /보청기 피팅/ }));
    fireEvent.click(screen.getByLabelText(/신규 구매 사이클/));
    fireEvent.click(screen.getByRole('button', { name: '1차' }));
    fireEvent.click(screen.getByRole('button', { name: /상담 시작/ }));
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      visit_purpose: 'FITTING',
      fitting_session_no: 1,
      purchase_cycle_id: 'cycle-2',
    }));
  });
  it('부차 목적 memo 입력 시 primary_purpose_memo로 저장', () => {
    const fn = vi.fn();
    render(<VisitPurposeModal customerId="c1" existingPurchaseCycles={[]} onSubmit={fn} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /AS · 수리/ }));
    fireEvent.change(screen.getByPlaceholderText(/부차 목적/), { target: { value: '청력재검 겸' } });
    fireEvent.click(screen.getByRole('button', { name: /상담 시작/ }));
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({
      visit_purpose: 'SERVICE',
      primary_purpose_memo: '청력재검 겸',
    }));
  });
  it('REFUND_EXCHANGE 선택 시 단계 필드 없이 저장', () => {
    const fn = vi.fn();
    render(<VisitPurposeModal customerId="c1" existingPurchaseCycles={[]} onSubmit={fn} onCancel={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /반품 · 교환/ }));
    fireEvent.click(screen.getByRole('button', { name: /상담 시작/ }));
    expect(fn).toHaveBeenCalledWith(expect.objectContaining({ visit_purpose: 'REFUND_EXCHANGE' }));
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `npx vitest run components/visit/VisitPurposeModal.test.tsx`
Expected: FAIL

- [ ] **Step 3: 구현**

Create `components/visit/VisitPurposeModal.tsx`:

```tsx
'use client';
import { useState } from 'react';
import type { VisitPurpose, AftercareBucket, Visit } from '../../types';
import { PurposeGrid } from './PurposeGrid';
import { StageRowExtensible } from './StageRowExtensible';

export type NewVisitPayload = Partial<Visit> & { visit_purpose: VisitPurpose };

interface Props {
  customerId: string;
  existingPurchaseCycles: string[];
  onSubmit: (v: NewVisitPayload) => void;
  onCancel: () => void;
}

export function VisitPurposeModal({ customerId, existingPurchaseCycles, onSubmit, onCancel }: Props) {
  const [purpose, setPurpose] = useState<VisitPurpose | null>(null);
  const [fittingSession, setFittingSession] = useState<number | null>(null);
  const [aftercareBucket, setAftercareBucket] = useState<AftercareBucket | null>(null);
  const [aftercareMonth, setAftercareMonth] = useState<number | null>(null);
  const [newCycle, setNewCycle] = useState(false);
  const [memo, setMemo] = useState('');
  const [visitDate, setVisitDate] = useState(new Date().toISOString().slice(0, 10));

  const handleSubmit = () => {
    if (!purpose) return;
    const base: NewVisitPayload = {
      customer_id: customerId,
      visit_date: visitDate,
      visit_purpose: purpose,
      visit_motives: [],
      primary_purpose_memo: memo || undefined,
    };
    if (purpose === 'FITTING') {
      const nextCycleIdx = existingPurchaseCycles.length + 1;
      const cycleId = newCycle ? `cycle-${nextCycleIdx}` : (existingPurchaseCycles[existingPurchaseCycles.length - 1] ?? 'cycle-1');
      base.fitting_session_no = newCycle ? 1 : (fittingSession ?? 1);
      base.purchase_cycle_id = cycleId;
    }
    if (purpose === 'AFTERCARE') {
      base.aftercare_bucket = aftercareBucket ?? 'M3';
      base.aftercare_month = aftercareMonth ?? 3;
    }
    onSubmit(base);
  };

  return (
    <div className="bg-white p-6 rounded-lg max-w-2xl space-y-4">
      <h2 className="text-lg font-bold">새 상담/프로토콜 시작</h2>
      <section>
        <label className="block mb-2 font-semibold">방문 목적</label>
        <PurposeGrid value={purpose} onChange={setPurpose} />
      </section>
      {purpose === 'FITTING' && (
        <section>
          <label className="block mb-2 font-semibold">피팅 차수</label>
          <label className="flex items-center gap-2 mb-2">
            <input type="checkbox" checked={newCycle} onChange={e => setNewCycle(e.target.checked)} />
            신규 구매 사이클 (재구매)
          </label>
          {!newCycle && (
            <StageRowExtensible mode="fitting" value={fittingSession}
              onChange={c => setFittingSession(c.session)} />
          )}
        </section>
      )}
      {purpose === 'AFTERCARE' && (
        <section>
          <label className="block mb-2 font-semibold">사후관리 시점</label>
          <StageRowExtensible mode="aftercare" value={aftercareBucket}
            onChange={c => { setAftercareBucket(c.bucket); setAftercareMonth(c.month); }} />
        </section>
      )}
      <section>
        <label className="block mb-1 font-semibold">방문 날짜</label>
        <input type="date" value={visitDate} onChange={e => setVisitDate(e.target.value)}
          className="border rounded px-2 py-1" />
      </section>
      <section>
        <label className="block mb-1 font-semibold">부차 목적 / 메모</label>
        <textarea placeholder="부차 목적 (예: 청력재검 겸)"
          value={memo} onChange={e => setMemo(e.target.value)}
          className="w-full border rounded p-2" rows={2} />
      </section>
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 border rounded">취소</button>
        <button type="button" onClick={handleSubmit} disabled={!purpose}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50">
          상담 시작 →
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npx vitest run components/visit/VisitPurposeModal.test.tsx`
Expected: PASS (4 케이스)

- [ ] **Step 5: Commit**

```bash
git add components/visit/VisitPurposeModal.tsx components/visit/VisitPurposeModal.test.tsx
git commit -m "feat(ui): VisitPurposeModal with primary_purpose_memo and purchase cycle toggle"
```

---

## Task 10: app/page.tsx 통합 + 마이그레이션 훅

**Files:**
- Modify: `app/page.tsx` (기존 inline 모달 제거 및 교체)

- [ ] **Step 1: app/page.tsx의 기존 방문 모달 섹션 식별**

Run: `grep -n "새 상담\|visit_type\|VisitType" app/page.tsx`

- [ ] **Step 2: 마이그레이션 호출 삽입**

`app/page.tsx`에서 localStorage에서 visits를 읽는 로직 직후에 추가:

```tsx
import { migrateVisitsV3 } from '../lib/migrations/visit-purpose';
// ...
const raw = JSON.parse(localStorage.getItem('jinsim_visits') ?? '[]') as Visit[];
const questionnaires = JSON.parse(localStorage.getItem('jinsim_questionnaires') ?? '[]');
const audiograms = JSON.parse(localStorage.getItem('jinsim_audiograms') ?? '[]');
const qMap = new Map<string, boolean>(questionnaires.map((q: any) => [q.visit_id, true]));
const aMap = new Map<string, boolean>(audiograms.map((a: any) => [a.visit_id, true]));
const customers = JSON.parse(localStorage.getItem('jinsim_customers') ?? '[]');
const hexpMap = new Map<string, boolean>(customers.map((c: any) => [c.id, c.hearing_aid_experience === 'Y']));
const migrated = migrateVisitsV3(raw, {
  questionnairesByVisit: qMap, audiogramsByVisit: aMap,
  hearingAidExperienceByCustomer: hexpMap,
});
if (migrated !== raw) localStorage.setItem('jinsim_visits', JSON.stringify(migrated));
```

- [ ] **Step 3: 기존 inline 모달 → VisitPurposeModal 교체**

`app/page.tsx`에서 새 방문 생성 모달 JSX 블록을 제거하고 다음으로 교체:

```tsx
{showNewVisitModal && selectedCustomer && (
  <VisitPurposeModal
    customerId={selectedCustomer.id}
    existingPurchaseCycles={
      Array.from(new Set(visits.filter(v => v.customer_id === selectedCustomer.id && v.purchase_cycle_id).map(v => v.purchase_cycle_id!)))
    }
    onSubmit={(payload) => {
      const newVisit: Visit = { ...baseVisitDefaults, ...payload, id: crypto.randomUUID() } as Visit;
      setVisits([...visits, newVisit]);
      setShowNewVisitModal(false);
    }}
    onCancel={() => setShowNewVisitModal(false)}
  />
)}
```

- [ ] **Step 4: 빌드 확인**

Run: `npm run build`
Expected: 빌드 성공. 기존 `visit.visit_type` 접근 코드에서 타입 오류 발생 시, 해당 위치를 `visit.visit_purpose`로 치환하거나 옵셔널 체이닝 적용.

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx
git commit -m "feat(app): wire migration v3 and VisitPurposeModal into new-visit flow"
```

---

## Task 11: 기존 컴포넌트 라벨 업데이트

**Files:**
- Modify: `components/HaProtocolTab.tsx`
- Modify: `components/journey/JourneyDashboard.tsx` (있다면)
- Modify: `components/CustomerDetail.tsx`
- Modify: `components/VisitManager.tsx`

- [ ] **Step 1: HaProtocolTab 템플릿 로드 변경**

`components/HaProtocolTab.tsx`에서 `HA_PROTOCOL_TEMPLATES[visit.ha_stage]` 형태를 `resolveTemplate(visit)`로 치환.

```tsx
import { resolveTemplate } from '../utils/protocolTemplateResolver';
// ...
const template = resolveTemplate(visit);
```

- [ ] **Step 2: 라벨 사용처 치환**

방문 라벨을 렌더링하는 모든 파일에서:

```tsx
import { formatVisitPurpose } from '../utils/visitPurposeLabel';
// ...
<span>{formatVisitPurpose(visit)}</span>
```

Run: `grep -rn "ha_stage_label\|visit.purpose\[" components/ app/`

각 매칭 위치를 `formatVisitPurpose(visit)`로 교체.

- [ ] **Step 3: 빌드 + 타입 확인**

Run: `npx tsc --noEmit && npm run build`
Expected: 0 에러

- [ ] **Step 4: 기존 회귀 테스트 실행**

Run: `npm test`
Expected: 전체 PASS (기존 40+ 케이스 + 신규 30+ 케이스)

- [ ] **Step 5: Commit**

```bash
git add components/
git commit -m "refactor(components): use formatVisitPurpose and resolveTemplate consistently"
```

---

## Task 12: 수동 스모크 테스트 + 배포 검증

시드 exit_conditions 검증.

- [ ] **Step 1: 로컬 dev 서버 시작**

Run: `npm run dev`

- [ ] **Step 2: 스모크 체크리스트**

브라우저에서 `http://localhost:3000`:

- [ ] 5개 카테고리 버튼(초진/피팅/사후관리/AS/반품) 모두 노출
- [ ] 초진 상담 방문 생성 → INITIAL 템플릿 (intake_review 포함)
- [ ] 피팅 5차(+추가) 생성 → FITTING_EXTRA 템플릿
- [ ] 사후관리 12개월 선택 → AFTERCARE_M12 템플릿에 `pure_tone_ac` required 확인
- [ ] 사후관리 LONGTERM → 24 입력 → `device_lifecycle_review` 표시
- [ ] AS 방문에 memo "청력재검 겸" 입력 → `primary_purpose_memo` 저장 확인 (DevTools localStorage)
- [ ] 반품 · 교환 방문 → REFUND_EXCHANGE 템플릿
- [ ] 같은 고객에게 FITTING "신규 구매 사이클" 토글 체크 → `purchase_cycle_id = cycle-2`, session=1
- [ ] 기존 localStorage 데이터(HA_1~AFTERCARE_3MO) 모두 신 라벨로 렌더
- [ ] localStorage의 `jinsim_migration_version === "3"`

- [ ] **Step 3: Vercel 프리뷰 배포**

```bash
git push origin HEAD
```

- [ ] **Step 4: Vercel Preview URL에서 Step 2 체크리스트 재실행**

- [ ] **Step 5: Commit (필요 시 hotfix)**

문제 없으면 PR 전환 준비 완료.

---

## 완료 기준 (시드 exit_conditions 매핑)

- [ ] 5개 최상위 카테고리 UI 노출 (Task 7)
- [ ] 11개 AFTERCARE 포함 템플릿 배포 (Task 5, 6)
- [ ] 기존 localStorage 데이터 신 스키마로 전환 (Task 4, 10)
- [ ] 반품/교환 별도 집계 가능 (Task 5, 7) — 대시보드 집계 UI는 본 스펙 범위 외
- [ ] 재구매 고객 purchase_cycle_id 정상 발급 (Task 9, 스모크 Step 2)

---

## 제외 범위 (YAGNI)

- 관리자용 VisitPurpose 동적 추가 UI
- 반품/교환 전용 대시보드 위젯 (본 스펙은 데이터 분리까지)
- deprecated 필드(`visit_type`, `ha_stage`) 물리적 제거 — 다음 릴리즈
- 다중 기기 localStorage 동기화 (시드 unresolved_minor_axes)
