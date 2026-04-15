import { describe, it, expectTypeOf } from 'vitest';
import type { Visit, VisitPurpose, AftercareBucket } from '../types';

describe('Visit schema v3', () => {
  it('VisitPurpose has 5 members', () => {
    const values: VisitPurpose[] = ['INITIAL', 'FITTING', 'AFTERCARE', 'SERVICE', 'REFUND_EXCHANGE'];
    expectTypeOf(values).toEqualTypeOf<VisitPurpose[]>();
  });
  it('AftercareBucket has 4 members', () => {
    const values: AftercareBucket[] = ['M3', 'M6', 'M12', 'LONGTERM'];
    expectTypeOf(values).toEqualTypeOf<AftercareBucket[]>();
  });
  it('Visit includes purchase_cycle_id and primary_purpose_memo', () => {
    const v = {} as Visit;
    expectTypeOf(v.purchase_cycle_id).toEqualTypeOf<string | undefined>();
    expectTypeOf(v.primary_purpose_memo).toEqualTypeOf<string | undefined>();
    expectTypeOf(v.aftercare_bucket).toEqualTypeOf<AftercareBucket | undefined>();
  });
});
