# 허니문AI 🌴✈️

> AI가 취향과 예산에 맞는 신혼여행지를 추천해주는 서비스

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)](https://supabase.com/)

## ✨ 주요 기능

| 단계 | 설명 |
|------|------|
| 🏆 **이미지 월드컵** | 16개 여행지 사진 중 15매치 토너먼트로 취향 분석 |
| 🤖 **AI 분석** | 취향·예산·기간 기반 맞춤 여행지 5곳 추천 (OpenAI) |
| 📊 **레이더 차트 비교** | 예산/기간/컨셉/비자/매칭점수 5축 비교 |
| 📅 **일정 만들기** | 드래그&드롭 순서 편집 + tier별 비용 계산 |
| 💬 **카카오톡 공유** | 3단 폴백: Kakao SDK → Web Share API → Clipboard |

### 🎯 차별점
- **로그인 불필요** — anonymous UUID로 즉시 시작
- **100+ 여행지** — 전 대륙 커버
- **완전 무료**

## 🚀 빠른 시작

```bash
# 저장소 클론
git clone https://github.com/SeungHwanShaneKong/honeyMoon.git
cd honeyMoon

# 의존성 설치
npm install

# 개발 서버 기동
npm run dev
```

→ http://localhost:8080/ 에 접속

### 프로덕션 빌드

```bash
npm run build       # dist/ 생성
npm run preview     # 프로덕션 빌드 로컬 프리뷰
```

> 💡 빌드 시 메모리 부족 발생 시: `NODE_OPTIONS="--max-old-space-size=4096" npm run build`

## 🛠️ 기술 스택

- **Frontend**: React 18 + TypeScript 5.8 + Vite 5.4 (SWC)
- **UI**: shadcn/ui (Radix UI) + Tailwind CSS 3.4 + Lucide
- **Routing**: React Router v6
- **State**: React Context + TanStack React Query
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **AI**: OpenAI GPT-4.1-mini (Edge Function 경유)
- **Charts**: Recharts (RadarChart, PieChart)
- **Drag & Drop**: @dnd-kit
- **Sharing**: Kakao JS SDK

## 📁 프로젝트 구조

```
src/
├── pages/              # Landing, Auth, Honeymoon, NotFound
├── components/
│   ├── ui/             # shadcn/ui 프리미티브
│   └── honeymoon/
│       └── onboarding/ # Welcome → WorldCup → Budget → Loading → Results → Compare → Plan
├── hooks/              # useAuth, useHoneymoonPlanner, useHoneymoonOnboarding, useSEO
├── lib/                # honeymoon-*, edge-function-*, kakao-share, format-currency
└── integrations/       # Supabase 클라이언트

supabase/
└── functions/
    └── honeymoon-planner/  # OpenAI 큐레이션 Edge Function
```

## 🔧 환경 변수

`.env.local` 생성 (`.env.example` 참조):

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_KAKAO_APP_KEY=your-kakao-js-key   # 선택 (없으면 Web Share API 폴백)
VITE_SITE_URL=https://your-domain.com   # 선택
```

## 🧪 테스트

```bash
npm run test          # Vitest (run once)
npm run test:watch    # Vitest (watch mode)
npm run lint          # ESLint
npx tsc --noEmit      # TypeScript 타입 검증
```

## 📜 라이선스

이 프로젝트는 개인 용도로 작성되었습니다.

## 👤 작성자

**Shane Kong** ([@SeungHwanShaneKong](https://github.com/SeungHwanShaneKong))

---

<sub>🤖 Built with assistance from Claude Code</sub>
