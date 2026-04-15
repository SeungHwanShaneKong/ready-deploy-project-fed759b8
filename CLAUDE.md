# 허니문AI

## Tech Stack
- **Framework**: React 18 + TypeScript 5.8 + Vite 5.4 (SWC)
- **UI**: shadcn/ui (Radix UI) + Tailwind CSS 3.4 + Lucide icons
- **Routing**: React Router v6
- **State**: React Context + TanStack React Query v5
- **Database**: Supabase (PostgreSQL + Auth)
- **AI**: OpenAI API (Edge Functions 경유)
- **Charts**: Recharts (RadarChart, PieChart)
- **Drag & Drop**: @dnd-kit
- **Sharing**: Kakao JS SDK

## Project Structure
```
src/
├── pages/           # Landing, Auth, Honeymoon, NotFound
├── components/
│   ├── ui/          # shadcn/ui 프리미티브
│   └── honeymoon/   # 허니문 온보딩 (7단계) + DestinationDetailSheet
│       └── onboarding/  # Welcome, WorldCup, Budget, Loading, Results, Compare, Plan
├── hooks/           # useAuth, useHoneymoonPlanner, useHoneymoonOnboarding, useSEO
├── lib/             # honeymoon-*, edge-function-*, kakao-share, utils, format-currency
└── integrations/    # Supabase 클라이언트
```

## Commands
- `npm run dev` — Dev server (port 8080)
- `npm run build` — Production build (메모리 부족 시 `NODE_OPTIONS="--max-old-space-size=4096"` 접두)
- `npm run lint` — ESLint
- `npm run test` — Vitest

## 핵심 플로우
Welcome → 이미지 월드컵 (15매치) → 예산 슬라이더 → AI 추천 로딩 → 결과 (5곳) → 레이더 차트 비교 → 여행 계획 → 카카오톡 공유

## 비로그인 지원
- 로그인 없이 전체 플로우 이용 가능
- anonymous UUID (`honeymoon_anonymous_id`)로 localStorage 상태 관리
- Edge Function은 Supabase anon key로 호출

---

## Work Rules (필수 준수)

### 1. 100인 MECE 에이전트 팀 상시 운영
모든 업무마다 프로젝트에 최적화된 100명의 MECE 역할 에이전트 중 가장 적합한 **11인 팀**을 편성. 반드시 **1인은 Supervisor/PM**으로 배치하여 팀원이 불필요한 방향으로 빠지지 않도록 코칭하며 최고 성과를 달성.

### 2. 더 나은 방안 선제 제시
사용자의 명령이 최고라고 단순히 따르지 말고, **항상 더 좋은 대안을 분석·제시**한 뒤 수행. 사용자가 미처 고려하지 못한 개선점, 리스크, 최적화 기회를 선제적으로 도출.

### 3. Agentic 10x 계획 수립
Claude Code Agentic Harness 기반이되 **10배 우수한 형식**으로 계획 수립. 전체 코드를 완벽히 이해한 상태에서 아주 구체적인 계획으로 세심·꼼꼼하게 확인 후 수행.

### 4. 로그 기반 디버깅 필수
계획대로 작동하지 않거나 오류 발생 시 **반드시 로그(log) 데이터를 먼저 확인**하고 해결 방법을 찾는 것을 필수 절차로 한다.

### 5. 3회 검증 원칙
수정 완료 전 서로 다른 시나리오로 **3번 확인** 후 정상 작동 시에만 완료 처리.

### 6. Revert 추적
모든 코드 변경에 고유 코드 + timestamp(초 단위)를 명시하여 추후 revert 가능하도록 함.
예: `// [CL-HONEYMOON-CLEANUP-20260412-220530]`

### 7. 진척도 & 토큰 공유
5% 간격으로 진척도를 출력하고, 매번 남은 토큰 비율(%)도 함께 알림.

### 8. 완료 메시지
모든 작업 완료 시 `"행복해! 참으로 감사한 삶이다! 작업 완료!"` 출력.

### 9. GitHub 반영 원칙
즉각 반영하지 않고, 사용자가 명시적으로 지시할 때만 push.

---

## 교훈 (반복 실수 방지)

### L-01: Windows 빌드 OOM
**증상**: esbuild 0.21.5 Go 바이너리가 Windows에서 `VirtualAlloc` 실패.
**해결**: (1) 불필요 프로세스(Slack 등) 종료로 ~600MB 이상 여유 확보 (2) `NODE_OPTIONS="--max-old-space-size=4096"` 사용.
**교훈**: Windows에서 빌드 전 메모리 여유가 9GB 이상 확보되어야 안정.

### L-02: import 일괄 변경 시 sed 우선
tsx/ts 파일 10개 이상 일괄 수정이 필요하면 개별 Edit 대신 `sed -i` 스크립트로 처리. 단, 반드시 결과를 Grep으로 검증.

### L-03: 삭제 전 의존성 역추적
어떤 파일이 "사용 안 되는 것 같다"고 판단되어도 **반드시** `grep -rl "이름" src/` 로 역참조 확인 후 삭제. UI 라이브러리 내부 이름 충돌(`CardFooter` 등) 주의.

### L-04: Edge Function JWT 선택적 처리
비로그인 모드 지원 시 `getAuthToken()`은 token 없으면 **null 반환**. fetch에서 `token ?? EDGE_FUNCTION_KEY`로 anon key 폴백. 이전에 throw로 구현하여 비로그인 경로가 끊겼던 이슈 재발 방지.

### L-05: 순환 참조 → 단일 vendor 청크
React.createContext undefined 에러는 Rollup manualChunks 순환 참조에서 발생. 의심 시 `'vendor'` 단일 청크로 통합하여 해결.

### L-06: Plan Mode 종료 시 ExitPlanMode 필수
Plan Mode에서 계획 수립 후 반드시 `ExitPlanMode` 호출. 계획 파일만 작성하고 종료하면 유저가 승인할 수 없음.

### L-07: 사용자 명령 즉시 수행 금지, 대안 제시 우선
명령 수행 전 1초 멈춰서 "더 나은 방법은 없는가?"를 점검. 예: "카카오 공유" 요청 시 Kakao SDK 미설치 환경을 위해 Web Share API + 클립보드 3단 폴백 추가 설계.

### L-08: 유틸 함수 시그니처 확인 후 호출
**증상**: `getAppSpecificGuide(browserInfo.appName)` → 실제 시그니처는 `(detectedApp, isIOS, isAndroid)` + `BrowserInfo`의 필드는 `detectedApp`임.
**교훈**: 외부 유틸 호출 시 **함수 시그니처 + 리턴 타입을 먼저 확인**하고 쓸 것. 새 파일 작성 시 IDE의 `Go to Definition`으로 검증.
**How to apply**: 코드 작성 직후 즉시 `tsc --noEmit`으로 타입 검증 (빌드 기다리지 말고).

### L-09: 이미지 매칭은 "신뢰 목록" 방식이 안전
**증상**: 100개 여행지 Unsplash URL 중 일부가 generic 이미지 → 라벨 불일치.
**교훈**: URL 존재성·중복 체크만으로는 semantic matching을 보장 못함. **수동 검증된 화이트리스트(Set)** 를 관리하고, 불확실한 것은 그래디언트 fallback.
**How to apply**: `VERIFIED_PHOTO_IDS` Set + `isVerifiedPhoto(url)` 헬퍼로 게이팅.

### L-10: Background command에 `timeout`만으로 불충분 — 명시적 kill 필요
**증상**: `vite preview` 백그라운드 실행 → 작업 완료 후에도 node 프로세스가 남아 메모리 점유.
**교훈**: 백그라운드 dev/preview 서버 쓰고 나면 `Stop-Process -Name node -Force`로 명시적 정리. 안 그러면 이후 빌드에서 OOM 발생.

### L-11: 데이터 엔트리의 세분성 원칙
**증상**: DESTINATIONS에 `id:'europe'` (광역 "유럽") 엔트리가 파리·로마 등 구체 도시와 같은 레벨로 존재 → 월드컵 후보로 generic 항목이 나와 UX 저하.
**교훈**: 여행지 데이터는 항상 **도시·랜드마크 수준**으로 세분화. 대륙·국가 단위 엔트리는 사용자 의도와 맞지 않음.
**How to apply**: 새 destination 추가 시 "이보다 더 구체적인 하위 엔트리가 존재하는가?"를 체크.

### L-12: Web API 최신 기능은 폴백 필수
**증상**: `crypto.randomUUID()` — Safari <15.4, iOS <15.4, Chrome <92 미지원. 구형 기기에서 TypeError.
**교훈**: 최신 Web API 사용 시 **반드시 feature detection + 폴백** 구현.
**How to apply**: `typeof crypto?.randomUUID === 'function'` 체크 후 Math.random 기반 UUID v4 폴백.

### L-13: "불가능"이라고 말하기 전에 도구 전수 조사
**증상**: `gh` CLI가 PATH에 없다고 Pages 활성화를 사용자에게 떠넘김 → 실제로는 `C:\Program Files\GitHub CLI\gh.exe`에 설치되어 있었음.
**교훈**: "안 된다"고 하기 전에 ① `which`/경로 스캔 ② env var(`GITHUB_TOKEN` 등) ③ git config credential helper ④ MCP/Skill 도구까지 탐색.
**How to apply**: CLI 부재 판정 시 `ls "/c/Program Files/"` + `git config --list | grep credential`까지 확인.

### L-14: GitHub Pages SPA 배포 3종 세트
**증상**: GitHub Pages 서브패스 배포에서 vite `base` 미설정 시 asset 404, Router `basename` 미설정 시 라우팅 깨짐, 404.html 미생성 시 직접 URL 접근 시 실제 404.
**교훈**: Pages 서브패스 배포는 ① `vite.config.ts base: '/repo/'` ② `<BrowserRouter basename={import.meta.env.BASE_URL}>` ③ build 후 `cp dist/index.html dist/404.html` 3종 세트 필수.
**How to apply**: `deploy.yml`에 `cp dist/index.html dist/404.html` 단계 추가, `base`/`basename`은 배포 레포명과 일치.

### L-15: 무료 플랜 Pages는 public 레포만 지원
**증상**: `ready-deploy-project-*` private 레포에 Pages API 호출 → HTTP 422 `"Your current plan does not support GitHub Pages for this repository"`.
**교훈**: 배포용 레포는 public으로 전환 필요. 전환 전 **반드시 시크릿 스캔** (`.env*` 추적 여부, SERVICE_ROLE/ghp_/sk- 패턴, Dockerfile hardcode).
**How to apply**: `gh repo edit <repo> --visibility public --accept-visibility-change-consequences` 전에 `git ls-files | grep -iE "\.env|secret"` + regex 스캔.
