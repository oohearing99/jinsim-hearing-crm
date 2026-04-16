# Vercel 배포 설정 가이드

## 초기 설정 (최초 1회)

### 1. Vercel 프로젝트 연결

```bash
# Vercel CLI 설치
npm install -g vercel

# 로그인
vercel login

# 프로젝트 연결 (프로젝트 루트에서)
cd C:/Users/oohea/jinsim-hearing-crm
vercel link
```

또는 **웹 UI**: https://vercel.com/new → GitHub에서 `jinsim-hearing-crm` 임포트.

### 2. 환경변수 설정 (필요 시)

현재 프로젝트는 localStorage 기반이므로 DB 연결 환경변수는 없음. Gemini API 키가 필요한 경우:

```bash
vercel env add GEMINI_API_KEY production
vercel env add GEMINI_API_KEY preview
```

### 3. Production 도메인 설정

Vercel 대시보드 → Project Settings → Domains → 원하는 도메인 연결.

## 배포 워크플로우

### Production (main 브랜치)

```bash
git checkout main
git merge feat/visit-manager-ux-redesign
git push origin main
```

→ GitHub Actions CI 통과 → Vercel 자동 배포 → `https://<project>.vercel.app`

### Preview (feature 브랜치)

모든 PR은 자동으로 Preview URL 생성:
`https://<project>-git-feat-visit-manager-ux-redesign.vercel.app`

PR 댓글에 Vercel bot이 Preview 링크 자동 게시.

### Rollback

```bash
vercel rollback <deployment-url>
```

또는 Vercel 대시보드 → Deployments → 이전 배포 선택 → Promote to Production.

## CI/CD 흐름

```
git push → GitHub Actions (test + build + lint)
                ↓
            PR merge to main
                ↓
          Vercel auto-deploy
                ↓
         Production URL 갱신
```

## 검증 체크리스트 (배포 후)

- [ ] Vercel Preview URL 접속 가능
- [ ] 고객 검색 → 방문 → 상담 설문지 탭 → 4-스텝 위저드 동작
- [ ] 순음검사 탭 → 차트 클릭 입력 동작
- [ ] HA 프로토콜 탭 → Top 5 패널 + 접이식 동작
- [ ] 고객 상세 → JourneyDashboard 상단 노출
- [ ] 브라우저 콘솔에서 `localStorage` 접근 가능 (InputTimer 키)

## 청능사 파일럿 배포 전략

### Phase A: Preview URL 공유 (1-2일)
- PR의 Vercel Preview URL을 청능사 1명에게 공유
- 사용성 피드백 수집, 블로커 파악

### Phase B: Production 배포 (머지 후)
- main 머지 → 자동 배포
- 파일럿 청능사 3-5명 접근 가능
- 1주일 실사용

### Phase C: 데이터 회수
브라우저 콘솔(F12)에서:

```js
// 문진 중앙값
const q = JSON.parse(localStorage.getItem('jhcrm:inputTimer:questionnaire') || '[]');
const qMed = q.map(s => s.durationMs).sort((a,b) => a-b);
console.log('Questionnaire sessions:', q.length, 'median ms:', qMed[Math.floor(qMed.length/2)]);

// HA 프로토콜 중앙값
const h = JSON.parse(localStorage.getItem('jhcrm:inputTimer:ha-protocol') || '[]');
const hMed = h.map(s => s.durationMs).sort((a,b) => a-b);
console.log('HA sessions:', h.length, 'median ms:', hMed[Math.floor(hMed.length/2)]);
```

복사해서 다음 템플릿에 입력:

```
청능사 ID: ___
측정 기간: ___
문진 세션 수: ___
문진 중앙값(초): ___
HA 세션 수: ___
HA 중앙값(초): ___
```

## Troubleshooting

| 증상 | 원인 | 해결 |
|------|------|------|
| Build fails on Vercel | Node 버전 불일치 | `package.json`에 `"engines": { "node": ">=20" }` 추가 |
| localStorage 초기화 | 배포마다 도메인 바뀜 | production은 커스텀 도메인 사용 |
| 느린 콜드 스타트 | Recharts 대용량 | `next/dynamic`으로 lazy load (후속 최적화) |
| Preview URL 접근 불가 | Vercel 프리뷰 protection 기본값 | Settings → Deployment Protection → Only main |
