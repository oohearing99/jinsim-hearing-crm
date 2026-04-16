# VisitManager UX 개선 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** jinsim-hearing-crm의 VisitManager에 스텝 인디케이터, 검사 데이터 통합, 방문 생성 모달 개선, 탭 완료 배지를 추가하여 UX를 개선한다.

**Architecture:** 기존 탭 구조(VisitManager.tsx)를 유지하면서 4개 신규 컴포넌트(StepIndicator, VisitSummaryBar, TestSummaryCards, completionUtils)를 추가한다. HA 프로토콜 탭에서 인라인 에디터를 제거하고 읽기 전용 요약 카드로 대체한다. 모든 검사 데이터 입력은 순음/어음 탭으로 통합한다.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind CSS, lucide-react, localStorage

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `utils/completionUtils.ts` | 탭별 완료 상태 판정 로직 (완료/진행중/미입력) |
| `components/StepIndicator.tsx` | 프로그레스 라인 스텝 인디케이터 (원형 번호 + 연결선) |
| `components/VisitSummaryBar.tsx` | 방문 요약 바 (고객명, 유형, 날짜, 진행률) |
| `components/TestSummaryCards.tsx` | HA 프로토콜 탭용 검사 결과 요약 카드 그리드 (읽기 전용) |

### Modified Files
| File | Change |
|------|--------|
| `types.ts` | Visit 인터페이스에 `visit_memo?: string` 추가 |
| `components/VisitManager.tsx` | StepIndicator, VisitSummaryBar, 탭 배지, 하단 네비게이션 추가 |
| `components/HaProtocolTab.tsx` | 인라인 에디터(PureToneEditor, SpeechEditor 등) 제거, TestSummaryCards 추가 |
| `components/PureToneAudiogram.tsx` | 중이검사(MiddleEarEditor) 아코디언 섹션 추가 |
| `components/SpeechTestForm.tsx` | 음장검사(SoundFieldEditor) + 검증(VerificationEditor) 아코디언 추가 |
| `app/page.tsx` | 방문 생성 모달 2단계로 개편, visit_memo 필드 추가 |

---

### Task 1: types.ts에 visit_memo 필드 추가

**Files:**
- Modify: `types.ts:29-41`

- [ ] **Step 1: Visit 인터페이스에 visit_memo 추가**

`types.ts`의 Visit 인터페이스에서 `memo?: string;` 아래에 `visit_memo?: string;`를 추가한다. 기존 `memo` 필드가 이미 있지만, 스펙에서 명시한 `visit_memo`를 추가:

```typescript
export interface Visit extends BaseRecord {
  id: string;
  customer_id: string;
  visit_date: string;
  purpose: string[];
  memo?: string;
  visit_memo?: string;  // 방문 생성 시 입력하는 간단 메모
  visit_type: VisitType;
  ha_stage: HAStage | null;
  ha_stage_label?: string;
  recommended_next_visit_date?: string | null;
  next_visit_rule?: 'WEEKLY' | '3MONTH' | null;
  protocol_version?: string;
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
git add types.ts
git commit -m "feat: add visit_memo field to Visit interface"
```

---

### Task 2: completionUtils.ts — 탭별 완료 상태 판정

**Files:**
- Create: `utils/completionUtils.ts`

- [ ] **Step 1: completionUtils.ts 작성**

```typescript
export type CompletionStatus = 'completed' | 'in_progress' | 'not_started';

/**
 * 상담 설문지 완료 상태 판정
 * - not_started: localStorage에 데이터 없음
 * - in_progress: 데이터 존재하지만 motivations 또는 cosi_top3_goals 비어있음
 * - completed: motivations + cosi_top3_goals + APHAB/HHIE 모두 입력됨
 */
export function getQuestionnaireStatus(customerId: string, visitId: string): CompletionStatus {
  const savedByCustomer = localStorage.getItem(`q_customer_${customerId}`);
  const savedByVisit = localStorage.getItem(`q_${visitId}`);
  const raw = savedByCustomer || savedByVisit;
  if (!raw) return 'not_started';

  try {
    const data = JSON.parse(raw);
    const hasMotivations = data.visit_motives && data.visit_motives.length > 0;
    const hasCosi = data.cosi_top3_goals && data.cosi_top3_goals.length > 0 &&
      data.cosi_top3_goals.some((g: { category: string }) => g.category);
    const hasAphab = typeof data.diff_quiet_1to1 === 'number';

    if (hasMotivations && hasCosi && hasAphab) return 'completed';
    return 'in_progress';
  } catch {
    return 'not_started';
  }
}

/**
 * 순음검사 완료 상태 판정
 * - not_started: localStorage에 데이터 없음
 * - in_progress: 데이터 존재하지만 좌우 AC 중 하나만 입력됨
 * - completed: 좌우 AC 모두 1개 이상 주파수 입력됨
 */
export function getPureToneStatus(visitId: string): CompletionStatus {
  const raw = localStorage.getItem(`pta_${visitId}`);
  if (!raw) return 'not_started';

  try {
    const data = JSON.parse(raw);
    const freqs = data.frequencies || {};
    const freqKeys = Object.keys(freqs);

    let hasRightAc = false;
    let hasLeftAc = false;

    for (const key of freqKeys) {
      const f = freqs[key];
      if (f.rt_ac !== null && f.rt_ac !== undefined) hasRightAc = true;
      if (f.lt_ac !== null && f.lt_ac !== undefined) hasLeftAc = true;
    }

    if (hasRightAc && hasLeftAc) return 'completed';
    if (hasRightAc || hasLeftAc) return 'in_progress';
    return 'in_progress'; // 데이터 파일은 있지만 값 없음
  } catch {
    return 'not_started';
  }
}

/**
 * 어음검사 완료 상태 판정
 * - not_started: localStorage에 데이터 없음
 * - in_progress: 데이터 존재하지만 SRT/WRS 일부만 입력
 * - completed: 좌우 SRT + WRS 모두 입력됨
 */
export function getSpeechStatus(visitId: string): CompletionStatus {
  const raw = localStorage.getItem(`speech_${visitId}`);
  if (!raw) return 'not_started';

  try {
    const data = JSON.parse(raw);
    const hasRightSrt = data.rt?.srt && data.rt.srt.length > 0 && data.rt.srt[0] !== null;
    const hasLeftSrt = data.lt?.srt && data.lt.srt.length > 0 && data.lt.srt[0] !== null;
    const hasRightWrs = data.rt?.wrs_percent && data.rt.wrs_percent.length > 0 && data.rt.wrs_percent[0] !== null;
    const hasLeftWrs = data.lt?.wrs_percent && data.lt.wrs_percent.length > 0 && data.lt.wrs_percent[0] !== null;

    if (hasRightSrt && hasLeftSrt && hasRightWrs && hasLeftWrs) return 'completed';
    if (hasRightSrt || hasLeftSrt || hasRightWrs || hasLeftWrs) return 'in_progress';
    return 'in_progress';
  } catch {
    return 'not_started';
  }
}

/**
 * HA 프로토콜 완료 상태 판정
 * - not_started: localStorage에 데이터 없음
 * - in_progress: 데이터 존재하지만 필수 항목 중 미완료 있음
 * - completed: 필수 항목 모두 DONE
 */
export function getHaProtocolStatus(visitId: string): CompletionStatus {
  const raw = localStorage.getItem(`hasession_${visitId}`);
  if (!raw) return 'not_started';

  try {
    const data = JSON.parse(raw);
    const checklist = data.checklist || {};
    const keys = Object.keys(checklist);
    if (keys.length === 0) return 'in_progress';

    // 필수 항목은 haProtocolTemplates에서 required: true인 항목
    // 여기서는 체크리스트에 있는 항목 중 DONE이 아닌 것이 있으면 in_progress
    const hasDone = keys.some(k => checklist[k]?.status === 'DONE');
    const allDone = keys.every(k =>
      checklist[k]?.status === 'DONE' ||
      checklist[k]?.status === 'SKIPPED' ||
      checklist[k]?.status === 'N/A'
    );

    if (allDone && hasDone) return 'completed';
    if (hasDone) return 'in_progress';
    return 'in_progress';
  } catch {
    return 'not_started';
  }
}

/**
 * 모든 탭의 완료 상태를 한 번에 가져오기
 */
export function getAllTabStatuses(
  customerId: string,
  visitId: string,
  isHA: boolean
): Record<string, CompletionStatus> {
  return {
    Q: getQuestionnaireStatus(customerId, visitId),
    PTA: getPureToneStatus(visitId),
    SPEECH: getSpeechStatus(visitId),
    ...(isHA ? { HA: getHaProtocolStatus(visitId) } : {}),
  };
}

/**
 * 스텝 인디케이터용 — 현재 스텝 자동 결정
 * 첫 번째 미완료 스텝을 현재 스텝으로 판정
 */
export function getCurrentStep(statuses: Record<string, CompletionStatus>, isHA: boolean): number {
  const order = isHA ? ['Q', 'PTA', 'SPEECH', 'HA'] : ['Q', 'PTA', 'SPEECH'];
  for (let i = 0; i < order.length; i++) {
    if (statuses[order[i]] !== 'completed') return i;
  }
  return order.length - 1; // 모두 완료 시 마지막 스텝
}

/**
 * 전체 진행률 (완료된 스텝 수 / 전체 스텝 수)
 */
export function getOverallProgress(statuses: Record<string, CompletionStatus>, isHA: boolean): { completed: number; total: number } {
  const order = isHA ? ['Q', 'PTA', 'SPEECH', 'HA'] : ['Q', 'PTA', 'SPEECH'];
  const completed = order.filter(k => statuses[k] === 'completed').length;
  return { completed, total: order.length };
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
git add utils/completionUtils.ts
git commit -m "feat: add tab completion status utilities"
```

---

### Task 3: VisitSummaryBar 컴포넌트

**Files:**
- Create: `components/VisitSummaryBar.tsx`

- [ ] **Step 1: VisitSummaryBar.tsx 작성**

```tsx
import React from 'react';
import { Visit, Customer } from '../types';
import { ClipboardList } from 'lucide-react';

interface Props {
  visit: Visit;
  customer: Customer;
  progress: { completed: number; total: number };
}

export default function VisitSummaryBar({ visit, customer, progress }: Props) {
  const stageLabel = visit.ha_stage_label || '일반 상담';
  const progressPercent = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;

  return (
    <div className="bg-slate-900 px-6 py-4 flex items-center justify-between rounded-t-3xl">
      <div className="flex items-center gap-3">
        <ClipboardList className="w-5 h-5 text-orange-500" />
        <span className="text-white font-black text-base tracking-tight">{customer.name}</span>
        <span className="text-slate-500 text-sm">·</span>
        <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-blue-400">
          {stageLabel}
        </span>
        <span className="bg-slate-800 px-3 py-1 rounded-full text-xs font-bold text-slate-400">
          {visit.visit_date}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">진행률</span>
        <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <span className="text-xs font-black text-blue-400">{progress.completed}/{progress.total}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
git add components/VisitSummaryBar.tsx
git commit -m "feat: add VisitSummaryBar component"
```

---

### Task 4: StepIndicator 컴포넌트

**Files:**
- Create: `components/StepIndicator.tsx`

- [ ] **Step 1: StepIndicator.tsx 작성**

프로그레스 라인 디자인 (C안 — 원형 번호 + 연결선):

```tsx
import React from 'react';
import { CompletionStatus } from '../utils/completionUtils';

interface Step {
  id: string;
  label: string;
}

interface Props {
  steps: Step[];
  statuses: Record<string, CompletionStatus>;
  currentStepIndex: number;
  onStepClick: (stepIndex: number) => void;
}

export default function StepIndicator({ steps, statuses, currentStepIndex, onStepClick }: Props) {
  return (
    <div className="bg-white px-6 py-5 border-b border-slate-200">
      <div className="flex items-start relative">
        {/* 연결선 배경 */}
        <div
          className="absolute h-[3px] bg-slate-200 rounded-full"
          style={{ top: '14px', left: '40px', right: '40px' }}
        />
        {/* 연결선 진행 (완료된 구간) */}
        {currentStepIndex > 0 && (
          <div
            className="absolute h-[3px] bg-slate-900 rounded-full transition-all duration-500"
            style={{
              top: '14px',
              left: '40px',
              width: `calc(${(currentStepIndex / (steps.length - 1)) * 100}% - 80px * ${currentStepIndex / (steps.length - 1)})`,
            }}
          />
        )}

        {steps.map((step, i) => {
          const status = statuses[step.id] || 'not_started';
          const isCurrent = i === currentStepIndex;
          const isCompleted = status === 'completed';
          const isPast = i < currentStepIndex;

          return (
            <div
              key={step.id}
              className="flex-1 flex flex-col items-center gap-2 relative z-10 cursor-pointer"
              onClick={() => onStepClick(i)}
            >
              {/* 원형 번호 */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${
                  isCompleted || isPast
                    ? 'bg-slate-900 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white shadow-[0_0_0_4px_#dbeafe]'
                    : 'bg-slate-200 text-slate-400'
                }`}
              >
                {isCompleted || isPast ? '✓' : i + 1}
              </div>
              {/* 라벨 */}
              <div className="text-center">
                <div
                  className={`text-[11px] font-bold ${
                    isCompleted || isPast
                      ? 'text-slate-900'
                      : isCurrent
                      ? 'text-blue-600 font-black'
                      : 'text-slate-400'
                  }`}
                >
                  {step.label}
                </div>
                {isCompleted && (
                  <div className="text-[9px] text-green-600 font-bold mt-0.5">완료</div>
                )}
                {isCurrent && !isCompleted && (
                  <div className="text-[9px] text-blue-500 font-bold mt-0.5">진행중</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
git add components/StepIndicator.tsx
git commit -m "feat: add StepIndicator progress line component"
```

---

### Task 5: TestSummaryCards 컴포넌트

**Files:**
- Create: `components/TestSummaryCards.tsx`

- [ ] **Step 1: TestSummaryCards.tsx 작성**

HA 프로토콜 탭에서 검사 결과를 읽기 전용 요약 카드로 표시:

```tsx
import React from 'react';
import { Activity, Headphones, Eye, ShieldCheck } from 'lucide-react';

interface Props {
  visitId: string;
  onNavigateToTab: (tab: 'PTA' | 'SPEECH') => void;
}

interface TestSummary {
  label: string;
  icon: React.ElementType;
  tab: 'PTA' | 'SPEECH';
  getData: () => { hasData: boolean; summary: React.ReactNode };
}

function getPtaSummary(visitId: string): { hasData: boolean; summary: React.ReactNode } {
  const raw = localStorage.getItem(`pta_${visitId}`);
  if (!raw) return { hasData: false, summary: null };

  try {
    const data = JSON.parse(raw);
    const freqs = data.frequencies || {};
    const ptaFreqs = ['500', '1000', '2000', '4000'];
    let rightSum = 0, rightCount = 0, leftSum = 0, leftCount = 0;

    for (const f of ptaFreqs) {
      if (freqs[f]?.rt_ac != null) { rightSum += freqs[f].rt_ac; rightCount++; }
      if (freqs[f]?.lt_ac != null) { leftSum += freqs[f].lt_ac; leftCount++; }
    }

    if (rightCount === 0 && leftCount === 0) return { hasData: false, summary: null };

    const rightPta = rightCount > 0 ? Math.round(rightSum / rightCount) : null;
    const leftPta = leftCount > 0 ? Math.round(leftSum / leftCount) : null;

    const getGrade = (pta: number) => {
      if (pta <= 25) return '정상';
      if (pta <= 40) return '경도';
      if (pta <= 55) return '중등도';
      if (pta <= 70) return '중등고도';
      if (pta <= 90) return '고도';
      return '심도';
    };

    return {
      hasData: true,
      summary: (
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <div className="text-[9px] text-slate-400 font-bold">우측 PTA</div>
            <div className="text-xl font-black text-red-500">{rightPta ?? '—'}</div>
            <div className="text-[9px] text-slate-400">{rightPta != null ? getGrade(rightPta) : ''}</div>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="flex-1 text-center">
            <div className="text-[9px] text-slate-400 font-bold">좌측 PTA</div>
            <div className="text-xl font-black text-blue-500">{leftPta ?? '—'}</div>
            <div className="text-[9px] text-slate-400">{leftPta != null ? getGrade(leftPta) : ''}</div>
          </div>
        </div>
      ),
    };
  } catch {
    return { hasData: false, summary: null };
  }
}

function getSpeechSummary(visitId: string): { hasData: boolean; summary: React.ReactNode } {
  const raw = localStorage.getItem(`speech_${visitId}`);
  if (!raw) return { hasData: false, summary: null };

  try {
    const data = JSON.parse(raw);
    const rightWrs = data.rt?.wrs_percent?.[0] ?? null;
    const leftWrs = data.lt?.wrs_percent?.[0] ?? null;

    if (rightWrs == null && leftWrs == null) return { hasData: false, summary: null };

    return {
      hasData: true,
      summary: (
        <div className="flex gap-4">
          <div className="flex-1 text-center">
            <div className="text-[9px] text-slate-400 font-bold">우 WRS</div>
            <div className="text-xl font-black text-red-500">{rightWrs != null ? `${rightWrs}%` : '—'}</div>
          </div>
          <div className="w-px bg-slate-200" />
          <div className="flex-1 text-center">
            <div className="text-[9px] text-slate-400 font-bold">좌 WRS</div>
            <div className="text-xl font-black text-blue-500">{leftWrs != null ? `${leftWrs}%` : '—'}</div>
          </div>
        </div>
      ),
    };
  } catch {
    return { hasData: false, summary: null };
  }
}

export default function TestSummaryCards({ visitId, onNavigateToTab }: Props) {
  const tests: TestSummary[] = [
    {
      label: '순음청력검사',
      icon: Activity,
      tab: 'PTA',
      getData: () => getPtaSummary(visitId),
    },
    {
      label: '어음검사',
      icon: Headphones,
      tab: 'SPEECH',
      getData: () => getSpeechSummary(visitId),
    },
  ];

  return (
    <div className="space-y-4">
      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">검사 결과 요약</h5>
      <div className="grid grid-cols-2 gap-4">
        {tests.map((test) => {
          const Icon = test.icon;
          const { hasData, summary } = test.getData();

          if (hasData) {
            return (
              <div
                key={test.label}
                className="bg-slate-50 border border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all"
                onClick={() => onNavigateToTab(test.tab)}
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-black text-slate-700">{test.label}</span>
                  </div>
                  <span className="text-[10px] text-blue-500 font-bold cursor-pointer">상세 보기 →</span>
                </div>
                {summary}
              </div>
            );
          }

          return (
            <div
              key={test.label}
              className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:border-blue-300 transition-all"
              onClick={() => onNavigateToTab(test.tab)}
            >
              <Icon className="w-5 h-5 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-black text-slate-400">{test.label}</div>
              <div className="text-[11px] text-slate-300 mt-1">— 미입력 —</div>
              <span className="text-[10px] text-blue-500 font-bold mt-2 inline-block">입력하기 →</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
git add components/TestSummaryCards.tsx
git commit -m "feat: add TestSummaryCards read-only summary component"
```

---

### Task 6: VisitManager.tsx 개편 — 스텝 인디케이터 + 탭 배지 + 하단 네비게이션

**Files:**
- Modify: `components/VisitManager.tsx`

- [ ] **Step 1: import 추가**

`components/VisitManager.tsx` 상단에 import 추가:

```typescript
import StepIndicator from './StepIndicator';
import VisitSummaryBar from './VisitSummaryBar';
import { getAllTabStatuses, getCurrentStep, getOverallProgress, CompletionStatus } from '../utils/completionUtils';
```

- [ ] **Step 2: 상태 및 스텝 정의 추가**

VisitManager 컴포넌트 내부, `const tabs = [...]` 뒤에 추가:

```typescript
// 탭별 완료 상태
const [tabStatuses, setTabStatuses] = useState<Record<string, CompletionStatus>>({});

// 스텝 정의
const stepDefs = isHA
  ? [
      { id: 'Q', label: '접수/설문' },
      { id: 'PTA', label: '순음검사' },
      { id: 'SPEECH', label: '어음검사' },
      { id: 'HA', label: '프로토콜' },
    ]
  : [
      { id: 'Q', label: '접수/설문' },
      { id: 'PTA', label: '순음검사' },
      { id: 'SPEECH', label: '어음검사' },
    ];

// 탭 순서 (이전/다음 네비게이션용)
const tabOrder = isHA ? ['HA', 'Q', 'PTA', 'SPEECH'] as const : ['Q', 'PTA', 'SPEECH'] as const;
const stepOrder = isHA ? ['Q', 'PTA', 'SPEECH', 'HA'] as const : ['Q', 'PTA', 'SPEECH'] as const;

// 완료 상태 갱신
useEffect(() => {
  const statuses = getAllTabStatuses(customer.id, visit.id, isHA);
  setTabStatuses(statuses);
}, [customer.id, visit.id, isHA, activeTab]);

const currentStepIndex = getCurrentStep(tabStatuses, isHA);
const progress = getOverallProgress(tabStatuses, isHA);

// 스텝 클릭 → 해당 탭으로 이동
const handleStepClick = (stepIndex: number) => {
  const stepId = stepDefs[stepIndex].id;
  setActiveTab(stepId as any);
};

// 이전/다음 네비게이션
const currentTabIndex = stepOrder.indexOf(activeTab as any);
const prevTab = currentTabIndex > 0 ? stepOrder[currentTabIndex - 1] : null;
const nextTab = currentTabIndex < stepOrder.length - 1 ? stepOrder[currentTabIndex + 1] : null;
const getTabLabel = (id: string) => stepDefs.find(s => s.id === id)?.label || id;
```

- [ ] **Step 3: 탭 배지 렌더링에 완료 상태 추가**

기존 탭 버튼 렌더링 부분을 수정. `{tabs.map(tab => {` 블록 내부의 return 부분에서 탭 이름 뒤에 배지 추가:

```tsx
<button
  key={tab.id}
  onClick={() => setActiveTab(tab.id as any)}
  className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black transition-all duration-200 ${
    isActive ? `bg-white shadow-xl ${tab.color} scale-[1.02]` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
  }`}
>
  <Icon className="w-5 h-5" />{tab.name}
  {/* 완료 배지 */}
  {tabStatuses[tab.id] === 'completed' && (
    <span className="w-[18px] h-[18px] rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-black">✓</span>
  )}
  {tabStatuses[tab.id] === 'in_progress' && (
    <span className="w-[18px] h-[18px] rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">·</span>
  )}
  {tabStatuses[tab.id] === 'not_started' && (
    <span className="w-[18px] h-[18px] rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-black">—</span>
  )}
</button>
```

- [ ] **Step 4: JSX 구조에 VisitSummaryBar + StepIndicator + 하단 네비게이션 추가**

기존 return문의 `<div className="space-y-6">` 내부를 수정:

```tsx
return (
  <div className="space-y-0">
    {/* 방문 요약 바 */}
    <VisitSummaryBar visit={visit} customer={customer} progress={progress} />

    {/* 스텝 인디케이터 */}
    <StepIndicator
      steps={stepDefs}
      statuses={tabStatuses}
      currentStepIndex={currentStepIndex}
      onStepClick={handleStepClick}
    />

    {/* 탭 바 */}
    <div className="px-4 pt-4">
      <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/50 rounded-2xl">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 min-w-[140px] flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black transition-all duration-200 ${
                isActive ? `bg-white shadow-xl ${tab.color} scale-[1.02]` : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Icon className="w-5 h-5" />{tab.name}
              {tabStatuses[tab.id] === 'completed' && (
                <span className="w-[18px] h-[18px] rounded-full bg-green-600 text-white flex items-center justify-center text-[10px] font-black">✓</span>
              )}
              {tabStatuses[tab.id] === 'in_progress' && (
                <span className="w-[18px] h-[18px] rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px] font-black">·</span>
              )}
              {tabStatuses[tab.id] === 'not_started' && (
                <span className="w-[18px] h-[18px] rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-[10px] font-black">—</span>
              )}
            </button>
          );
        })}
      </div>
    </div>

    {/* 탭 콘텐츠 */}
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm min-h-[700px] overflow-hidden mx-4">
      <div className="p-8">
        {activeTab === 'HA' && isHA && <HaProtocolTab visit={visit} customer={customer} onSave={() => onSaveSuccess('프로토콜 데이터가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
        {activeTab === 'Q' && <QuestionnaireForm visit={visit} customer={customer} onSave={() => onSaveSuccess('상담 설문지가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
        {activeTab === 'SPEECH' && <SpeechTestForm visit={visit} customer={customer} onSave={() => onSaveSuccess('어음검사 결과가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
        {activeTab === 'PTA' && <PureToneAudiogram visit={visit} customer={customer} onSave={() => onSaveSuccess('순음청력검사 결과가 저장되었습니다.')} onDirtyChange={onDirtyChange} saveTriggerRef={saveTriggerRef} />}
      </div>
    </div>

    {/* 하단 네비게이션 */}
    <div className="border-t border-slate-200 px-6 py-4 flex justify-between items-center bg-white rounded-b-3xl mx-4">
      {prevTab ? (
        <button
          onClick={() => setActiveTab(prevTab as any)}
          className="px-5 py-2.5 border-2 border-slate-100 rounded-xl text-sm font-black hover:bg-slate-50 transition-all text-slate-600"
        >
          ← 이전: {getTabLabel(prevTab)}
        </button>
      ) : (
        <div />
      )}
      {nextTab ? (
        <button
          onClick={() => setActiveTab(nextTab as any)}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          다음: {getTabLabel(nextTab)} →
        </button>
      ) : (
        <div />
      )}
    </div>
  </div>
);
```

- [ ] **Step 5: 빌드 확인**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
npm run build
```

Expected: 빌드 성공

- [ ] **Step 6: Commit**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
git add components/VisitManager.tsx
git commit -m "feat: add step indicator, tab badges, and bottom navigation to VisitManager"
```

---

### Task 7: HaProtocolTab에서 인라인 에디터 제거 + TestSummaryCards 추가

**Files:**
- Modify: `components/HaProtocolTab.tsx`

- [ ] **Step 1: TestSummaryCards import 추가**

`components/HaProtocolTab.tsx` 상단에 추가:

```typescript
import TestSummaryCards from './TestSummaryCards';
```

- [ ] **Step 2: onNavigateToTab prop 추가**

HaProtocolTab의 Props 인터페이스에 추가:

```typescript
interface Props {
  visit: Visit;
  customer: Customer;
  onSave: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  saveTriggerRef: React.MutableRefObject<() => void>;
  onNavigateToTab?: (tab: 'PTA' | 'SPEECH') => void;  // 추가
}
```

- [ ] **Step 3: 인라인 에디터 렌더링을 TestSummaryCards로 교체**

HaProtocolTab의 JSX에서 순음청력검사 결과 차트+에디터 섹션 (`data-capture="pure-tone-audiogram"` div)과 그 안의 `<PureToneEditor ... />`, `<SpeechEditor ... />`, `<MiddleEarEditor ... />`, `<VerificationEditor ... />`, `<SoundFieldEditor ... />` 인라인 렌더링을 제거한다.

대신 체크리스트 섹션과 `missingRequired` 경고 사이에 TestSummaryCards를 추가:

```tsx
{/* 검사 결과 요약 카드 (읽기 전용) */}
<TestSummaryCards
  visitId={visit.id}
  onNavigateToTab={onNavigateToTab || (() => {})}
/>
```

**중요**: 기존 차트(LineChart)와 에디터들이 있는 `<div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200" data-capture="pure-tone-audiogram">` 블록 전체를 제거하고, 그 자리에 `<TestSummaryCards ... />`를 배치한다. `data-capture` 속성이 없어지므로 이미지 캡처 기능에도 영향이 있을 수 있으나, 캡처는 PTA/SPEECH 탭에서 수행하므로 문제없다.

- [ ] **Step 4: VisitManager에서 onNavigateToTab prop 전달**

`components/VisitManager.tsx`에서 HaProtocolTab 렌더링 부분을 수정:

```tsx
{activeTab === 'HA' && isHA && (
  <HaProtocolTab
    visit={visit}
    customer={customer}
    onSave={() => onSaveSuccess('프로토콜 데이터가 저장되었습니다.')}
    onDirtyChange={onDirtyChange}
    saveTriggerRef={saveTriggerRef}
    onNavigateToTab={(tab) => setActiveTab(tab)}
  />
)}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
npm run build
```

Expected: 빌드 성공

- [ ] **Step 6: Commit**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
git add components/HaProtocolTab.tsx components/VisitManager.tsx
git commit -m "feat: replace inline editors with TestSummaryCards in HaProtocolTab"
```

---

### Task 8: 방문 생성 모달 개편

**Files:**
- Modify: `app/page.tsx:760-770`

- [ ] **Step 1: 모달 상태 추가**

`app/page.tsx`에서 `const [isCreatingVisit, setIsCreatingVisit]` 근처에 추가:

```typescript
const [selectedVisitType, setSelectedVisitType] = useState<VisitType | null>(null);
const [selectedHaStage, setSelectedHaStage] = useState<HAStage | null>(null);
const [visitMemo, setVisitMemo] = useState('');
const [visitDate, setVisitDate] = useState(new Date().toISOString().split('T')[0]);
```

- [ ] **Step 2: 모달 열기/닫기 수정**

`setIsCreatingVisit(true)` 호출 시 상태 초기화:

```typescript
// 기존 onCreateVisit 핸들러를 수정
const handleOpenCreateVisit = () => {
  setSelectedVisitType(null);
  setSelectedHaStage(null);
  setVisitMemo('');
  setVisitDate(new Date().toISOString().split('T')[0]);
  setIsCreatingVisit(true);
};
```

CustomerDetail의 `onCreateVisit` prop을 `handleOpenCreateVisit`으로 변경.

- [ ] **Step 3: handleFinalizeVisitCreate 수정**

기존 `handleFinalizeVisitCreate` 함수에서 `visit_memo`를 포함하도록 수정:

```typescript
const handleFinalizeVisitCreate = (type: VisitType, stage: HAStage | null) => {
  if (!selectedCustomer) return;

  const stageLabels: Record<string, string> = {
    HA_1: '1차(기초평가/첫 착용)',
    HA_2: '2차(1주 후 적응체크)',
    HA_3: '3차(2주 후 심화조정)',
    AFTERCARE_3MO: '사후관리(3개월 점검)'
  };

  const nextRule = stage === 'HA_1' || stage === 'HA_2' ? 'WEEKLY' : '3MONTH';
  const nextDays = nextRule === 'WEEKLY' ? 7 : 90;
  const nextDate = new Date(visitDate);
  nextDate.setDate(nextDate.getDate() + nextDays);

  const newVisit: Visit = {
    id: Math.random().toString(36).substr(2, 9),
    customer_id: selectedCustomer.id,
    visit_date: visitDate,
    purpose: stage ? [stageLabels[stage]] : ['일반 상담'],
    visit_memo: visitMemo || undefined,
    visit_type: type,
    ha_stage: stage,
    ha_stage_label: stage ? stageLabels[stage] : undefined,
    recommended_next_visit_date: stage ? nextDate.toISOString().split('T')[0] : null,
    next_visit_rule: stage ? nextRule : null,
    protocol_version: 'v1',
    brand_id: BRAND_ID,
    center_id: prefCenter,
    counselor_name: prefCounselor,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  setVisits(prev => [...prev, newVisit]);
  setIsCreatingVisit(false);
  handleSelectVisit(newVisit);
};
```

- [ ] **Step 4: 모달 JSX 교체**

기존 `{isCreatingVisit && ( ... )}` 모달 전체를 교체:

```tsx
{isCreatingVisit && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4">
    <div className="bg-white rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-300">
      {/* 헤더 */}
      <div className="bg-slate-900 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-6 h-6 text-orange-500" />
          <div>
            <h3 className="text-white text-xl font-black">새 상담 시작</h3>
            <p className="text-slate-400 text-xs font-bold mt-0.5">상담 유형과 기본 정보를 입력해주세요</p>
          </div>
        </div>
        <button onClick={() => setIsCreatingVisit(false)} className="p-2 hover:bg-slate-800 rounded-full transition-all">
          <X className="w-5 h-5 text-slate-400" />
        </button>
      </div>

      {/* 상담 유형 */}
      <div className="p-8 border-b border-slate-100 space-y-4">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">상담 유형</p>
        <button
          onClick={() => { setSelectedVisitType('GENERAL'); setSelectedHaStage(null); }}
          className={`w-full p-5 border-2 rounded-2xl text-left flex items-center gap-4 group transition-all ${
            selectedVisitType === 'GENERAL' ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-blue-300 hover:bg-blue-50/30'
          }`}
        >
          <div className={`p-3 rounded-xl transition-all ${selectedVisitType === 'GENERAL' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'}`}>
            <Search className="w-6 h-6" />
          </div>
          <div>
            <p className="font-black text-slate-800">일반 상담 / 청력 검사</p>
            <p className="text-xs font-bold text-slate-500 mt-0.5">기초 문진 및 모든 임상 평가 포함</p>
          </div>
        </button>

        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest pt-2 border-l-4 border-orange-500 pl-3">HA Protocol</p>
        <div className="grid grid-cols-2 gap-3">
          {([
            { id: 'HA_1' as HAStage, label: '1차', desc: '기초평가/첫 착용' },
            { id: 'HA_2' as HAStage, label: '2차', desc: '1주 후 적응체크' },
            { id: 'HA_3' as HAStage, label: '3차', desc: '2주 후 심화조정' },
            { id: 'AFTERCARE_3MO' as HAStage, label: '사후관리', desc: '3개월 점검' },
          ]).map(st => (
            <button
              key={st.id}
              onClick={() => { setSelectedVisitType('HA_PROTOCOL'); setSelectedHaStage(st.id); }}
              className={`p-4 border-2 rounded-2xl text-left transition-all ${
                selectedVisitType === 'HA_PROTOCOL' && selectedHaStage === st.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-slate-100 hover:border-orange-300 hover:bg-orange-50/30'
              }`}
            >
              <p className={`text-sm font-black ${selectedHaStage === st.id ? 'text-orange-700' : 'text-slate-700'}`}>{st.label}</p>
              <p className="text-[10px] font-bold text-slate-400 mt-0.5">{st.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 방문 정보 — 유형 선택 후에만 표시 */}
      {selectedVisitType && (
        <div className="p-8 space-y-4">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">방문 정보</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">방문 날짜</label>
              <input
                type="date"
                value={visitDate}
                onChange={e => setVisitDate(e.target.value)}
                className="w-full p-3 bg-slate-50 border-2 border-slate-200 rounded-xl font-bold outline-none focus:ring-4 focus:ring-blue-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-2">방문 목적</label>
              <div className="p-3 bg-slate-50 border-2 border-slate-200 rounded-xl text-sm font-bold text-orange-600">
                {selectedVisitType === 'GENERAL' ? '일반 상담' : selectedHaStage ? `${selectedHaStage === 'HA_1' ? '1차(기초평가/첫 착용)' : selectedHaStage === 'HA_2' ? '2차(1주 후 적응체크)' : selectedHaStage === 'HA_3' ? '3차(2주 후 심화조정)' : '사후관리(3개월 점검)'}` : ''}
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-2">방문 메모 <span className="font-normal text-slate-300">(선택)</span></label>
            <textarea
              value={visitMemo}
              onChange={e => setVisitMemo(e.target.value)}
              placeholder="예: 타 센터 보청기 사용 중, 불만족으로 내원..."
              className="w-full p-3 bg-white border-2 border-slate-200 rounded-xl text-sm outline-none resize-none h-16 focus:ring-4 focus:ring-blue-100 transition-all"
            />
          </div>
          <div className="flex gap-3 justify-end pt-2">
            <button
              onClick={() => setIsCreatingVisit(false)}
              className="px-6 py-3 border-2 border-slate-100 rounded-xl font-black text-slate-500 hover:bg-slate-50 transition-all"
            >
              취소
            </button>
            <button
              onClick={() => handleFinalizeVisitCreate(selectedVisitType, selectedHaStage)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              상담 시작 <span>→</span>
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
)}
```

- [ ] **Step 5: 빌드 확인**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
npm run build
```

Expected: 빌드 성공

- [ ] **Step 6: Commit**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
git add app/page.tsx
git commit -m "feat: redesign visit creation modal with two-step flow and visit_memo"
```

---

### Task 9: 브라우저에서 전체 기능 테스트

**Files:** 없음 (수동 테스트)

- [ ] **Step 1: 개발 서버 시작**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
npm run dev
```

- [ ] **Step 2: 테스트 시나리오 실행**

브라우저에서 http://localhost:3000 접속 후:

1. 신규 고객 등록 (이름: 테스트, 연락처: 010-1234-5678)
2. [새 상담/프로토콜 시작] 클릭 → 모달에서 HA 1차 선택 → 메모 입력 → "상담 시작"
3. VisitManager에서 확인:
   - 상단 방문 요약 바: 고객명, "1차 기초평가", 날짜, 진행률 0/4
   - 스텝 인디케이터: ①접수/설문(진행중) → ②순음검사 → ③어음검사 → ④프로토콜
   - 탭 배지: 모두 "—" (미입력)
   - 하단 네비게이션: "다음: 순음검사 →" 버튼
4. 상담 설문지 탭에서 방문동기 + COSI 목표 입력 → 저장
5. 탭 배지가 "✓" (완료)로 변경되는지 확인
6. "다음: 순음검사 →" 클릭 → 순음검사 탭으로 이동
7. 순음검사에서 좌우 AC 데이터 입력 → 저장
8. HA 프로토콜 탭으로 이동 → TestSummaryCards에 PTA 값이 요약 표시되는지 확인
9. "상세 보기 →" 클릭 → 순음검사 탭으로 이동하는지 확인
10. 스텝 인디케이터 진행률이 올바르게 업데이트되는지 확인

- [ ] **Step 3: 일반 상담 테스트**

1. 같은 고객에서 [새 상담/프로토콜 시작] → 일반 상담 선택 → "상담 시작"
2. 스텝 인디케이터: 3스텝만 표시 (HA 프로토콜 없음)
3. 탭에 "HA 프로토콜" 탭이 없는지 확인

- [ ] **Step 4: 발견된 이슈 수정 후 최종 Commit**

```bash
cd C:/Users/oohea/jinsim-hearing-crm
git add -A
git commit -m "fix: resolve issues found during manual testing"
```

---

플랜 작성 완료. `docs/superpowers/plans/2026-04-14-visit-manager-ux-redesign.md`에 저장되었습니다.

**두 가지 실행 옵션:**

1. **Subagent-Driven (추천)** — 태스크마다 별도 서브에이전트가 구현, 스펙/코드 리뷰 후 다음 태스크
2. **Inline Execution** — 이 세션에서 직접 순차 실행

어떤 방식으로 진행할까요?

─────────────────────────────────────────────────
📊 bkit Feature Usage
─────────────────────────────────────────────────
✅ Used: superpowers:writing-plans, TaskUpdate, Read (types.ts, VisitManager.tsx, HaProtocolTab.tsx, page.tsx)
⏭️ Not Used: /pdca (superpowers 스킬로 진행), Agents (플랜 작성 단계)
💡 Recommended: 플랜 실행 — subagent-driven-development 또는 executing-plans
─────────────────────────────────────────────────