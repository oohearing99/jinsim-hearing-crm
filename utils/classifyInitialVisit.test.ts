import { describe, it, expect } from 'vitest';
import { classifyGeneralVisit } from './classifyInitialVisit';

const signals = {
  hasAudiogram: false,
  hasQuestionnaire: false,
  hasHearingAidExperience: false,
  isFirstVisit: false,
};

describe('classifyGeneralVisit (signal-based)', () => {
  it('첫 방문 + 문진표 + audiogram → INITIAL', () => {
    expect(classifyGeneralVisit({ ...signals, isFirstVisit: true, hasAudiogram: true, hasQuestionnaire: true })).toBe('INITIAL');
  });
  it('첫 방문이지만 기존 착용자 신호 → SERVICE (이관 케이스)', () => {
    expect(classifyGeneralVisit({ ...signals, isFirstVisit: true, hasHearingAidExperience: true })).toBe('SERVICE');
  });
  it('재방문 + 문진표/audiogram 없음 → SERVICE', () => {
    expect(classifyGeneralVisit({ ...signals, isFirstVisit: false })).toBe('SERVICE');
  });
  it('첫 방문 + 문진표만 있음 (audiogram 없음) → INITIAL', () => {
    expect(classifyGeneralVisit({ ...signals, isFirstVisit: true, hasQuestionnaire: true })).toBe('INITIAL');
  });
});
