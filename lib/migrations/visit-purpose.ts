import type { Visit } from '../../types';
import { classifyGeneralVisit } from '../../utils/classifyInitialVisit';
import { deriveAftercareBucket } from '../../utils/visitPurposeLabel';

export const MIGRATION_VERSION = 3;
const STORAGE_KEY = 'jinsim_migration_version';

export interface MigrationContext {
  questionnairesByVisit: Map<string, boolean>;
  audiogramsByVisit: Map<string, boolean>;
  hearingAidExperienceByCustomer?: Map<string, boolean>;
}

export function migrateVisitsV3(visits: Visit[], ctx: MigrationContext): Visit[] {
  const current = Number(localStorage.getItem(STORAGE_KEY) ?? '1');
  if (current >= MIGRATION_VERSION) return visits;

  const byCustomer = new Map<string, Visit[]>();
  for (const v of [...visits].sort((a, b) => a.visit_date.localeCompare(b.visit_date))) {
    const arr = byCustomer.get(v.customer_id) ?? [];
    arr.push(v);
    byCustomer.set(v.customer_id, arr);
  }

  const migrated = visits.map(v => {
    if (v.visit_purpose) return v;

    const motives = v.visit_motives?.length ? v.visit_motives : (v.purpose ?? []);

    if (v.visit_type === 'HA_PROTOCOL') {
      if (v.ha_stage === 'HA_1') return { ...v, visit_purpose: 'FITTING' as const, fitting_session_no: 1, purchase_cycle_id: 'cycle-1', visit_motives: motives };
      if (v.ha_stage === 'HA_2') return { ...v, visit_purpose: 'FITTING' as const, fitting_session_no: 2, purchase_cycle_id: 'cycle-1', visit_motives: motives };
      if (v.ha_stage === 'HA_3') return { ...v, visit_purpose: 'FITTING' as const, fitting_session_no: 3, purchase_cycle_id: 'cycle-1', visit_motives: motives };
      if (v.ha_stage === 'AFTERCARE_3MO') return { ...v, visit_purpose: 'AFTERCARE' as const, aftercare_month: 3, aftercare_bucket: deriveAftercareBucket(3), visit_motives: motives };
    }

    const isFirst = byCustomer.get(v.customer_id)?.[0]?.id === v.id;
    const result = classifyGeneralVisit({
      hasAudiogram: ctx.audiogramsByVisit.get(v.id) ?? false,
      hasQuestionnaire: ctx.questionnairesByVisit.get(v.id) ?? false,
      hasHearingAidExperience: ctx.hearingAidExperienceByCustomer?.get(v.customer_id) ?? false,
      isFirstVisit: isFirst,
    });
    return { ...v, visit_purpose: result, visit_motives: motives };
  });

  localStorage.setItem(STORAGE_KEY, String(MIGRATION_VERSION));
  return migrated;
}
