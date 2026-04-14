import type { QuestionnaireData } from '../types';

export type QuestionnaireStepId = 'basic' | 'history' | 'hearing' | 'cosi';

export interface QuestionnaireStepDef {
  id: QuestionnaireStepId;
  label: string;
  description: string;
}

export const QUESTIONNAIRE_STEPS: QuestionnaireStepDef[] = [
  { id: 'basic', label: '기본 정보', description: '방문 동기·소개 경로' },
  { id: 'history', label: '병력', description: '청력검사·이비인후과·보청기 이력' },
  { id: 'hearing', label: '난청 평가', description: '상황별 어려움·주이' },
  { id: 'cosi', label: 'COSI', description: 'Top 3 목표' },
];

export function isStepComplete(
  stepId: QuestionnaireStepId,
  data: Partial<QuestionnaireData>
): boolean {
  switch (stepId) {
    case 'basic':
      return Boolean(data.visit_motives && data.visit_motives.length > 0);
    case 'history':
      return Boolean(data.hearing_test_experience);
    case 'hearing':
      return (
        Boolean(data.better_ear) ||
        [
          data.diff_quiet_1to1,
          data.diff_small_group,
          data.diff_background_noise,
          data.diff_party_multi_talkers,
          data.diff_tv_volume,
          data.diff_phone_speech,
        ].some((v) => typeof v === 'number')
      );
    case 'cosi':
      return Boolean(
        data.cosi_top3_goals && data.cosi_top3_goals.length > 0
      );
  }
}

export function firstIncompleteStep(
  data: Partial<QuestionnaireData>
): QuestionnaireStepId {
  for (const step of QUESTIONNAIRE_STEPS) {
    if (!isStepComplete(step.id, data)) return step.id;
  }
  return 'cosi';
}
