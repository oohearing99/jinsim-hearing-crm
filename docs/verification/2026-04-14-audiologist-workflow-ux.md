# 검증 프로토콜 — Audiologist Workflow UX

## 목적
문진·오디오그램·HA 프로토콜 입력시간이 50%+ 단축되었는지 확인.

## 베이스라인 수집 (Phase 1 이전 커밋에서)

Phase 1의 첫 커밋 직전: `be439d4` (feat: redesign visit creation modal with two-step flow and visit_memo).

```bash
git worktree add ../baseline be439d4
cd ../baseline
npm install
npm run dev
```

청능사 1명이 샘플 환자 5명에 대해:
- 상담 설문지 입력 (A~G 전 섹션)
- 순음검사 입력 (10 역치)
- HA_1 프로토콜 체크리스트 완료

각 시나리오별 시작~종료까지의 stopwatch 기록 (초 단위).

## 신규 플로우 측정

`main`(또는 `feat/visit-manager-ux-redesign` 병합 후) 브랜치:

```bash
npm install
npm run dev
```

동일 청능사가 동일 샘플 5명 입력. 신규 플로우:
- 상담 설문지: 4-스텝 위저드 (basic → history → hearing → cosi) + 하단 심층 설문
- 순음검사: 차트 클릭 입력 + ear/mode 토글 (숫자 입력 유지)
- HA_1 프로토콜: 상단 Top 5 우선순위 패널 + 하단 접이식 전체 리스트

`localStorage` 에 자동 누적된 중앙값:
- `jhcrm:inputTimer:questionnaire` → `InputTimer('questionnaire').median()`
- `jhcrm:inputTimer:ha-protocol` → `InputTimer('ha-protocol').median()`

브라우저 콘솔에서 추출:
```js
JSON.parse(localStorage.getItem('jhcrm:inputTimer:questionnaire'))
  .map(s => s.durationMs).sort((a,b)=>a-b)
```

## 합격 조건

- **문진 중앙값 ≤ 베이스라인 × 0.5** (50%+ 단축)
- **HA 프로토콜 중앙값 ≤ 베이스라인 × 0.5**
- **오디오그램 클릭 입력:** 10 역치 기록 시간 ≤ 숫자 입력 대비 50%
  (청능사 수동 stopwatch 비교; 기존 숫자 입력 플로우와 신규 클릭 플로우 교차 측정)

## 정성 평가

- 청능사 3인 NPS (0-10): 개선된 플로우에 **7+ 기대**
- 오입력 빈도: 1주일 사용 후 자발 피드백 수집
- 위저드 네비게이션 자유도: 이전/다음 단계 이동이 원활한가
- Top 5 패널 수용도: 필요 항목을 빠르게 찾는가
- Journey Dashboard 인지도: 환자 단계 파악이 빨라졌는가

## 측정 기록 템플릿

| 측정 항목 | 베이스라인 중앙값 | 신규 중앙값 | 단축률 | 합격 |
|-----------|-------------------|-------------|--------|------|
| 문진 입력 (초) |  |  |  |  |
| 순음검사 (10역치, 초) |  |  |  |  |
| HA_1 프로토콜 (초) |  |  |  |  |
| 청능사 NPS (평균) |  |  | — |  |

## 실행 일정

- **베이스라인 수집:** `2026-04-21` 주 시작
- **신규 플로우 측정:** 베이스라인 수집 완료 후 +1주
- **리포트 작성:** 측정 완료 후 +3일

## 책임자

- 청능사 섭외 및 측정 진행: 개발 리드
- 데이터 집계 및 리포트: 개발 리드
