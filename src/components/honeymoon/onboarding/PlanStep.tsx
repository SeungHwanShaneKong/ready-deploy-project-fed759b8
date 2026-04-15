/**
 * 여행 계획 단계
 * 섹션: 일정 편집 / 비용 계산기 / 예약 타임라인
 */

import { useState, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  Plane, Calculator, Calendar, Search, Plus, Minus,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, X } from 'lucide-react';
import { formatKoreanWon } from '@/lib/format-currency';
import { cn } from '@/lib/utils';
import { DESTINATIONS, getDestinationById } from '@/lib/honeymoon-destinations';
import type { Destination } from '@/lib/honeymoon-destinations';
import type { TravelProfile } from '@/lib/honeymoon-profile';

// [CL-PLAN-ADD-DEST-NOMAP-20260405-210000] onGoToMap 제거
interface PlanStepProps {
  selectedDestinations: Destination[];
  profile?: TravelProfile;
  onComplete: () => void;
  onBack: () => void;
}

type BudgetTier = 'economy' | 'standard' | 'luxury';

const TIER_LABELS: Record<BudgetTier, string> = {
  economy: '절약형',
  standard: '표준형',
  luxury: '럭셔리',
};

const TIER_MULTIPLIER: Record<BudgetTier, (min: number, max: number) => number> = {
  economy: (min) => min,
  standard: (min, max) => Math.round((min + max) / 2),
  luxury: (_, max) => max,
};

const PIE_COLORS = ['#3b82f6', '#22c55e', '#f97316'];

// ── 정렬 가능한 아이템 ──

// [CL-SKIP-SCHEDULE-20260405-220000] nights 편집 기능 추가
function SortableDestItem({
  destination, index, nights, onRemove, onNightsChange,
}: {
  destination: Destination;
  index: number;
  nights: number;
  onRemove: (id: string) => void;
  onNightsChange: (id: string, nights: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: destination.id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2.5 bg-background rounded-lg border border-border/50 group',
        isDragging && 'opacity-50 shadow-lg z-50',
      )}
    >
      <button
        className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
        {...attributes} {...listeners}
        aria-label="드래그하여 순서 변경"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-base">{destination.markerEmoji}</span>
          <span className="text-sm font-semibold text-foreground truncate">{destination.name}</span>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
          <span>{formatKoreanWon(destination.budgetRange.min)}~</span>
        </div>
      </div>
      {/* [CL-SKIP-SCHEDULE-20260405-220000] 숙박일 편집 (+/-) */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => onNightsChange(destination.id, Math.max(1, nights - 1))}
          disabled={nights <= 1}
          className="w-6 h-6 rounded-md bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="숙박일 감소"
        >
          <Minus className="w-3 h-3" />
        </button>
        <span className="text-xs font-bold text-foreground w-8 text-center tabular-nums">{nights}박</span>
        <button
          onClick={() => onNightsChange(destination.id, Math.min(30, nights + 1))}
          disabled={nights >= 30}
          className="w-6 h-6 rounded-md bg-muted/50 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          aria-label="숙박일 증가"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>
      <button
        onClick={() => onRemove(destination.id)}
        className="p-1 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
        aria-label={`${destination.name} 제거`}
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ── 메인 컴포넌트 ──

export function PlanStep({ selectedDestinations: initialDests, onComplete }: PlanStepProps) {
  // 일정 상태
  const [orderedIds, setOrderedIds] = useState<string[]>(() => initialDests.map(d => d.id));
  const [tier, setTier] = useState<BudgetTier>('standard');
  // [CL-SKIP-SCHEDULE-20260405-220000] 숙박일 오버라이드 (기본값: destination.nights)
  const [nightsOverrides, setNightsOverrides] = useState<Record<string, number>>({});
  // [CL-PLAN-ADD-DEST-NOMAP-20260405-210000] 여행지 추가 패널
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // [CL-PLAN-ADD-DEST-NOMAP-20260405-210000] 글로벌 DESTINATIONS에서 조회 (신규 추가 여행지 대응)
  const destinations = useMemo(
    () => orderedIds.map(id => getDestinationById(id)).filter(Boolean) as Destination[],
    [orderedIds],
  );

  // DnD 센서
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setOrderedIds(prev => {
      const oldIndex = prev.indexOf(active.id as string);
      const newIndex = prev.indexOf(over.id as string);
      return arrayMove(prev, oldIndex, newIndex);
    });
  }, []);

  const removeFromPlan = useCallback((id: string) => {
    setOrderedIds(prev => prev.filter(x => x !== id));
    setNightsOverrides(prev => { const next = { ...prev }; delete next[id]; return next; });
  }, []);

  // [CL-SKIP-SCHEDULE-20260405-220000] 숙박일 변경
  const handleNightsChange = useCallback((id: string, nights: number) => {
    setNightsOverrides(prev => ({ ...prev, [id]: nights }));
  }, []);

  // 특정 여행지의 숙박일 조회 (오버라이드 우선)
  const getNights = useCallback((d: Destination) => {
    return nightsOverrides[d.id] ?? d.nights;
  }, [nightsOverrides]);

  // [CL-PLAN-ADD-DEST-NOMAP-20260405-210000] 여행지 추가
  const addToPlan = useCallback((id: string) => {
    setOrderedIds(prev => {
      if (prev.includes(id)) return prev;
      return [...prev, id];
    });
    setSearchQuery('');
    setShowAddPanel(false);
  }, []);

  // [CL-PLAN-ADD-DEST-NOMAP-20260405-210000] 검색 필터
  const filteredDestinations = useMemo(() => {
    if (!showAddPanel) return [];
    const q = searchQuery.toLowerCase().trim();
    return DESTINATIONS.filter(d => {
      if (orderedIds.includes(d.id)) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q)
        || d.nameEn.toLowerCase().includes(q)
        || d.region.includes(q);
    });
  }, [showAddPanel, searchQuery, orderedIds]);

  // [CL-SKIP-SCHEDULE-20260405-220000] 비용 계산 — 숙박일 비례 스케일링
  // costBreakdown은 destination.nights 기준 총액 → 커스텀 숙박일에 비례 조정
  // flight는 숙박일 무관(고정), accommodation/local은 1박 단가 × 커스텀 숙박일
  const costs = useMemo(() => {
    const calc = TIER_MULTIPLIER[tier];
    let flight = 0, accommodation = 0, local = 0;
    destinations.forEach(d => {
      const customNights = getNights(d);
      const defaultNights = d.nights;
      const nightsRatio = defaultNights > 0 ? customNights / defaultNights : 1;

      flight += calc(d.costBreakdown.flight.min, d.costBreakdown.flight.max);
      accommodation += Math.round(calc(d.costBreakdown.accommodation.min, d.costBreakdown.accommodation.max) * nightsRatio);
      local += Math.round(calc(d.costBreakdown.local.min, d.costBreakdown.local.max) * nightsRatio);
    });
    return { flight, accommodation, local, total: flight + accommodation + local };
  }, [destinations, tier, getNights]);

  const pieData = useMemo(() => [
    { name: '항공', value: costs.flight },
    { name: '숙소', value: costs.accommodation },
    { name: '현지', value: costs.local },
  ], [costs]);

  // [CL-SKIP-SCHEDULE-20260405-220000] 커스텀 숙박일 반영
  const totalNights = destinations.reduce((sum, d) => sum + getNights(d), 0);

  // [CL-SKIP-SCHEDULE-20260405-220000] 커스텀 숙박일 반영 — moved up

  return (
    <div className="flex flex-col items-center w-full py-6">
      <h2 className="text-subheading text-foreground mb-2 animate-fade-up">
        여행 계획
      </h2>
      <p className="text-xs text-muted-foreground mb-6 animate-fade-up" style={{ animationDelay: '0.05s' }}>
        일정을 정리하고 예산을 확인하세요
      </p>

      {/* 섹션 1: 일정 편집 */}
      <div className="w-full bg-card rounded-xl border border-border overflow-hidden mb-4 animate-fade-up" style={{ animationDelay: '0.1s' }}>
        <div className="px-4 py-3 border-b border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Plane className="w-4 h-4 text-primary" />
            여행 일정
          </h3>
        </div>
        <div className="p-3">
          {destinations.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Plane className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">선택된 여행지가 없어요</p>
              {/* [CL-PLAN-ADD-DEST-NOMAP-20260405-210000] 빈 상태에서도 추가 가능 */}
              <button
                onClick={() => setShowAddPanel(!showAddPanel)}
                className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 border-2 border-dashed border-border/50 rounded-lg text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                여행지 추가
              </button>
              {showAddPanel && (
                <div className="mt-3 bg-muted/20 rounded-lg border border-border/50 p-3 animate-fade-up text-left">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="여행지 검색 (예: 발리, 파리, 동남아...)"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredDestinations.slice(0, 20).map(d => (
                      <button
                        key={d.id}
                        onClick={() => addToPlan(d.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-primary/5 transition-colors text-left"
                      >
                        <span className="text-base flex-shrink-0">{d.markerEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {d.region} · {d.nights}박 · {formatKoreanWon(d.budgetRange.min)}~
                          </p>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      </button>
                    ))}
                    {filteredDestinations.length === 0 && searchQuery && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        검색 결과가 없어요
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={orderedIds} strategy={verticalListSortingStrategy}>
                  <div className="space-y-1.5">
                    {destinations.map((dest, i) => (
                      <SortableDestItem key={dest.id} destination={dest} index={i} nights={getNights(dest)} onRemove={removeFromPlan} onNightsChange={handleNightsChange} />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>

              {/* [CL-PLAN-ADD-DEST-NOMAP-20260405-210000] 여행지 추가 버튼 + 검색 패널 */}
              <button
                onClick={() => setShowAddPanel(!showAddPanel)}
                className="w-full mt-2 flex items-center justify-center gap-1.5 py-2 border-2 border-dashed border-border/50 rounded-lg text-xs text-muted-foreground hover:border-primary/30 hover:text-primary transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                여행지 추가
              </button>

              {showAddPanel && (
                <div className="mt-2 bg-muted/20 rounded-lg border border-border/50 p-3 animate-fade-up">
                  <div className="relative mb-2">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="여행지 검색 (예: 발리, 파리, 동남아...)"
                      className="w-full pl-8 pr-3 py-2 text-xs bg-background border border-border/50 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-1">
                    {filteredDestinations.slice(0, 20).map(d => (
                      <button
                        key={d.id}
                        onClick={() => addToPlan(d.id)}
                        className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-primary/5 transition-colors text-left"
                      >
                        <span className="text-base flex-shrink-0">{d.markerEmoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{d.name}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {d.region} · {d.nights}박 · {formatKoreanWon(d.budgetRange.min)}~
                          </p>
                        </div>
                        <Plus className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      </button>
                    ))}
                    {filteredDestinations.length === 0 && searchQuery && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        검색 결과가 없어요
                      </p>
                    )}
                    {filteredDestinations.length > 20 && (
                      <p className="text-[10px] text-muted-foreground text-center pt-1">
                        검색어를 더 입력하여 결과를 좁혀보세요
                      </p>
                    )}
                  </div>
                </div>
              )}

              {destinations.length >= 2 && (
                <div className="flex items-center justify-center gap-1 mt-2 text-[10px] text-muted-foreground">
                  {destinations.map((d, i) => (
                    <span key={d.id} className="flex items-center gap-1">
                      <span className="font-medium">{d.name}</span>
                      {i < destinations.length - 1 && <span className="text-orange-400">→</span>}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-3 border-t border-border/50 flex justify-between text-xs">
                <span className="text-muted-foreground">총 일정</span>
                <span className="font-bold text-foreground">{totalNights}박</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 섹션 2: 비용 계산기 */}
      {destinations.length > 0 && (
        <div className="w-full bg-card rounded-xl border border-border overflow-hidden mb-4 animate-fade-up" style={{ animationDelay: '0.15s' }}>
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <Calculator className="w-4 h-4 text-primary" />
                총 예상 비용
              </h3>
              <span className="text-lg font-bold text-primary">{formatKoreanWon(costs.total)}</span>
            </div>
          </div>
          <div className="p-4">
            {/* Tier selector */}
            <div className="flex gap-1 mb-4 p-1 bg-muted/50 rounded-lg">
              {(Object.keys(TIER_LABELS) as BudgetTier[]).map(t => (
                <button
                  key={t}
                  onClick={() => setTier(t)}
                  className={cn(
                    'flex-1 text-xs py-1.5 rounded-md font-medium transition-all',
                    tier === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {TIER_LABELS[t]}
                </button>
              ))}
            </div>

            {/* Donut chart + breakdown */}
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={25} outerRadius={40} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {pieData.map((_, i) => (<Cell key={i} fill={PIE_COLORS[i]} />))}
                    </Pie>
                    <Tooltip formatter={(value: number) => formatKoreanWon(value)} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-1 space-y-2">
                {pieData.map((entry, i) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i] }} />
                      <span className="text-muted-foreground">
                        {entry.name === '항공' ? '✈️' : entry.name === '숙소' ? '🏨' : '🎯'} {entry.name}
                      </span>
                    </div>
                    <span className="font-semibold text-foreground">{formatKoreanWon(entry.value)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 도시별 비용 */}
            <div className="mt-3 pt-3 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground mb-1.5">도시별 비용 ({TIER_LABELS[tier]})</p>
              <div className="space-y-1">
                {destinations.map(d => {
                  const calc = TIER_MULTIPLIER[tier];
                  // [CL-SKIP-SCHEDULE-20260405-220000] 도시별 비용도 숙박일 비례 스케일링
                  const customNights = getNights(d);
                  const defaultNights = d.nights;
                  const nightsRatio = defaultNights > 0 ? customNights / defaultNights : 1;
                  const cityTotal =
                    calc(d.costBreakdown.flight.min, d.costBreakdown.flight.max) +
                    Math.round(calc(d.costBreakdown.accommodation.min, d.costBreakdown.accommodation.max) * nightsRatio) +
                    Math.round(calc(d.costBreakdown.local.min, d.costBreakdown.local.max) * nightsRatio);
                  const pct = costs.total > 0 ? Math.round((cityTotal / costs.total) * 100) : 0;
                  return (
                    <div key={d.id} className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-1">
                        <span>{d.markerEmoji}</span>
                        <span className="text-foreground font-medium">{d.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/60 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="font-medium text-foreground w-16 text-right">{formatKoreanWon(cityTotal)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 섹션 3: 예약 타임라인 */}
      {destinations.length > 0 && (
        <div className="w-full bg-card rounded-xl border border-border p-4 mb-6 animate-fade-up" style={{ animationDelay: '0.25s' }}>
          <h3 className="text-sm font-semibold text-foreground mb-1 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-primary" />
            예약 타임라인
          </h3>
          <div className="space-y-2.5 mt-2">
            {[
              { emoji: '✈️', title: '항공권 예약', desc: `출국 ${destinations[0]?.bestBookingWeeks ?? 12}주 전 예약 시 최저가` },
              { emoji: '🏨', title: '숙소 예약', desc: '3개월 전 예약 권장 (인기 숙소 마감 대비)' },
              { emoji: '🛂', title: destinations.some(d => d.visaRequired) ? '비자 준비' : '비자', desc: destinations.some(d => d.visaRequired) ? '출국 2개월 전까지 비자 신청 완료' : '무비자 (여권 유효기간 6개월 이상 확인)' },
              { emoji: '🛡️', title: '여행자 보험', desc: '출국 1주 전까지 가입 (2인 5~10만원)' },
              { emoji: '💱', title: '환전', desc: '출국 2주 전 환전 추천 (수수료 비교)' },
            ].map((step, index) => {
              const isCompleted = false;
              const isCurrent = index === 0;

              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-full transition-all',
                      isCompleted && 'bg-green-100',
                      isCurrent && 'bg-primary/10 ring-2 ring-primary',
                      !isCompleted && !isCurrent && 'bg-muted/50',
                    )}>
                      {isCompleted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                      ) : (
                        <span className={cn('text-sm', isCurrent && 'animate-pulse-subtle')}>{step.emoji}</span>
                      )}
                    </div>
                    {index < 4 && (
                      <div className={cn('w-px h-3 mt-0.5', isCompleted ? 'bg-green-300' : 'bg-border')} />
                    )}
                  </div>
                  <div className="flex-1 pb-0.5">
                    <p className={cn(
                      'text-[11px] font-semibold',
                      isCompleted && 'text-green-600',
                      isCurrent && 'text-primary',
                      !isCompleted && !isCurrent && 'text-muted-foreground',
                    )}>{step.title}</p>
                    <p className={cn(
                      'text-[10px] mt-0.5',
                      !isCompleted && !isCurrent ? 'text-muted-foreground/60' : 'text-muted-foreground',
                    )}>{step.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="w-full max-w-sm space-y-3 animate-fade-up" style={{ animationDelay: '0.3s' }}>
        <Button
          size="lg"
          onClick={onComplete}
          className="w-full rounded-2xl py-5 text-base font-semibold shadow-primary-glow"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          일정 저장하기
        </Button>

      </div>
    </div>
  );
}
