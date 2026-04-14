# Audiologist Workflow UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 진심보청기 CRM을 청능사 실무 흐름에 맞게 개편 — 문진 위저드화, 오디오그램 클릭 입력, HA 프로토콜 Top 3-5 우선 노출, 환자 여정 대시보드로 광범위한 데이터를 빠르게 입력·조회한다.

**Architecture:** 기존 Next.js 15 / React 19 / Tailwind / localStorage 아키텍처를 유지하고, `types.ts` 도메인 타입은 불변. 각 컴포넌트는 프레젠테이션 분리(위저드 스텝, 차트 인터랙션 핸들러, 우선순위 필터, 여정 타임라인)를 통해 기존 모놀리식 파일을 건드리지 않고 새 UI 계층을 추가. `utils/completionUtils.ts`에 완료/우선순위 계산 로직을 집중.

**Tech Stack:** Next.js 15.1.3, React 19, TypeScript 5.8, Tailwind 3.4, Recharts 3.6, Vitest(신규), lucide-react

**Seed**: `docs/seed.yaml` (ambiguity_score=0.18, brownfield)

**Phases**:
- Phase 0 — 테스트 인프라
- Phase 1 — 문진 위저드 (Wizard)
- Phase 2 — 오디오그램 클릭 입력
- Phase 3 — HA 프로토콜 Top 3-5
- Phase 4 — 환자 여정 대시보드
- Phase 5 — 측정·검증

각 Phase는 독립 배포 가능. 필요 시 Phase별 별도 PR.

---

## Phase 0 — Test Infrastructure

### Task 0.1: Install Vitest + React Testing Library

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `vitest.setup.ts`

- [ ] **Step 1: Install dev dependencies**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @types/node
```

Expected: `package.json`에 devDependencies 추가됨, 에러 없음.

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
});
```

- [ ] **Step 3: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
  localStorage.clear();
});
```

- [ ] **Step 4: Add test scripts to `package.json`**

Modify `scripts` block in `package.json`:

```json
"scripts": {
  "dev": "next dev -p 3006",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:ui": "vitest --ui"
}
```

- [ ] **Step 5: Run test suite to confirm empty pass**

Run: `npm test`
Expected: `No test files found` (exit 0) — Vitest bootstraps correctly.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json vitest.config.ts vitest.setup.ts
git commit -m "chore: add vitest + RTL test infrastructure"
```

---

## Phase 1 — Questionnaire Wizard

**목표**: `QuestionnaireForm.tsx`(766줄 단일 스크롤)을 4-스텝 위저드(기본정보 → 병력 → 난청평가 → COSI)로 교체. 기존 `types.ts`의 `QuestionnaireData` 스키마는 불변.

### Task 1.1: Questionnaire step validation utility

**Files:**
- Create: `utils/questionnaireSteps.ts`
- Create: `utils/questionnaireSteps.test.ts`

- [ ] **Step 1: Write failing tests for step definitions + validation**

Create `utils/questionnaireSteps.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  QUESTIONNAIRE_STEPS,
  isStepComplete,
  firstIncompleteStep,
} from './questionnaireSteps';
import type { QuestionnaireData } from '../types';

const blank = {} as QuestionnaireData;

describe('QUESTIONNAIRE_STEPS', () => {
  it('has 4 ordered steps', () => {
    expect(QUESTIONNAIRE_STEPS.map(s => s.id)).toEqual([
      'basic', 'history', 'hearing', 'cosi',
    ]);
  });
});

describe('isStepComplete', () => {
  it('basic step requires name + birthDate', () => {
    expect(isStepComplete('basic', blank)).toBe(false);
    expect(isStepComplete('basic', { ...blank, name: '홍길동', birthDate: '1960-01-01' } as any)).toBe(true);
  });

  it('hearing step requires chiefComplaint OR motivations', () => {
    expect(isStepComplete('hearing', blank)).toBe(false);
    expect(isStepComplete('hearing', { ...blank, chiefComplaint: '잘 안 들림' } as any)).toBe(true);
    expect(isStepComplete('hearing', { ...blank, motivations: ['대화'] } as any)).toBe(true);
  });
});

describe('firstIncompleteStep', () => {
  it('returns "basic" for empty data', () => {
    expect(firstIncompleteStep(blank)).toBe('basic');
  });
});
```

- [ ] **Step 2: Run test, confirm failure**

Run: `npm test -- utils/questionnaireSteps.test.ts`
Expected: FAIL — `Cannot find module './questionnaireSteps'`.

- [ ] **Step 3: Read `types.ts` to confirm `QuestionnaireData` field names**

Run: `grep -n "QuestionnaireData" C:/Users/oohea/jinsim-hearing-crm/types.ts`
Action: Record exact field names for `name`, `birthDate`, `chiefComplaint`, `motivations`, `medicalHistory`, `cosiGoals`. Adjust test if names differ.

- [ ] **Step 4: Implement `utils/questionnaireSteps.ts`**

```ts
import type { QuestionnaireData } from '../types';

export type QuestionnaireStepId = 'basic' | 'history' | 'hearing' | 'cosi';

export interface QuestionnaireStepDef {
  id: QuestionnaireStepId;
  label: string;
  description: string;
}

export const QUESTIONNAIRE_STEPS: QuestionnaireStepDef[] = [
  { id: 'basic',   label: '기본 정보', description: '이름·생년월일·연락처' },
  { id: 'history', label: '병력',     description: '과거 이력·약물·수술' },
  { id: 'hearing', label: '난청 평가', description: '주호소·동기·가족력' },
  { id: 'cosi',    label: 'COSI',     description: '개인 목표 3-5개' },
];

export function isStepComplete(
  stepId: QuestionnaireStepId,
  data: Partial<QuestionnaireData>
): boolean {
  switch (stepId) {
    case 'basic':
      return Boolean(data.name && data.birthDate);
    case 'history':
      // 병력은 선택사항: 명시적 "없음" 플래그 또는 최소 한 항목
      return data.medicalHistoryReviewed === true
        || Boolean(data.medicalHistory && data.medicalHistory.length > 0);
    case 'hearing':
      return Boolean(data.chiefComplaint)
        || Boolean(data.motivations && data.motivations.length > 0);
    case 'cosi':
      return Boolean(data.cosiGoals && data.cosiGoals.length > 0);
  }
}

export function firstIncompleteStep(
  data: Partial<QuestionnaireData>
): QuestionnaireStepId {
  for (const step of QUESTIONNAIRE_STEPS) {
    if (!isStepComplete(step.id, data)) return step.id;
  }
  return 'cosi';
}
```

**Note:** `medicalHistoryReviewed` field may need to be added to `QuestionnaireData` in `types.ts`. If so, add it as `medicalHistoryReviewed?: boolean`. Verify type names in `types.ts:1-573` before committing.

- [ ] **Step 5: Run tests**

Run: `npm test -- utils/questionnaireSteps.test.ts`
Expected: PASS (all 5 assertions).

- [ ] **Step 6: Commit**

```bash
git add utils/questionnaireSteps.ts utils/questionnaireSteps.test.ts types.ts
git commit -m "feat(questionnaire): add wizard step definitions + validation"
```

### Task 1.2: WizardStepper presentation component

**Files:**
- Create: `components/wizard/WizardStepper.tsx`
- Create: `components/wizard/WizardStepper.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WizardStepper } from './WizardStepper';
import { QUESTIONNAIRE_STEPS } from '../../utils/questionnaireSteps';

describe('WizardStepper', () => {
  it('renders all steps with labels', () => {
    render(
      <WizardStepper
        steps={QUESTIONNAIRE_STEPS}
        currentId="history"
        completedIds={['basic']}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByText('기본 정보')).toBeInTheDocument();
    expect(screen.getByText('병력')).toBeInTheDocument();
    expect(screen.getByText('COSI')).toBeInTheDocument();
  });

  it('marks current step with aria-current="step"', () => {
    render(
      <WizardStepper
        steps={QUESTIONNAIRE_STEPS}
        currentId="history"
        completedIds={['basic']}
        onNavigate={() => {}}
      />
    );
    expect(screen.getByRole('button', { current: 'step' })).toHaveTextContent('병력');
  });
});
```

- [ ] **Step 2: Run test, confirm failure**

Run: `npm test -- components/wizard/WizardStepper.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement component**

```tsx
'use client';
import { Check } from 'lucide-react';
import type { QuestionnaireStepDef, QuestionnaireStepId } from '../../utils/questionnaireSteps';

interface Props {
  steps: QuestionnaireStepDef[];
  currentId: QuestionnaireStepId;
  completedIds: QuestionnaireStepId[];
  onNavigate: (id: QuestionnaireStepId) => void;
}

export function WizardStepper({ steps, currentId, completedIds, onNavigate }: Props) {
  return (
    <nav aria-label="문진 단계" className="flex items-center gap-2">
      {steps.map((step, idx) => {
        const isCurrent = step.id === currentId;
        const isDone = completedIds.includes(step.id);
        const circle =
          isDone
            ? 'bg-slate-900 text-white'
            : isCurrent
              ? 'bg-blue-500 text-white ring-4 ring-blue-100'
              : 'bg-slate-200 text-slate-500';
        return (
          <div key={step.id} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate(step.id)}
              aria-current={isCurrent ? 'step' : undefined}
              className="flex flex-col items-center gap-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 rounded-lg p-1"
            >
              <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${circle}`}>
                {isDone ? <Check size={18} /> : idx + 1}
              </span>
              <span className="text-xs font-semibold text-slate-700">{step.label}</span>
            </button>
            {idx < steps.length - 1 && (
              <span className={`w-8 h-0.5 ${isDone ? 'bg-slate-900' : 'bg-slate-200'}`} />
            )}
          </div>
        );
      })}
    </nav>
  );
}
```

- [ ] **Step 4: Run test**

Run: `npm test -- components/wizard/WizardStepper.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/wizard/WizardStepper.tsx components/wizard/WizardStepper.test.tsx
git commit -m "feat(wizard): add WizardStepper presentation component"
```

### Task 1.3: QuestionnaireWizard container + step panels

**Files:**
- Create: `components/wizard/QuestionnaireWizard.tsx`
- Create: `components/wizard/steps/BasicInfoStep.tsx`
- Create: `components/wizard/steps/HistoryStep.tsx`
- Create: `components/wizard/steps/HearingStep.tsx`
- Create: `components/wizard/steps/CosiStep.tsx`
- Create: `components/wizard/QuestionnaireWizard.test.tsx`

- [ ] **Step 1: Read existing `QuestionnaireForm.tsx` sections**

Run: `grep -n "^\s*//\|^\s*<section\|^\s*<fieldset" C:/Users/oohea/jinsim-hearing-crm/components/QuestionnaireForm.tsx`
Action: Identify which JSX blocks map to each step. You will **copy** the field inputs into the 4 step components — do not invent new UI. Preserve exact label text, placeholder, and validation behavior from the original.

- [ ] **Step 2: Write failing integration test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuestionnaireWizard } from './QuestionnaireWizard';

describe('QuestionnaireWizard', () => {
  it('starts on "basic" step', () => {
    render(<QuestionnaireWizard initialData={{}} onSave={vi.fn()} />);
    expect(screen.getByRole('button', { current: 'step' })).toHaveTextContent('기본 정보');
  });

  it('blocks "Next" until step is complete', () => {
    const onSave = vi.fn();
    render(<QuestionnaireWizard initialData={{}} onSave={onSave} />);
    const nextBtn = screen.getByRole('button', { name: /다음/ });
    expect(nextBtn).toBeDisabled();
  });

  it('advances to "history" after filling basic fields', () => {
    render(<QuestionnaireWizard initialData={{}} onSave={vi.fn()} />);
    fireEvent.change(screen.getByLabelText(/이름/), { target: { value: '홍길동' } });
    fireEvent.change(screen.getByLabelText(/생년월일/), { target: { value: '1960-01-01' } });
    fireEvent.click(screen.getByRole('button', { name: /다음/ }));
    expect(screen.getByRole('button', { current: 'step' })).toHaveTextContent('병력');
  });
});
```

- [ ] **Step 3: Run test, confirm failure**

Run: `npm test -- components/wizard/QuestionnaireWizard.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement step panel components**

Each step panel takes `{ data, onChange }: { data: Partial<QuestionnaireData>; onChange: (patch: Partial<QuestionnaireData>) => void }` and renders the corresponding fieldset. Copy field JSX verbatim from `components/QuestionnaireForm.tsx`:

- `BasicInfoStep.tsx`: name, birthDate, phone, gender, address — map to the fieldset at `QuestionnaireForm.tsx` 기본정보 섹션.
- `HistoryStep.tsx`: medicalHistory, surgeries, medications, familyHistory — 병력 섹션.
- `HearingStep.tsx`: chiefComplaint, onsetAge, motivations, noiseExposure — 난청평가 섹션.
- `CosiStep.tsx`: cosiGoals array editor — COSI 섹션.

Each step calls `onChange({ field: value })` on every input. No internal state.

- [ ] **Step 5: Implement `QuestionnaireWizard.tsx`**

```tsx
'use client';
import { useState, useMemo } from 'react';
import type { QuestionnaireData } from '../../types';
import {
  QUESTIONNAIRE_STEPS,
  isStepComplete,
  firstIncompleteStep,
  type QuestionnaireStepId,
} from '../../utils/questionnaireSteps';
import { WizardStepper } from './WizardStepper';
import { BasicInfoStep } from './steps/BasicInfoStep';
import { HistoryStep } from './steps/HistoryStep';
import { HearingStep } from './steps/HearingStep';
import { CosiStep } from './steps/CosiStep';

interface Props {
  initialData: Partial<QuestionnaireData>;
  onSave: (data: Partial<QuestionnaireData>) => void;
}

export function QuestionnaireWizard({ initialData, onSave }: Props) {
  const [data, setData] = useState<Partial<QuestionnaireData>>(initialData);
  const [currentId, setCurrentId] = useState<QuestionnaireStepId>(
    firstIncompleteStep(initialData)
  );

  const completedIds = useMemo(
    () => QUESTIONNAIRE_STEPS.filter(s => isStepComplete(s.id, data)).map(s => s.id),
    [data]
  );
  const currentIdx = QUESTIONNAIRE_STEPS.findIndex(s => s.id === currentId);
  const isLast = currentIdx === QUESTIONNAIRE_STEPS.length - 1;
  const canAdvance = isStepComplete(currentId, data);

  const handleChange = (patch: Partial<QuestionnaireData>) =>
    setData(prev => ({ ...prev, ...patch }));

  const StepComponent = {
    basic: BasicInfoStep,
    history: HistoryStep,
    hearing: HearingStep,
    cosi: CosiStep,
  }[currentId];

  return (
    <div className="flex flex-col gap-6">
      <WizardStepper
        steps={QUESTIONNAIRE_STEPS}
        currentId={currentId}
        completedIds={completedIds}
        onNavigate={setCurrentId}
      />
      <StepComponent data={data} onChange={handleChange} />
      <div className="flex justify-between">
        <button
          type="button"
          disabled={currentIdx === 0}
          onClick={() => setCurrentId(QUESTIONNAIRE_STEPS[currentIdx - 1].id)}
          className="px-6 py-2 rounded-xl border border-slate-300 disabled:opacity-40"
        >
          이전
        </button>
        {isLast ? (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => onSave(data)}
            className="px-6 py-2 rounded-xl bg-slate-900 text-white disabled:opacity-40"
          >
            저장
          </button>
        ) : (
          <button
            type="button"
            disabled={!canAdvance}
            onClick={() => setCurrentId(QUESTIONNAIRE_STEPS[currentIdx + 1].id)}
            className="px-6 py-2 rounded-xl bg-blue-500 text-white disabled:opacity-40"
          >
            다음
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run tests**

Run: `npm test -- components/wizard/QuestionnaireWizard.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 7: Commit**

```bash
git add components/wizard/
git commit -m "feat(wizard): add QuestionnaireWizard with 4 step panels"
```

### Task 1.4: Wire wizard into VisitManager

**Files:**
- Modify: `components/VisitManager.tsx` (문진 탭)

- [ ] **Step 1: Locate the 상담 설문지 탭 render block**

Run: `grep -n "QuestionnaireForm\|상담\s*설문" C:/Users/oohea/jinsim-hearing-crm/components/VisitManager.tsx`
Action: Identify the exact JSX element rendering `<QuestionnaireForm .../>`.

- [ ] **Step 2: Swap component + adapt props**

Replace:

```tsx
<QuestionnaireForm data={...} onChange={...} />
```

with:

```tsx
<QuestionnaireWizard
  initialData={questionnaireData ?? {}}
  onSave={(data) => {
    setQuestionnaireData(data as QuestionnaireData);
    // 기존 localStorage 저장 로직 유지
  }}
/>
```

Keep `QuestionnaireForm.tsx` untouched — it may be reachable from other routes. Add a deprecation comment at its top:

```tsx
// DEPRECATED: superseded by components/wizard/QuestionnaireWizard.tsx (Phase 1). Delete after QA.
```

- [ ] **Step 3: Start dev server, verify manually**

Run: `npm run dev`
Navigate to a customer → 방문 → 상담 설문지 탭. Verify:
- Stepper shows 4 steps
- "다음" disabled until basic fields filled
- Step completion marks circles dark
- Navigation between steps preserves data

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: all pass, no regressions.

- [ ] **Step 5: Commit**

```bash
git add components/VisitManager.tsx components/QuestionnaireForm.tsx
git commit -m "feat(visit): use QuestionnaireWizard in 상담 설문지 탭"
```

---

## Phase 2 — Click-to-Input Audiogram

**목표**: `PureToneAudiogram.tsx`(437줄)에 SVG 격자 위 클릭/탭으로 역치를 입력하는 인터랙션 추가. 기존 숫자 입력 필드는 보조 옵션으로 유지.

### Task 2.1: Click→frequency/dB mapping utility

**Files:**
- Create: `utils/audiogramMapping.ts`
- Create: `utils/audiogramMapping.test.ts`

- [ ] **Step 1: Read existing chart geometry**

Run: `grep -n "FREQUENCIES\|xScale\|yScale\|margin\|width\|height" C:/Users/oohea/jinsim-hearing-crm/components/PureToneAudiogram.tsx | head -30`
Action: Extract: frequency array (usually `[250, 500, 1000, 2000, 4000, 8000]`), dB range (보통 -10~120), chart pixel dimensions.

- [ ] **Step 2: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { snapToNearestFrequency, pixelToDb, clickToEntry } from './audiogramMapping';

const geom = {
  frequencies: [250, 500, 1000, 2000, 4000, 8000],
  xStart: 60, xEnd: 660,       // plot area in SVG px
  yStart: 20, yEnd: 420,       // -10dB at yStart, 120dB at yEnd
  dbMin: -10, dbMax: 120,
  dbStep: 5,
};

describe('snapToNearestFrequency', () => {
  it('snaps 1100 Hz to 1000 Hz', () => {
    expect(snapToNearestFrequency(1100, geom.frequencies)).toBe(1000);
  });
  it('snaps 3000 Hz to 2000 Hz (log midpoint ≈ 2828)', () => {
    expect(snapToNearestFrequency(3000, geom.frequencies)).toBe(2000);
  });
});

describe('pixelToDb', () => {
  it('top pixel → dbMin', () => {
    expect(pixelToDb(20, geom)).toBe(-10);
  });
  it('bottom pixel → dbMax', () => {
    expect(pixelToDb(420, geom)).toBe(120);
  });
  it('snaps to 5-dB grid', () => {
    expect(pixelToDb(100, geom) % 5).toBe(0);
  });
});

describe('clickToEntry', () => {
  it('returns {freq, db} for valid click', () => {
    const result = clickToEntry({ x: 360, y: 220 }, geom);
    expect(result).toMatchObject({ freq: expect.any(Number), db: expect.any(Number) });
    expect(geom.frequencies).toContain(result!.freq);
  });
  it('returns null when click outside plot area', () => {
    expect(clickToEntry({ x: 10, y: 10 }, geom)).toBeNull();
  });
});
```

- [ ] **Step 3: Run test, confirm failure**

Run: `npm test -- utils/audiogramMapping.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Implement utility**

```ts
export interface AudiogramGeometry {
  frequencies: number[];
  xStart: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
  dbMin: number;
  dbMax: number;
  dbStep: number;
}

export function snapToNearestFrequency(hz: number, freqs: number[]): number {
  let best = freqs[0];
  let bestDist = Math.abs(Math.log2(hz) - Math.log2(best));
  for (const f of freqs) {
    const d = Math.abs(Math.log2(hz) - Math.log2(f));
    if (d < bestDist) { best = f; bestDist = d; }
  }
  return best;
}

export function pixelToDb(y: number, g: AudiogramGeometry): number {
  const clamped = Math.max(g.yStart, Math.min(g.yEnd, y));
  const ratio = (clamped - g.yStart) / (g.yEnd - g.yStart);
  const db = g.dbMin + ratio * (g.dbMax - g.dbMin);
  return Math.round(db / g.dbStep) * g.dbStep;
}

export function pixelToFrequency(x: number, g: AudiogramGeometry): number {
  const ratio = (x - g.xStart) / (g.xEnd - g.xStart);
  const logMin = Math.log2(g.frequencies[0]);
  const logMax = Math.log2(g.frequencies[g.frequencies.length - 1]);
  const hz = Math.pow(2, logMin + ratio * (logMax - logMin));
  return snapToNearestFrequency(hz, g.frequencies);
}

export function clickToEntry(
  p: { x: number; y: number },
  g: AudiogramGeometry
): { freq: number; db: number } | null {
  if (p.x < g.xStart || p.x > g.xEnd || p.y < g.yStart || p.y > g.yEnd) return null;
  return {
    freq: pixelToFrequency(p.x, g),
    db: pixelToDb(p.y, g),
  };
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- utils/audiogramMapping.test.ts`
Expected: PASS (6 assertions).

- [ ] **Step 6: Commit**

```bash
git add utils/audiogramMapping.ts utils/audiogramMapping.test.ts
git commit -m "feat(audiogram): add click-to-entry coordinate mapping"
```

### Task 2.2: Click handler + ear/transducer toggle in audiogram

**Files:**
- Modify: `components/PureToneAudiogram.tsx`

- [ ] **Step 1: Add ear/transducer selector state**

Near the component's top, add:

```tsx
const [activeEar, setActiveEar] = useState<'right' | 'left'>('right');
const [activeMode, setActiveMode] = useState<'AC' | 'BC' | 'AC_M'>('AC');
```

Render a toolbar above the chart:

```tsx
<div className="flex gap-2 mb-2 text-sm">
  <div className="flex gap-1" role="radiogroup" aria-label="귀 선택">
    {(['right', 'left'] as const).map(e => (
      <button key={e} type="button" onClick={() => setActiveEar(e)}
        aria-pressed={activeEar === e}
        className={`px-3 py-1 rounded-lg ${activeEar === e ? 'bg-slate-900 text-white' : 'bg-slate-100'}`}>
        {e === 'right' ? '우측 (O)' : '좌측 (X)'}
      </button>
    ))}
  </div>
  <div className="flex gap-1" role="radiogroup" aria-label="검사 종류">
    {(['AC', 'BC', 'AC_M'] as const).map(m => (
      <button key={m} type="button" onClick={() => setActiveMode(m)}
        aria-pressed={activeMode === m}
        className={`px-3 py-1 rounded-lg ${activeMode === m ? 'bg-blue-500 text-white' : 'bg-slate-100'}`}>
        {m === 'AC' ? '기도' : m === 'BC' ? '골도' : '기도+마스킹'}
      </button>
    ))}
  </div>
</div>
```

- [ ] **Step 2: Wrap chart SVG in click handler**

Wrap the existing `<svg>` with an `onClick` that uses `clickToEntry`:

```tsx
import { clickToEntry, type AudiogramGeometry } from '../utils/audiogramMapping';

const geometry: AudiogramGeometry = {
  frequencies: FREQUENCIES,
  xStart: MARGIN.left,
  xEnd: WIDTH - MARGIN.right,
  yStart: MARGIN.top,
  yEnd: HEIGHT - MARGIN.bottom,
  dbMin: -10, dbMax: 120, dbStep: 5,
};

const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
  const svg = e.currentTarget;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
  const entry = clickToEntry({ x: local.x, y: local.y }, geometry);
  if (!entry) return;
  onThresholdChange(activeEar, activeMode, entry.freq, entry.db);
};

// <svg onClick={handleSvgClick} ...>
```

(`onThresholdChange` is an existing or new prop — add it to `Props` if missing.)

- [ ] **Step 3: Add visual click hint**

On hover over the plot area, show a crosshair + live {freq, db} readout. Use `onMouseMove` to update a `hoverPoint` state, render a pair of dashed lines + a label.

Complete snippet (add near existing SVG contents):

```tsx
const [hover, setHover] = useState<{ x: number; y: number; freq: number; db: number } | null>(null);

const handleSvgMove = (e: React.MouseEvent<SVGSVGElement>) => {
  const svg = e.currentTarget;
  const pt = svg.createSVGPoint();
  pt.x = e.clientX; pt.y = e.clientY;
  const local = pt.matrixTransform(svg.getScreenCTM()!.inverse());
  const entry = clickToEntry({ x: local.x, y: local.y }, geometry);
  if (entry) setHover({ x: local.x, y: local.y, ...entry });
  else setHover(null);
};

// In SVG:
{hover && (
  <>
    <line x1={hover.x} y1={geometry.yStart} x2={hover.x} y2={geometry.yEnd}
      stroke="#94a3b8" strokeDasharray="4 2" />
    <line x1={geometry.xStart} y1={hover.y} x2={geometry.xEnd} y2={hover.y}
      stroke="#94a3b8" strokeDasharray="4 2" />
    <text x={hover.x + 8} y={hover.y - 8} className="text-xs fill-slate-700">
      {hover.freq} Hz / {hover.db} dB
    </text>
  </>
)}
```

- [ ] **Step 4: Manual verification in dev server**

Run: `npm run dev`
Test: Customer → Visit → 순음검사 → click on chart.
Expected:
- Crosshair tracks cursor
- Click places symbol at snapped (freq, db)
- Ear/mode toggle changes symbol placed
- Existing numeric inputs still work

- [ ] **Step 5: Commit**

```bash
git add components/PureToneAudiogram.tsx
git commit -m "feat(audiogram): add click-to-input + ear/mode toggle"
```

---

## Phase 3 — HA Protocol Top 3-5

**목표**: `HaProtocolTab.tsx`(4670줄)에서 현재 단계(HA_1/HA_2/HA_3/AFTERCARE_3MO)의 "지금 해야 할 Top 3-5 체크항목"만 상단에 고정 노출, 나머지는 접힌 섹션으로.

### Task 3.1: Priority-selection utility

**Files:**
- Create: `utils/haPriority.ts`
- Create: `utils/haPriority.test.ts`

- [ ] **Step 1: Read protocol template structure**

Read `data/haProtocolTemplates.ts` (69 lines — small, read entirely).

Run: `cat C:/Users/oohea/jinsim-hearing-crm/data/haProtocolTemplates.ts`

Note the shape of a `ProtocolItem` (id, priority, stage, status, etc). Confirm field names before writing the utility.

- [ ] **Step 2: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { selectTopPriorities } from './haPriority';

const items = [
  { id: '1', stage: 'HA_1', priority: 1, status: 'PENDING' },
  { id: '2', stage: 'HA_1', priority: 2, status: 'PENDING' },
  { id: '3', stage: 'HA_1', priority: 3, status: 'DONE' },
  { id: '4', stage: 'HA_1', priority: 4, status: 'PENDING' },
  { id: '5', stage: 'HA_1', priority: 5, status: 'PENDING' },
  { id: '6', stage: 'HA_1', priority: 6, status: 'PENDING' },
  { id: '7', stage: 'HA_2', priority: 1, status: 'PENDING' },
] as any;

describe('selectTopPriorities', () => {
  it('returns up to 5 pending items from current stage', () => {
    const top = selectTopPriorities(items, 'HA_1', 5);
    expect(top.map(i => i.id)).toEqual(['1', '2', '4', '5', '6']);
  });
  it('returns 3 when limit=3', () => {
    expect(selectTopPriorities(items, 'HA_1', 3)).toHaveLength(3);
  });
  it('excludes DONE items', () => {
    const top = selectTopPriorities(items, 'HA_1', 5);
    expect(top.find(i => i.id === '3')).toBeUndefined();
  });
  it('excludes other stages', () => {
    const top = selectTopPriorities(items, 'HA_1', 5);
    expect(top.find(i => i.id === '7')).toBeUndefined();
  });
});
```

- [ ] **Step 3: Run test, confirm failure**

Run: `npm test -- utils/haPriority.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement utility**

```ts
import type { HAStage } from '../types';

export interface PrioritizableItem {
  id: string;
  stage: HAStage;
  priority: number;
  status: 'PENDING' | 'DONE' | 'SKIP';
}

export function selectTopPriorities<T extends PrioritizableItem>(
  items: T[],
  stage: HAStage,
  limit: number
): T[] {
  return items
    .filter(i => i.stage === stage && i.status === 'PENDING')
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
}
```

Verify `HAStage` type exists in `types.ts`. If not present, use `string` temporarily and note in commit message.

- [ ] **Step 5: Run tests**

Run: `npm test -- utils/haPriority.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add utils/haPriority.ts utils/haPriority.test.ts
git commit -m "feat(ha-protocol): add top-N priority selector"
```

### Task 3.2: TopPriorityPanel component

**Files:**
- Create: `components/ha/TopPriorityPanel.tsx`
- Create: `components/ha/TopPriorityPanel.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { TopPriorityPanel } from './TopPriorityPanel';

const items = [
  { id: '1', title: '고막 검사', stage: 'HA_1', priority: 1, status: 'PENDING', description: '이경 검사' },
  { id: '2', title: '청력 재확인', stage: 'HA_1', priority: 2, status: 'PENDING', description: '' },
] as any;

describe('TopPriorityPanel', () => {
  it('renders top items with titles', () => {
    render(<TopPriorityPanel items={items} stage="HA_1" limit={5} onToggle={vi.fn()} />);
    expect(screen.getByText('고막 검사')).toBeInTheDocument();
    expect(screen.getByText('청력 재확인')).toBeInTheDocument();
  });

  it('calls onToggle with item id when checkbox clicked', () => {
    const onToggle = vi.fn();
    render(<TopPriorityPanel items={items} stage="HA_1" limit={5} onToggle={onToggle} />);
    fireEvent.click(screen.getAllByRole('checkbox')[0]);
    expect(onToggle).toHaveBeenCalledWith('1');
  });
});
```

- [ ] **Step 2: Run, confirm failure**

Run: `npm test -- components/ha/TopPriorityPanel.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement component**

```tsx
'use client';
import { selectTopPriorities, type PrioritizableItem } from '../../utils/haPriority';
import type { HAStage } from '../../types';

interface Item extends PrioritizableItem {
  title: string;
  description?: string;
}

interface Props {
  items: Item[];
  stage: HAStage;
  limit: number;
  onToggle: (id: string) => void;
}

export function TopPriorityPanel({ items, stage, limit, onToggle }: Props) {
  const top = selectTopPriorities(items, stage, limit);
  if (top.length === 0) {
    return (
      <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800">
        <span className="font-bold">✓ {stage} 단계 필수 체크 완료</span>
      </div>
    );
  }
  return (
    <section className="rounded-2xl bg-white border-2 border-blue-300 p-4 shadow-sm">
      <header className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
          지금 해야 할 일 · Top {top.length}
        </h3>
        <span className="text-xs text-slate-500">{stage} 단계</span>
      </header>
      <ul className="flex flex-col gap-2">
        {top.map((item, idx) => (
          <li key={item.id} className="flex items-start gap-3 p-2 rounded-xl hover:bg-slate-50">
            <input
              type="checkbox"
              checked={false}
              onChange={() => onToggle(item.id)}
              className="mt-1 w-5 h-5 rounded"
              aria-label={item.title}
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center">
                  {idx + 1}
                </span>
                <span className="font-semibold">{item.title}</span>
              </div>
              {item.description && (
                <p className="text-xs text-slate-500 mt-1">{item.description}</p>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- components/ha/TopPriorityPanel.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/ha/TopPriorityPanel.tsx components/ha/TopPriorityPanel.test.tsx
git commit -m "feat(ha-protocol): add TopPriorityPanel component"
```

### Task 3.3: Integrate panel into HaProtocolTab

**Files:**
- Modify: `components/HaProtocolTab.tsx`

- [ ] **Step 1: Locate stage + items state**

Run: `grep -n "currentStage\|HA_1\|checklistItems\|protocolItems" C:/Users/oohea/jinsim-hearing-crm/components/HaProtocolTab.tsx | head -20`
Action: Identify the variable holding checklist items for the active session and the current stage.

- [ ] **Step 2: Render TopPriorityPanel above existing content**

Near the top of the render output (inside the tab wrapper), add:

```tsx
<TopPriorityPanel
  items={checklistItems /* replace with actual variable */}
  stage={currentStage /* replace */}
  limit={5}
  onToggle={(id) => {
    // Reuse existing toggle handler
    handleToggleItem(id);
  }}
/>
```

- [ ] **Step 3: Collapse "전체 항목" into `<details>`**

Wrap the existing full checklist JSX with:

```tsx
<details className="mt-6 group">
  <summary className="cursor-pointer text-sm font-semibold text-slate-600 hover:text-slate-900">
    전체 체크항목 보기 ({checklistItems.length}개)
  </summary>
  <div className="mt-3">
    {/* existing full list JSX */}
  </div>
</details>
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`
Test: Customer → Visit → HA 프로토콜 탭.
Expected:
- Top priority panel shows ≤5 pending items ordered by priority
- Check toggles persist (localStorage)
- Full list collapsed by default, expands on click
- When all top items DONE, panel shows "완료" state

- [ ] **Step 5: Run full test suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add components/HaProtocolTab.tsx
git commit -m "feat(ha-protocol): surface Top 3-5 panel above full checklist"
```

---

## Phase 4 — Patient Journey Dashboard

**목표**: `CustomerDetail.tsx`(371줄) 상단에 타임라인 대시보드 추가 — 고객의 방문 히스토리 + HA 단계 진행도 + "다음 액션 힌트"를 한눈에.

### Task 4.1: Journey state calculator

**Files:**
- Create: `utils/journeyState.ts`
- Create: `utils/journeyState.test.ts`

- [ ] **Step 1: Read Customer + Visit types**

Run: `grep -n "interface Customer\|interface Visit\|HAStage\|HASession" C:/Users/oohea/jinsim-hearing-crm/types.ts`
Action: Confirm property names for `Customer.visits`, `Visit.date`, `Visit.type`, `HASession.stage`, `HASession.sessions` etc.

- [ ] **Step 2: Write failing tests**

```ts
import { describe, it, expect } from 'vitest';
import { calculateJourneyState } from './journeyState';

const customer = {
  id: 'c1',
  createdAt: '2026-01-01',
  visits: [
    { id: 'v1', date: '2026-01-10', type: 'CONSULT' },
    { id: 'v2', date: '2026-02-01', type: 'HA_PROTOCOL', haStage: 'HA_1', completed: true },
    { id: 'v3', date: '2026-03-01', type: 'HA_PROTOCOL', haStage: 'HA_2', completed: false },
  ],
} as any;

describe('calculateJourneyState', () => {
  it('returns current stage from latest HA visit', () => {
    expect(calculateJourneyState(customer).currentStage).toBe('HA_2');
  });
  it('returns ordered timeline events', () => {
    const events = calculateJourneyState(customer).timeline;
    expect(events).toHaveLength(3);
    expect(events[0].date).toBe('2026-01-10');
  });
  it('suggests next action for incomplete stage', () => {
    const hint = calculateJourneyState(customer).nextActionHint;
    expect(hint).toMatch(/HA_2/);
  });
  it('handles empty visits', () => {
    const state = calculateJourneyState({ id: 'c0', visits: [] } as any);
    expect(state.currentStage).toBeNull();
    expect(state.nextActionHint).toMatch(/첫 상담|문진/);
  });
});
```

- [ ] **Step 3: Run, confirm failure**

Run: `npm test -- utils/journeyState.test.ts`
Expected: FAIL.

- [ ] **Step 4: Implement utility**

```ts
import type { Customer, HAStage } from '../types';

export interface JourneyEvent {
  id: string;
  date: string;
  label: string;
  stage?: HAStage;
  completed: boolean;
}

export interface JourneyState {
  currentStage: HAStage | null;
  timeline: JourneyEvent[];
  nextActionHint: string;
}

const STAGE_LABEL: Record<string, string> = {
  HA_1: '1차 피팅', HA_2: '2차 피팅', HA_3: '3차 피팅', AFTERCARE_3MO: '3개월 사후관리',
};

export function calculateJourneyState(customer: Customer): JourneyState {
  const visits = [...(customer.visits ?? [])].sort((a, b) => a.date.localeCompare(b.date));
  const timeline: JourneyEvent[] = visits.map(v => ({
    id: v.id,
    date: v.date,
    label: v.type === 'HA_PROTOCOL' ? (STAGE_LABEL[v.haStage!] ?? v.haStage!) : '상담',
    stage: v.haStage,
    completed: v.completed ?? false,
  }));

  const latestHa = [...visits].reverse().find(v => v.type === 'HA_PROTOCOL');
  const currentStage = latestHa?.haStage ?? null;

  let nextActionHint: string;
  if (visits.length === 0) {
    nextActionHint = '첫 상담과 문진을 시작하세요';
  } else if (!latestHa) {
    nextActionHint = 'HA_1 단계 프로토콜을 시작하세요';
  } else if (!latestHa.completed) {
    nextActionHint = `${STAGE_LABEL[latestHa.haStage!]} 단계의 남은 체크항목을 완료하세요`;
  } else {
    const next: Record<string, string> = {
      HA_1: 'HA_2', HA_2: 'HA_3', HA_3: 'AFTERCARE_3MO', AFTERCARE_3MO: '',
    };
    const n = next[latestHa.haStage!];
    nextActionHint = n
      ? `${STAGE_LABEL[n]} 단계로 진행할 준비가 되었습니다`
      : '모든 HA 단계 완료 — 사후관리 유지';
  }

  return { currentStage, timeline, nextActionHint };
}
```

- [ ] **Step 5: Run tests**

Run: `npm test -- utils/journeyState.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add utils/journeyState.ts utils/journeyState.test.ts
git commit -m "feat(journey): add journey state + next-action calculator"
```

### Task 4.2: JourneyDashboard component

**Files:**
- Create: `components/journey/JourneyDashboard.tsx`
- Create: `components/journey/JourneyDashboard.test.tsx`

- [ ] **Step 1: Write failing test**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { JourneyDashboard } from './JourneyDashboard';

const customer = {
  id: 'c1',
  visits: [
    { id: 'v1', date: '2026-02-01', type: 'HA_PROTOCOL', haStage: 'HA_1', completed: true },
    { id: 'v2', date: '2026-03-01', type: 'HA_PROTOCOL', haStage: 'HA_2', completed: false },
  ],
} as any;

describe('JourneyDashboard', () => {
  it('shows current stage badge', () => {
    render(<JourneyDashboard customer={customer} />);
    expect(screen.getByText(/2차 피팅/)).toBeInTheDocument();
  });
  it('shows next action hint', () => {
    render(<JourneyDashboard customer={customer} />);
    expect(screen.getByText(/남은 체크항목을 완료/)).toBeInTheDocument();
  });
  it('renders a timeline event per visit', () => {
    render(<JourneyDashboard customer={customer} />);
    expect(screen.getAllByTestId('journey-event')).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run, confirm failure**

Run: `npm test -- components/journey/JourneyDashboard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement component**

```tsx
'use client';
import type { Customer } from '../../types';
import { calculateJourneyState } from '../../utils/journeyState';
import { ArrowRight, CheckCircle, Circle } from 'lucide-react';

interface Props {
  customer: Customer;
}

export function JourneyDashboard({ customer }: Props) {
  const { currentStage, timeline, nextActionHint } = calculateJourneyState(customer);

  return (
    <section className="rounded-3xl bg-slate-900 text-white p-6 flex flex-col gap-4">
      <header className="flex items-center justify-between">
        <span className="text-xs font-black uppercase tracking-widest text-slate-400">
          환자 여정
        </span>
        {currentStage && (
          <span className="px-3 py-1 rounded-full bg-blue-500 text-xs font-bold">
            {currentStage}
          </span>
        )}
      </header>

      <div className="flex items-center gap-3 flex-wrap">
        {timeline.length === 0 ? (
          <span className="text-slate-400 text-sm">방문 기록 없음</span>
        ) : (
          timeline.map((e, idx) => (
            <div key={e.id} data-testid="journey-event" className="flex items-center gap-2">
              {e.completed ? (
                <CheckCircle size={18} className="text-emerald-400" />
              ) : (
                <Circle size={18} className="text-slate-500" />
              )}
              <div className="flex flex-col">
                <span className="text-xs text-slate-400">{e.date}</span>
                <span className="text-sm font-semibold">{e.label}</span>
              </div>
              {idx < timeline.length - 1 && <ArrowRight size={16} className="text-slate-500" />}
            </div>
          ))
        )}
      </div>

      <div className="rounded-2xl bg-slate-800 p-3 flex items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-widest text-blue-300">다음 액션</span>
        <span className="text-sm font-semibold">{nextActionHint}</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- components/journey/JourneyDashboard.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add components/journey/
git commit -m "feat(journey): add JourneyDashboard component"
```

### Task 4.3: Place JourneyDashboard in CustomerDetail

**Files:**
- Modify: `components/CustomerDetail.tsx`

- [ ] **Step 1: Read CustomerDetail render structure**

Run: `grep -n "return\|<div\|<section" C:/Users/oohea/jinsim-hearing-crm/components/CustomerDetail.tsx | head -20`
Action: Find the top of the component's rendered tree, just below any header.

- [ ] **Step 2: Insert JourneyDashboard**

Import and render above existing tabs/sections:

```tsx
import { JourneyDashboard } from './journey/JourneyDashboard';

// inside return, after header:
<JourneyDashboard customer={customer} />
```

- [ ] **Step 3: Manual verification**

Run: `npm run dev`
Test: Navigate to any customer with existing visit history.
Expected:
- Dark dashboard at top with stage badge + timeline + next-action hint
- Customer without visits shows "방문 기록 없음" + "첫 상담과 문진을 시작하세요"
- Check that all existing functionality below still works

- [ ] **Step 4: Run full test suite**

Run: `npm test`
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add components/CustomerDetail.tsx
git commit -m "feat(customer): add journey dashboard to CustomerDetail"
```

---

## Phase 5 — Measurement & Validation

**목표**: "입력시간 50%+ 단축" 달성 여부 측정 지표 수립 + 수동 검증 프로토콜.

### Task 5.1: Input-time instrumentation

**Files:**
- Create: `utils/inputTimer.ts`
- Create: `utils/inputTimer.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { InputTimer } from './inputTimer';

describe('InputTimer', () => {
  beforeEach(() => { localStorage.clear(); });

  it('records a session duration', () => {
    vi.useFakeTimers();
    const t = new InputTimer('questionnaire');
    t.start();
    vi.advanceTimersByTime(5000);
    t.stop();
    const sessions = t.readAll();
    expect(sessions).toHaveLength(1);
    expect(sessions[0].durationMs).toBe(5000);
    vi.useRealTimers();
  });

  it('computes median across sessions', () => {
    vi.useFakeTimers();
    const t = new InputTimer('questionnaire');
    for (const ms of [1000, 3000, 5000, 7000, 9000]) {
      t.start();
      vi.advanceTimersByTime(ms);
      t.stop();
    }
    expect(t.median()).toBe(5000);
    vi.useRealTimers();
  });
});
```

- [ ] **Step 2: Run, confirm failure**

Run: `npm test -- utils/inputTimer.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implement**

```ts
interface Session { startedAt: number; durationMs: number; }

export class InputTimer {
  private readonly key: string;
  private startedAt: number | null = null;

  constructor(scope: string) {
    this.key = `jhcrm:inputTimer:${scope}`;
  }

  start() { this.startedAt = Date.now(); }

  stop() {
    if (this.startedAt == null) return;
    const session: Session = {
      startedAt: this.startedAt,
      durationMs: Date.now() - this.startedAt,
    };
    const all = this.readAll();
    all.push(session);
    localStorage.setItem(this.key, JSON.stringify(all));
    this.startedAt = null;
  }

  readAll(): Session[] {
    try { return JSON.parse(localStorage.getItem(this.key) ?? '[]'); }
    catch { return []; }
  }

  median(): number {
    const ms = this.readAll().map(s => s.durationMs).sort((a, b) => a - b);
    if (ms.length === 0) return 0;
    const mid = Math.floor(ms.length / 2);
    return ms.length % 2 ? ms[mid] : (ms[mid - 1] + ms[mid]) / 2;
  }
}
```

- [ ] **Step 4: Run tests**

Run: `npm test -- utils/inputTimer.test.ts`
Expected: PASS.

- [ ] **Step 5: Wire timer into QuestionnaireWizard + HaProtocolTab**

In `components/wizard/QuestionnaireWizard.tsx`, add:

```tsx
import { InputTimer } from '../../utils/inputTimer';
const timer = useRef(new InputTimer('questionnaire'));
useEffect(() => {
  timer.current.start();
  return () => timer.current.stop();
}, []);
```

Same pattern in `components/HaProtocolTab.tsx` with scope `'ha-protocol'`.

- [ ] **Step 6: Commit**

```bash
git add utils/inputTimer.ts utils/inputTimer.test.ts components/wizard/QuestionnaireWizard.tsx components/HaProtocolTab.tsx
git commit -m "feat(metrics): instrument input time for wizard + HA protocol"
```

### Task 5.2: Verification protocol document

**Files:**
- Create: `docs/verification/2026-04-14-audiologist-workflow-ux.md`

- [ ] **Step 1: Draft verification doc**

Write the protocol: baseline measurement (prior flow — recovered from git tag before Phase 1) vs new flow. Include:

```md
# 검증 프로토콜 — Audiologist Workflow UX

## 목적
문진·오디오그램·HA 프로토콜 입력시간이 50%+ 단축되었는지 확인.

## 베이스라인 수집 (Phase 1 이전 커밋에서)
1. git worktree add ../baseline <pre-phase-1-sha>
2. 해당 워크트리에서 npm run dev
3. 청능사 1명이 샘플 환자 5명 입력
4. `localStorage['jhcrm:inputTimer:questionnaire']` 중앙값 기록

## 신규 플로우 측정
1. main 브랜치에서 npm run dev
2. 동일 청능사가 동일 샘플 5명 입력
3. 중앙값 기록

## 합격 조건
- 문진 중앙값 ≤ 베이스라인 × 0.5
- HA 프로토콜 중앙값 ≤ 베이스라인 × 0.5
- 오디오그램 클릭 입력: 10 역치 기록 시간 ≤ 숫자 입력 대비 50%

## 정성 평가
- 청능사 3인 NPS (0-10): 개선된 플로우에 7+ 기대
- 오입력 빈도: 1주일 사용 후 자발 피드백 수집
```

- [ ] **Step 2: Commit**

```bash
git add docs/verification/2026-04-14-audiologist-workflow-ux.md
git commit -m "docs: add verification protocol for workflow UX metrics"
```

---

## Final Verification

- [ ] Run `npm test` — all tests pass.
- [ ] Run `npm run build` — production build succeeds.
- [ ] Run `npm run lint` — no new errors.
- [ ] Manual smoke test in `npm run dev`:
  - [ ] 신규 환자 등록 → 위저드 4 스텝 완료
  - [ ] 순음검사 탭에서 차트 클릭 입력 동작
  - [ ] HA 프로토콜 탭 Top 5 노출 + 전체 접힘
  - [ ] CustomerDetail에 여정 대시보드 표시
- [ ] Execute verification protocol (`docs/verification/2026-04-14-audiologist-workflow-ux.md`).

**Done.**
