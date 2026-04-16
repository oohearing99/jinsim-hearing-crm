import { describe, it, expect } from 'vitest';
import { AFTERCARE_TEMPLATES } from './aftercare';

describe('AFTERCARE templates', () => {
  it('4개 bucket 모두 정의', () => {
    expect(Object.keys(AFTERCARE_TEMPLATES).sort()).toEqual(['LONGTERM', 'M12', 'M3', 'M6']);
  });
  it('M12는 청력재검(pure_tone_ac) 필수 포함', () => {
    const m12 = AFTERCARE_TEMPLATES.M12;
    const retest = m12.find(i => i.key === 'pure_tone_ac');
    expect(retest).toBeDefined();
    expect(retest?.required).toBe(true);
  });
  it('M3는 청력재검 필수가 아님', () => {
    const m3 = AFTERCARE_TEMPLATES.M3;
    const retest = m3.find(i => i.key === 'pure_tone_ac');
    expect(retest?.required ?? false).toBe(false);
  });
  it('LONGTERM은 장기 착용자 이슈 체크 포함', () => {
    const lt = AFTERCARE_TEMPLATES.LONGTERM;
    expect(lt.some(i => i.key === 'device_lifecycle_review')).toBe(true);
  });
});
