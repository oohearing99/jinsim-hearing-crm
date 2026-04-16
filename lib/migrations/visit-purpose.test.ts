import { describe, it, expect, beforeEach } from 'vitest';
import { migrateVisitsV3 } from './visit-purpose';
import type { Visit } from '../../types';

const mk = (over: Partial<Visit>): Visit => ({
  id: over.id ?? 'v1', customer_id: over.customer_id ?? 'c1',
  visit_date: over.visit_date ?? '2026-01-01', visit_motives: [],
  brand_id: '', center_id: '', counselor_name: '', created_at: '', updated_at: '',
  visit_purpose: undefined as unknown as Visit['visit_purpose'],
  ...over,
});

describe('migrateVisitsV3', () => {
  beforeEach(() => { localStorage.clear(); });

  it('HA_1 → FITTING session 1 + purchase_cycle_id "cycle-1"', () => {
    const input = [mk({ visit_type: 'HA_PROTOCOL', ha_stage: 'HA_1' })];
    const out = migrateVisitsV3(input, { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0].visit_purpose).toBe('FITTING');
    expect(out[0].fitting_session_no).toBe(1);
    expect(out[0].purchase_cycle_id).toBe('cycle-1');
  });

  it('AFTERCARE_3MO → aftercare_bucket M3', () => {
    const input = [mk({ visit_type: 'HA_PROTOCOL', ha_stage: 'AFTERCARE_3MO' })];
    const out = migrateVisitsV3(input, { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0].visit_purpose).toBe('AFTERCARE');
    expect(out[0].aftercare_month).toBe(3);
    expect(out[0].aftercare_bucket).toBe('M3');
  });

  it('GENERAL 첫 방문 + 문진표 존재 → INITIAL (신호 기반)', () => {
    const v = mk({ id: 'v1', visit_type: 'GENERAL' });
    const out = migrateVisitsV3([v], {
      questionnairesByVisit: new Map([['v1', true]]),
      audiogramsByVisit: new Map([['v1', true]]),
    });
    expect(out[0].visit_purpose).toBe('INITIAL');
  });

  it('GENERAL 재방문 → SERVICE', () => {
    const v1 = mk({ id: 'v1', visit_date: '2026-01-01', visit_type: 'GENERAL' });
    const v2 = mk({ id: 'v2', visit_date: '2026-02-01', visit_type: 'GENERAL' });
    const out = migrateVisitsV3([v1, v2], { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0].visit_purpose).toBe('INITIAL');
    expect(out[1].visit_purpose).toBe('SERVICE');
  });

  it('purpose[] → visit_motives 이전 (G4)', () => {
    const v = mk({ purpose: ['재검', '청소'], visit_type: 'GENERAL' });
    const out = migrateVisitsV3([v], { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0].visit_motives).toEqual(['재검', '청소']);
    expect(out[0].purpose).toEqual(['재검', '청소']);
  });

  it('이미 v3인 데이터는 idempotent', () => {
    const v = mk({ visit_purpose: 'FITTING', fitting_session_no: 2, purchase_cycle_id: 'cycle-1' });
    const out = migrateVisitsV3([v], { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0]).toEqual(v);
  });

  it('MIGRATION_VERSION을 3으로 기록', () => {
    migrateVisitsV3([], { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(localStorage.getItem('jinsim_migration_version')).toBe('3');
  });

  it('재실행 시 version 3 이상이면 변환 스킵', () => {
    localStorage.setItem('jinsim_migration_version', '3');
    const v = mk({ visit_type: 'HA_PROTOCOL', ha_stage: 'HA_1' });
    const out = migrateVisitsV3([v], { questionnairesByVisit: new Map(), audiogramsByVisit: new Map() });
    expect(out[0].visit_purpose).toBeUndefined();
  });
});
