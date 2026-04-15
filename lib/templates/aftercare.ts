import type { ChecklistItem } from '../../data/haProtocolTemplates';
import type { AftercareBucket } from '../../types';

const BASE: ChecklistItem[] = [
  { key: 'interim_history', label: '경과 불편/만족/사용환경 변화', section: '문진/상담', required: true, defaultStatus: 'DONE' },
  { key: 'red_flags', label: '통증/분비물/갑작스런 변화', section: '문진/상담', required: false, defaultStatus: 'DONE' },
  { key: 'otoscopy', label: '이경검사', section: '귀/중이', required: true, defaultStatus: 'DONE' },
  { key: 'deep_cleaning', label: '딥 클리닝/소모품 교체', section: '기기점검', required: true, defaultStatus: 'DONE' },
  { key: 'listening_check', label: '보청기 청취점검', section: '기기점검', required: true, defaultStatus: 'DONE' },
  { key: 'fine_tuning', label: '미세조정', section: '조정', required: false, defaultStatus: 'DONE' },
  { key: 'education_refresh', label: '사용/관리 교육 리프레시', section: '교육', required: true, defaultStatus: 'DONE' },
  { key: 'schedule_next', label: '다음 방문 예약', section: '계획', required: true, defaultStatus: 'DONE' },
];

export const AFTERCARE_TEMPLATES: Record<AftercareBucket, ChecklistItem[]> = {
  M3: BASE,
  M6: [
    ...BASE,
    { key: 'satisfaction_check', label: '6개월 만족도/COSI 재평가', section: '결과평가', required: true, defaultStatus: 'DONE' },
  ],
  M12: [
    ...BASE,
    { key: 'pure_tone_ac', label: '순음청력 재검 (기도)', section: '청각검사', required: true, defaultStatus: 'DONE' },
    { key: 'pure_tone_bc', label: '골도 재검 (변동 시)', section: '청각검사', required: false, defaultStatus: 'DONE' },
    { key: 'annual_review', label: '연간 종합 리뷰 / 교체 상담', section: '결과평가', required: true, defaultStatus: 'DONE' },
  ],
  LONGTERM: [
    ...BASE,
    { key: 'pure_tone_ac', label: '순음청력 재검 (1년 주기)', section: '청각검사', required: true, defaultStatus: 'DONE' },
    { key: 'device_lifecycle_review', label: '기기 수명/교체 주기 검토', section: '기기점검', required: true, defaultStatus: 'DONE' },
    { key: 'battery_replacement_plan', label: '배터리/소모품 장기 계획', section: '기기점검', required: false, defaultStatus: 'DONE' },
  ],
};
