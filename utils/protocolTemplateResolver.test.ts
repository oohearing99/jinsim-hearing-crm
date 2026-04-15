import { describe, it, expect } from 'vitest';
import { resolveTemplate } from './protocolTemplateResolver';
import type { Visit } from '../types';

const base = { visit_motives: [] } as unknown as Visit;

describe('resolveTemplate', () => {
  it('INITIAL → INITIAL template', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'INITIAL' });
    expect(t.some(i => i.key === 'intake_review')).toBe(true);
  });
  it('FITTING 1차 → HA_1', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'FITTING', fitting_session_no: 1 });
    expect(t.some(i => i.key === 'cosi_goals_set')).toBe(true);
  });
  it('FITTING 5차 → EXTRA', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'FITTING', fitting_session_no: 5 });
    expect(t.some(i => i.key === 'issue_identification')).toBe(true);
  });
  it('AFTERCARE M12 → 청력재검 포함', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'AFTERCARE', aftercare_bucket: 'M12', aftercare_month: 12 });
    expect(t.some(i => i.key === 'pure_tone_ac' && i.required)).toBe(true);
  });
  it('AFTERCARE bucket 누락 시 month로 derive', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'AFTERCARE', aftercare_month: 24 });
    expect(t.some(i => i.key === 'device_lifecycle_review')).toBe(true);
  });
  it('SERVICE', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'SERVICE' });
    expect(t.some(i => i.key === 'device_inspection')).toBe(true);
  });
  it('REFUND_EXCHANGE', () => {
    const t = resolveTemplate({ ...base, visit_purpose: 'REFUND_EXCHANGE' });
    expect(t.some(i => i.key === 'refund_exchange_decision')).toBe(true);
  });
});
