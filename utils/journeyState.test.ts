import { describe, it, expect } from 'vitest';
import { calculateJourneyState, type JourneyVisitInput } from './journeyState';

const visits: JourneyVisitInput[] = [
  { id: 'v1', visit_date: '2026-01-10', visit_type: 'GENERAL' },
  { id: 'v2', visit_date: '2026-02-01', visit_type: 'HA_PROTOCOL', ha_stage: 'HA_1', completed: true },
  { id: 'v3', visit_date: '2026-03-01', visit_type: 'HA_PROTOCOL', ha_stage: 'HA_2', completed: false },
];

describe('calculateJourneyState', () => {
  it('returns current stage from latest HA visit', () => {
    expect(calculateJourneyState(visits).currentStage).toBe('HA_2');
  });
  it('returns ordered timeline events', () => {
    const events = calculateJourneyState(visits).timeline;
    expect(events).toHaveLength(3);
    expect(events[0].date).toBe('2026-01-10');
  });
  it('suggests next action for incomplete stage', () => {
    const hint = calculateJourneyState(visits).nextActionHint;
    expect(hint).toMatch(/2차 피팅|HA_2/);
  });
  it('handles empty visits', () => {
    const state = calculateJourneyState([]);
    expect(state.currentStage).toBeNull();
    expect(state.nextActionHint).toMatch(/첫 상담|문진/);
  });
  it('suggests next stage when current completed', () => {
    const v2done: JourneyVisitInput[] = [
      { id: 'v2', visit_date: '2026-02-01', visit_type: 'HA_PROTOCOL', ha_stage: 'HA_1', completed: true },
    ];
    const hint = calculateJourneyState(v2done).nextActionHint;
    expect(hint).toMatch(/HA_2|2차/);
  });
});
