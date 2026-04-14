import { describe, it, expect } from 'vitest';
import {
  QUESTIONNAIRE_STEPS,
  isStepComplete,
  firstIncompleteStep,
} from './questionnaireSteps';
import type { QuestionnaireData } from '../types';

describe('QUESTIONNAIRE_STEPS', () => {
  it('has 4 ordered steps', () => {
    expect(QUESTIONNAIRE_STEPS.map((s) => s.id)).toEqual([
      'basic',
      'history',
      'hearing',
      'cosi',
    ]);
  });

  it('every step has label and description', () => {
    for (const step of QUESTIONNAIRE_STEPS) {
      expect(step.label.length).toBeGreaterThan(0);
      expect(step.description.length).toBeGreaterThan(0);
    }
  });
});

describe('isStepComplete', () => {
  const blank = {} as QuestionnaireData;

  it('basic step requires visit_motives', () => {
    expect(isStepComplete('basic', blank)).toBe(false);
    expect(isStepComplete('basic', { ...blank, visit_motives: [] } as any)).toBe(false);
    expect(
      isStepComplete('basic', { ...blank, visit_motives: ['대화'] } as any)
    ).toBe(true);
  });

  it('history step requires hearing_test_experience', () => {
    expect(isStepComplete('history', blank)).toBe(false);
    expect(
      isStepComplete('history', { ...blank, hearing_test_experience: '' } as any)
    ).toBe(false);
    expect(
      isStepComplete('history', { ...blank, hearing_test_experience: 'Y' } as any)
    ).toBe(true);
  });

  it('hearing step requires diff rating OR better_ear', () => {
    expect(isStepComplete('hearing', blank)).toBe(false);
    expect(
      isStepComplete('hearing', { ...blank, better_ear: 'R' } as any)
    ).toBe(true);
    expect(
      isStepComplete('hearing', { ...blank, diff_quiet_1to1: 3 } as any)
    ).toBe(true);
    expect(
      isStepComplete('hearing', { ...blank, diff_background_noise: 0 } as any)
    ).toBe(true);
  });

  it('cosi step requires cosi_top3_goals', () => {
    expect(isStepComplete('cosi', blank)).toBe(false);
    expect(
      isStepComplete('cosi', { ...blank, cosi_top3_goals: [] } as any)
    ).toBe(false);
    expect(
      isStepComplete('cosi', {
        ...blank,
        cosi_top3_goals: [{ category: 'x', note: 'y' }],
      } as any)
    ).toBe(true);
  });
});

describe('firstIncompleteStep', () => {
  it('returns "basic" for empty data', () => {
    expect(firstIncompleteStep({})).toBe('basic');
  });

  it('returns "history" when only basic is complete', () => {
    expect(
      firstIncompleteStep({ visit_motives: ['대화'] } as any)
    ).toBe('history');
  });

  it('returns "hearing" when basic+history complete', () => {
    expect(
      firstIncompleteStep({
        visit_motives: ['대화'],
        hearing_test_experience: 'Y',
      } as any)
    ).toBe('hearing');
  });

  it('returns "cosi" when basic+history+hearing complete', () => {
    expect(
      firstIncompleteStep({
        visit_motives: ['대화'],
        hearing_test_experience: 'Y',
        better_ear: 'R',
      } as any)
    ).toBe('cosi');
  });

  it('returns "cosi" when all complete (fallback)', () => {
    expect(
      firstIncompleteStep({
        visit_motives: ['대화'],
        hearing_test_experience: 'Y',
        better_ear: 'R',
        cosi_top3_goals: [{ category: 'x', note: 'y' }],
      } as any)
    ).toBe('cosi');
  });
});
