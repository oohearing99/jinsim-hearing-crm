import type { Visit } from '../types';

export function formatVisitPurpose(v: Visit): string {
  switch (v.visit_purpose) {
    case 'INITIAL': return '초진 상담';
    case 'FITTING': {
      const n = v.fitting_session_no;
      const base = n ? `${n}차 피팅` : '피팅';
      const isSecondCycle = v.purchase_cycle_id && v.purchase_cycle_id !== 'cycle-1';
      return isSecondCycle ? `${base} (재구매)` : base;
    }
    case 'AFTERCARE':
      return v.aftercare_month ? `${v.aftercare_month}개월 사후관리` : '사후관리';
    case 'SERVICE': return 'AS · 수리';
    case 'REFUND_EXCHANGE': return '반품 · 교환';
  }
}

export function deriveAftercareBucket(month: number): 'M3' | 'M6' | 'M12' | 'LONGTERM' {
  if (month <= 3) return 'M3';
  if (month <= 6) return 'M6';
  if (month <= 12) return 'M12';
  return 'LONGTERM';
}
