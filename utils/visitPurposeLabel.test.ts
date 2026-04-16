import { describe, it, expect } from 'vitest';
import { formatVisitPurpose } from './visitPurposeLabel';
import type { Visit } from '../types';

const base = { id: '1', customer_id: 'c1', visit_date: '2026-04-15', visit_motives: [] } as unknown as Visit;

describe('formatVisitPurpose', () => {
  it('INITIAL', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'INITIAL' })).toBe('초진 상담');
  });
  it('FITTING with session', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'FITTING', fitting_session_no: 2 })).toBe('2차 피팅');
  });
  it('FITTING with purchase cycle 2 shows cycle suffix', () => {
    const v = { ...base, visit_purpose: 'FITTING' as const, fitting_session_no: 1, purchase_cycle_id: 'cycle-2' };
    expect(formatVisitPurpose(v)).toBe('1차 피팅 (재구매)');
  });
  it('AFTERCARE M3', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'AFTERCARE', aftercare_month: 3, aftercare_bucket: 'M3' })).toBe('3개월 사후관리');
  });
  it('AFTERCARE LONGTERM with month', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'AFTERCARE', aftercare_month: 24, aftercare_bucket: 'LONGTERM' })).toBe('24개월 사후관리');
  });
  it('SERVICE', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'SERVICE' })).toBe('AS · 수리');
  });
  it('REFUND_EXCHANGE', () => {
    expect(formatVisitPurpose({ ...base, visit_purpose: 'REFUND_EXCHANGE' })).toBe('반품 · 교환');
  });
});
