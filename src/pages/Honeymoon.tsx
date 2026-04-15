/**
 * 허니문AI — 허니문 추천 메인 페이지
 * 7단계 플로우: welcome → worldcup → budget → loading → results → compare → plan → complete
 * 비로그인 사용자도 접근 가능 (anonymous UUID 사용)
 */
import { useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, RotateCcw, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useSEO } from '@/hooks/useSEO';
import { useHoneymoonPlanner } from '@/hooks/useHoneymoonPlanner';
import { useHoneymoonOnboarding } from '@/hooks/useHoneymoonOnboarding';
import { OnboardingShell } from '@/components/honeymoon/onboarding/OnboardingShell';
import { WelcomeStep } from '@/components/honeymoon/onboarding/WelcomeStep';
import { WorldCupStep } from '@/components/honeymoon/onboarding/WorldCupStep';
import { BudgetStep } from '@/components/honeymoon/onboarding/BudgetStep';
import { LoadingStep } from '@/components/honeymoon/onboarding/LoadingStep';
import { ResultsStep } from '@/components/honeymoon/onboarding/ResultsStep';
import { CompareStep } from '@/components/honeymoon/onboarding/CompareStep';
import { PlanStep } from '@/components/honeymoon/onboarding/PlanStep';
import { buildLocalFallbackResults } from '@/lib/honeymoon-profile';
import { getDestinationById } from '@/lib/honeymoon-destinations';
import { shareToKakao } from '@/lib/kakao-share';

// [CL-UUID-FALLBACK-20260412-233800] 비로그인 사용자를 위한 anonymous ID
// crypto.randomUUID()는 Safari <15.4, iOS <15.4, Chrome <92 미지원 → 폴백 구현
function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  // RFC4122 v4 폴백 (Math.random 기반)
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getAnonymousId(): string {
  const key = 'honeymoon_anonymous_id';
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = generateUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    // localStorage 접근 불가 (시크릿 모드 등) → 세션 단위 ID
    return generateUUID();
  }
}

export default function Honeymoon() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 로그인 사용자는 user.id, 비로그인은 anonymous UUID
  const userId = useMemo(() => user?.id ?? getAnonymousId(), [user?.id]);

  useSEO({
    title: '신혼여행 추천 - 허니문AI',
    description: 'AI가 취향과 예산에 맞는 신혼여행지를 추천해드려요.',
    path: '/honeymoon',
  });

  const onboarding = useHoneymoonOnboarding(userId);

  // 페이지 진입 시 항상 처음부터
  const initialMountRef = useRef(true);
  useEffect(() => {
    if (initialMountRef.current) {
      initialMountRef.current = false;
      onboarding.resetOnboarding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    curationResult,
    curateError,
    curateDestinations,
  } = useHoneymoonPlanner();

  // ── 온보딩 플로우 ──
  if (!onboarding.state.isComplete) {
    return (
      <OnboardingShell
        step={onboarding.state.step}
        progress={onboarding.progress}
        onBack={onboarding.goBack}
        onHome={() => navigate('/')}
      >
        {onboarding.state.step === 'welcome' && (
          <WelcomeStep
            onStart={() => onboarding.goToStep('worldcup')}
            onSkip={onboarding.completeOnboarding}
          />
        )}
        {onboarding.state.step === 'worldcup' && onboarding.currentMatch && (
          <WorldCupStep
            match={onboarding.currentMatch}
            round={onboarding.state.worldCupRound}
            onSelect={onboarding.selectWorldCupWinner}
          />
        )}
        {onboarding.state.step === 'budget' && (
          <BudgetStep
            value={onboarding.state.budget}
            onChange={onboarding.setBudget}
            onNext={() => onboarding.goToStep('loading')}
          />
        )}
        {onboarding.state.step === 'loading' && onboarding.state.profile && (
          <LoadingStep
            profile={onboarding.state.profile}
            onCurate={curateDestinations}
            curationResult={curationResult}
            curateError={curateError}
            onResults={onboarding.setAiResults}
            onFallback={onboarding.setAiResults}
            buildLocalFallback={buildLocalFallbackResults}
          />
        )}
        {onboarding.state.step === 'results' && onboarding.state.profile && onboarding.state.aiResults && (
          <ResultsStep
            profile={onboarding.state.profile}
            results={onboarding.state.aiResults}
            onComplete={() => onboarding.goToStep('compare')}
            onRetry={onboarding.resetOnboarding}
          />
        )}
        {onboarding.state.step === 'compare' && onboarding.state.profile && onboarding.state.aiResults && (
          <CompareStep
            results={onboarding.state.aiResults}
            profile={onboarding.state.profile}
            onGoToPlan={() => onboarding.goToStep('plan')}
            onBack={onboarding.goBack}
          />
        )}
        {onboarding.state.step === 'plan' && onboarding.state.profile && onboarding.state.aiResults && (
          <PlanStep
            selectedDestinations={(() => {
              const ids = new Set<string>();
              const ranking = onboarding.state.profile?.worldCupRanking;
              if (ranking) {
                ids.add(ranking.champion);
                ids.add(ranking.finalist);
                ranking.semiFinalists.forEach(id => ids.add(id));
              }
              onboarding.state.aiResults!.recommendations.forEach(r => {
                if (ids.size < 5) ids.add(r.destinationId);
              });
              return Array.from(ids)
                .map(id => getDestinationById(id))
                .filter(Boolean) as import('@/lib/honeymoon-destinations').Destination[];
            })()}
            profile={onboarding.state.profile}
            onComplete={onboarding.completeOnboarding}
            onBack={onboarding.goBack}
          />
        )}
      </OnboardingShell>
    );
  }

  // ── 완료 화면 ──
  const championDest = onboarding.state.profile?.worldCupRanking
    ? getDestinationById(onboarding.state.profile.worldCupRanking.champion)
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center space-y-6 animate-fade-up">
        {/* 성공 아이콘 */}
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>

        {/* 메시지 */}
        <div>
          <h2 className="text-xl font-bold text-foreground">나만의 허니문 계획 완성!</h2>
          <p className="text-sm text-muted-foreground mt-1">
            친구에게 결과를 공유해보세요
          </p>
        </div>

        {/* 프로필 요약 */}
        {onboarding.state.profile && (
          <div className="bg-card rounded-xl border border-border p-4 text-left animate-fade-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">{onboarding.state.profile.profileEmoji}</span>
              <span className="text-sm font-semibold text-foreground">{onboarding.state.profile.profileLabel}</span>
            </div>
            {championDest && (
              <p className="text-xs text-muted-foreground">
                🏆 추천 1위: {championDest.markerEmoji} {championDest.name}
              </p>
            )}
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-3 pt-2 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <Button
            size="lg"
            onClick={() => shareToKakao(onboarding.state.profile, championDest)}
            className="w-full rounded-2xl py-5 text-base font-semibold bg-[#FEE500] hover:bg-[#FDD835] text-[#391B1B]"
          >
            <Share2 className="w-5 h-5 mr-2" />
            카카오톡으로 공유하기
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => onboarding.resetOnboarding()}
            className="w-full rounded-2xl py-4 text-sm"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            다시 테스트하기
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="w-full text-xs text-muted-foreground"
          >
            홈으로 돌아가기
          </Button>
        </div>
      </div>
    </div>
  );
}
