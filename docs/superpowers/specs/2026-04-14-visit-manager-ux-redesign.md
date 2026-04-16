# VisitManager UX 개선 — 스텝 가이드 + 검사 통합

## 목표

jinsim-hearing-crm의 VisitManager(방문 관리 화면)를 개선하여:
1. 검사 데이터 입력 중복을 제거한다 (HA 프로토콜 탭 ↔ 순음/어음 탭)
2. 순차적 진행 가이드를 추가한다 (스텝 인디케이터 + 이전/다음 버튼)
3. 방문 생성 시 메모 입력을 추가한다
4. 각 탭의 완료 상태를 한눈에 보여준다

## 대상 프로젝트

- 레포: `oohearing99/jinsim-hearing-crm`
- 배포: https://jinsim-hearing-crm-a3ud.vercel.app/
- 기술 스택: Next.js 15, React 19, TypeScript, Tailwind CSS, localStorage
- 아이콘: lucide-react
- 폰트: Pretendard Variable
- 디자인 톤: slate-900 다크 헤더, rounded-2xl/3xl 카드, font-weight 700~900, uppercase tracking-widest 라벨

## 변경 범위

기존 탭 구조를 유지하면서 4가지를 추가/수정한다.

### 1. 프로그레스 라인 스텝 인디케이터

**위치**: VisitManager 상단, 방문 요약 바 아래

**구조**:
- 원형 번호 + 가로 연결선
- 완료 구간: 다크(#0f172a) 원 + 다크 연결선
- 진행중: 블루(#3b82f6) 원 + 블루 링(box-shadow: 0 0 0 4px #dbeafe)
- 미진행: 슬레이트(#e2e8f0) 원
- 각 원 아래에 라벨 텍스트 + 상태("완료", "진행중")

**스텝 구성 — HA Protocol 방문**:
1. 접수/설문 → 상담 설문지 탭
2. 순음검사 → 순음검사 탭
3. 어음검사 → 어음검사 탭
4. 프로토콜 → HA 프로토콜 탭

**스텝 구성 — 일반 상담 방문**:
1. 접수/설문 → 상담 설문지 탭
2. 순음검사 → 순음검사 탭
3. 어음검사 → 어음검사 탭

**스텝 완료 판정 기준**:
- 접수/설문: QuestionnaireData가 localStorage에 존재하고, 필수 필드(chiefComplaint 또는 motivations)가 비어있지 않음
- 순음검사: PureToneTestData가 존재하고, AC 데이터가 1개 이상 입력됨
- 어음검사: SpeechTestData가 존재하고, SRT 또는 WRS가 1개 이상 입력됨
- 프로토콜: HASession이 존재하고, 필수 체크항목이 모두 DONE

**방문 요약 바**:
- 위치: 스텝 인디케이터 위
- 배경: #0f172a (CRM 사이드바와 동일)
- 내용: 고객명, 방문 유형 배지, 방문 날짜, 전체 진행률 프로그레스 바

**하단 네비게이션**:
- "← 이전: {탭명}" / "다음: {탭명} →" 버튼
- 스텝 순서대로 탭 전환
- 탭 클릭으로 자유 이동도 유지

### 2. 검사 데이터 통합

**원칙**: 검사 데이터는 순음검사 탭과 어음검사 탭에서만 입력. HA 프로토콜 탭에서는 읽기 전용 요약만 표시.

**HA 프로토콜 탭 변경**:
- 기존 에디터(PureToneEditor, SpeechEditor, MiddleEarEditor, VerificationEditor, SoundFieldEditor) 인라인 렌더링 제거
- 대신 "검사 결과 요약" 섹션 추가:
  - 2x2 그리드 카드 레이아웃
  - 각 카드: 검사명 + 핵심 수치(PTA dB, WRS % 등) + "상세 보기 →" 링크
  - 데이터 미입력 시: 점선 테두리(border-dashed) + "입력하기 →" 링크
  - "상세 보기" / "입력하기" 클릭 → 해당 탭으로 activeTab 전환
- 체크리스트는 그대로 유지
- 체크리스트에서 검사 관련 항목(순음청력검사, 골도검사, SRS 어음검사 등) 체크 시, 해당 검사 탭 데이터 존재 여부를 참조하여 자동 상태 표시 가능 (선택적 개선)

**순음검사 탭 확장**:
- 기존 PureToneAudiogram 내용 유지
- 추가: 중이검사(MiddleEarEditor) 섹션을 순음검사 탭 하단에 배치
  - 아코디언으로 접힌 상태로 시작
  - 이경검사 + 고막운동성검사

**어음검사 탭 확장**:
- 기존 SpeechTestForm 내용 유지
- 추가: 음장검사(SoundFieldEditor) 섹션을 어음검사 탭 하단에 배치
  - 아코디언으로 접힌 상태로 시작
- 추가: 검증(VerificationEditor) 섹션 — REM, EAA
  - 아코디언으로 접힌 상태로 시작

**데이터 저장 방식**: 변경 없음. 기존 localStorage 키 구조 유지.
- `pta_{visitId}`: 순음 + 중이검사 데이터
- `speech_{visitId}`: 어음 + 음장 + 검증 데이터
- `hasession_{visitId}`: 체크리스트 데이터 (검사 에디터 데이터 참조 제거)

### 3. 방문 생성 모달 개선

**현재**: 유형 클릭 → 즉시 빈 Visit 생성 → VisitManager 이동
**개선**: 유형 선택 → 방문 정보(날짜/목적/메모) 입력 → "상담 시작" 클릭으로 생성

**모달 레이아웃**:
- 헤더: #0f172a 배경, ClipboardList 아이콘, "새 상담 시작" 제목
- 상담 유형 섹션:
  - 일반 상담: Search 아이콘 + #eff6ff 배경의 카드
  - HA Protocol: 2x2 그리드, 선택된 항목 border-orange + bg-orange-50
  - 각 단계에 lucide 아이콘: 1차(Stethoscope), 2차(Settings), 3차(SlidersHorizontal), 사후(ShieldCheck)
- 방문 정보 섹션:
  - 방문 날짜: date input (기본값: 오늘)
  - 방문 목적: 자동 채워짐 (선택한 유형에 따라)
  - 방문 메모: textarea (선택사항)
- 버튼: 취소(outline) + "상담 시작 →"(blue-600, ArrowRight 아이콘)

**Visit 객체 변경**:
- 기존 필드 모두 유지
- 추가: `visit_memo?: string` — 방문 시 간단 메모

### 4. 탭 완료 배지

**위치**: 기존 탭 바의 각 탭 이름 옆

**배지 디자인**:
- 완료: 초록 원(#16a34a), 흰색 ✓, 18x18px
- 진행중: 오렌지 원(#f97316), 흰색 ·, 18x18px
- 미입력: 슬레이트 원(#e2e8f0), #94a3b8 —, 18x18px

**탭 아이콘** (기존 CRM에서 사용하는 것과 동일):
- 상담 설문지: FileText, text-blue-600
- 순음검사: Activity, text-orange-600
- 어음검사: Headphones, text-purple-600
- HA 프로토콜: CheckCircle2, text-orange-600

**판정 로직** (각 탭별):
- 상담 설문지:
  - 미입력: `q_customer_{id}` 또는 `q_{visitId}`가 localStorage에 없음
  - 진행중: 데이터 존재하지만 motivations 또는 COSI goals가 비어있음
  - 완료: motivations + COSI goals + APHAB/HHIE 점수가 모두 입력됨
- 순음검사:
  - 미입력: `pta_{visitId}`가 없음
  - 진행중: 데이터 존재하지만 좌우 AC 중 하나만 입력됨
  - 완료: 좌우 AC 모두 입력됨
- 어음검사:
  - 미입력: `speech_{visitId}`가 없음
  - 진행중: 데이터 존재하지만 SRT/WRS 중 일부만 입력됨
  - 완료: 좌우 SRT + WRS 모두 입력됨
- HA 프로토콜:
  - 미입력: `hasession_{visitId}`가 없음
  - 진행중: 데이터 존재하지만 필수 항목 중 미완료 있음
  - 완료: 필수 항목 모두 DONE

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `components/VisitManager.tsx` | 스텝 인디케이터, 방문 요약 바, 하단 네비게이션, 탭 배지 추가 |
| `components/HaProtocolTab.tsx` | 인라인 에디터 제거, 검사 결과 요약 카드 추가 |
| `components/PureToneAudiogram.tsx` | 중이검사(MiddleEarEditor) 아코디언 섹션 추가 |
| `components/SpeechTestForm.tsx` | 음장검사(SoundFieldEditor) + 검증(VerificationEditor) 아코디언 추가 |
| `app/page.tsx` | 방문 생성 모달 2단계로 개편, visit_memo 필드 추가 |
| `types.ts` | Visit 인터페이스에 `visit_memo?: string` 추가 |

## 신규 파일

| 파일 | 용도 |
|------|------|
| `components/StepIndicator.tsx` | 프로그레스 라인 스텝 인디케이터 컴포넌트 |
| `components/VisitSummaryBar.tsx` | 방문 요약 바 (고객명, 유형, 날짜, 진행률) |
| `components/TestSummaryCards.tsx` | HA 프로토콜 탭용 검사 결과 요약 카드 그리드 |
| `utils/completionUtils.ts` | 탭별 완료 상태 판정 로직 |

## 변경하지 않는 것

- localStorage 키 구조
- API/데이터 모델 (visit_memo 추가 외)
- 사이드바 네비게이션
- 상담 설문지(QuestionnaireForm) 내부 구조
- 순음검사/어음검사 기존 입력 UI
- 체크리스트 아이템 구조
- 블로그 포스팅, 백업/복원, 이미지 캡처 기능
- 기존 에디터 컴포넌트 자체 (위치만 이동)
