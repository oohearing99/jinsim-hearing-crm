import type { HAStage } from '../types';

export interface JourneyVisitInput {
  id: string;
  visit_date: string;
  visit_type: 'GENERAL' | 'HA_PROTOCOL';
  ha_stage?: HAStage | null;
  completed?: boolean;
}

export interface JourneyEvent {
  id: string;
  date: string;
  label: string;
  stage?: HAStage | null;
  completed: boolean;
}

export interface JourneyState {
  currentStage: HAStage | null;
  timeline: JourneyEvent[];
  nextActionHint: string;
}

const STAGE_LABEL: Record<HAStage, string> = {
  HA_1: '1차 피팅',
  HA_2: '2차 피팅',
  HA_3: '3차 피팅',
  AFTERCARE_3MO: '3개월 사후관리',
};

const NEXT_STAGE: Record<HAStage, HAStage | ''> = {
  HA_1: 'HA_2',
  HA_2: 'HA_3',
  HA_3: 'AFTERCARE_3MO',
  AFTERCARE_3MO: '',
};

export function calculateJourneyState(visits: JourneyVisitInput[]): JourneyState {
  const sorted = [...visits].sort((a, b) => a.visit_date.localeCompare(b.visit_date));
  const timeline: JourneyEvent[] = sorted.map(v => ({
    id: v.id,
    date: v.visit_date,
    label: v.visit_type === 'HA_PROTOCOL' && v.ha_stage ? STAGE_LABEL[v.ha_stage] : '상담',
    stage: v.ha_stage ?? null,
    completed: v.completed ?? false,
  }));

  const latestHa = [...sorted].reverse().find(v => v.visit_type === 'HA_PROTOCOL' && v.ha_stage);
  const currentStage = latestHa?.ha_stage ?? null;

  let nextActionHint: string;
  if (sorted.length === 0) {
    nextActionHint = '첫 상담과 문진을 시작하세요';
  } else if (!latestHa || !currentStage) {
    nextActionHint = 'HA_1 단계 프로토콜을 시작하세요';
  } else if (!latestHa.completed) {
    nextActionHint = `${STAGE_LABEL[currentStage]} 단계의 남은 체크항목을 완료하세요`;
  } else {
    const n = NEXT_STAGE[currentStage];
    nextActionHint = n
      ? `${STAGE_LABEL[n]} 단계로 진행할 준비가 되었습니다`
      : '모든 HA 단계 완료 — 사후관리 유지';
  }

  return { currentStage, timeline, nextActionHint };
}
