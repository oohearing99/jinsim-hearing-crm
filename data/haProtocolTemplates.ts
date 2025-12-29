
import { HAStage } from '../types';

export interface ChecklistItem {
  key: string;
  label: string;
  section: '문진/상담' | '귀/중이' | '청각검사' | '피팅/검증' | '기기점검' | '교육' | '계획' | '조정' | '결과평가';
  required: boolean;
  defaultStatus: 'DONE' | 'SKIPPED' | 'N/A';
}

export const HA_PROTOCOL_TEMPLATES: Record<HAStage, ChecklistItem[]> = {
  HA_1: [
    { key: 'intake_review', label: '기초상담/문진(불편환경, 목표, 기대치)', section: '문진/상담', required: true, defaultStatus: 'DONE' },
    { key: 'questionnaire_completed', label: '초기 설문지 작성 확인', section: '문진/상담', required: false, defaultStatus: 'DONE' },
    { key: 'cosi_goals_set', label: '목표 TOP3(COSI) 설정', section: '문진/상담', required: true, defaultStatus: 'DONE' },
    { key: 'otoscopy', label: '이경검사(Otoscopy)', section: '귀/중이', required: true, defaultStatus: 'DONE' },
    { key: 'tympanometry', label: '중이검사(Tymp)', section: '귀/중이', required: false, defaultStatus: 'DONE' },
    { key: 'pure_tone_ac', label: '순음청력검사(기도)', section: '청각검사', required: true, defaultStatus: 'DONE' },
    { key: 'pure_tone_bc', label: '골도검사(필요 시 마스킹)', section: '청각검사', required: true, defaultStatus: 'DONE' },
    { key: 'speech_srt', label: 'SRS 어음검사', section: '청각검사', required: true, defaultStatus: 'DONE' },
    { key: 'speech_wrs', label: 'WRS 어음명료도', section: '청각검사', required: true, defaultStatus: 'DONE' },
    { key: 'sin_baseline', label: '소음하 어음(가능 시)', section: '청각검사', required: false, defaultStatus: 'DONE' },
    { key: 'ucl_ldl', label: '불쾌역치/출력 한계 참고', section: '청각검사', required: false, defaultStatus: 'DONE' },
    { key: 'device_plan', label: '보청기 스타일/기능/양이 계획 수립', section: '피팅/검증', required: true, defaultStatus: 'DONE' },
    { key: 'expectation_counseling', label: '현실적 기대치/적응기간 안내', section: '교육', required: true, defaultStatus: 'DONE' },
    { key: 'schedule_next', label: '2차 예약 안내(+7일 권장)', section: '계획', required: true, defaultStatus: 'DONE' },
  ],
  HA_2: [
    { key: 'listening_check', label: '보청기 청취점검', section: '기기점검', required: true, defaultStatus: 'DONE' },
    { key: 'eaa_testbox', label: '테스트박스(EAA) 간이 점검', section: '기기점검', required: false, defaultStatus: 'DONE' },
    { key: 'physical_fit_check', label: '착용감/피드백 체크(돔/몰드)', section: '피팅/검증', required: true, defaultStatus: 'DONE' },
    { key: 'programming_done', label: '프로그래밍(처방식 기반)', section: '피팅/검증', required: true, defaultStatus: 'DONE' },
    { key: 'rem_verification', label: 'REM(실이측정) 수행', section: '피팅/검증', required: true, defaultStatus: 'DONE' },
    { key: 'mpo_safety_check', label: '최대출력(MPO) 안전 확인', section: '피팅/검증', required: true, defaultStatus: 'DONE' },
    { key: 'sound_field_threshold', label: '음장역치(Aided Threshold)', section: '청각검사', required: true, defaultStatus: 'DONE' },
    { key: 'sound_field_speech', label: '음장 어음(Quiet/SIN)', section: '청각검사', required: false, defaultStatus: 'DONE' },
    { key: 'din_test', label: '소음하 검사(DIN)', section: '청각검사', required: false, defaultStatus: 'DONE' },
    { key: 'orientation_core', label: '착용/탈착, 충전/관리 교육', section: '교육', required: true, defaultStatus: 'DONE' },
    { key: 'adaptation_schedule', label: '적응 스케줄 제공', section: '교육', required: true, defaultStatus: 'DONE' },
    { key: 'comm_strategies', label: '소음환경 대화 전략 안내', section: '교육', required: false, defaultStatus: 'DONE' },
    { key: 'schedule_next', label: '3차 예약 안내(+7일 권장)', section: '계획', required: true, defaultStatus: 'DONE' },
  ],
  HA_3: [
    { key: 'experience_review', label: '불편상황 TOP3 점검', section: '문진/상담', required: true, defaultStatus: 'DONE' },
    { key: 'datalogging_review', label: '데이터로깅 확인(사용시간/환경)', section: '기기점검', required: false, defaultStatus: 'DONE' },
    { key: 'otoscopy_followup', label: '이경 재확인(자극/염증)', section: '귀/중이', required: true, defaultStatus: 'DONE' },
    { key: 'cleaning_consumables', label: '클리닝/소모품 교체', section: '기기점검', required: true, defaultStatus: 'DONE' },
    { key: 'fine_tuning', label: '이득/소음/피드백 미세조정', section: '조정', required: true, defaultStatus: 'DONE' },
    { key: 'rem_reverify', label: '큰 변경 시 REM 재검증', section: '조정', required: false, defaultStatus: 'DONE' },
    { key: 'validation_cosi', label: '목표 TOP3 개선 정도 체크', section: '결과평가', required: true, defaultStatus: 'DONE' },
    { key: 'satisfaction', label: '만족도(0~10) 기록', section: '결과평가', required: true, defaultStatus: 'DONE' },
    { key: 'switch_to_aftercare', label: '사후관리(3개월) 안내(+90일)', section: '계획', required: true, defaultStatus: 'DONE' },
  ],
  AFTERCARE_3MO: [
    { key: 'interim_history', label: '3개월 불편/만족/사용환경 변화', section: '문진/상담', required: true, defaultStatus: 'DONE' },
    { key: 'red_flags', label: '통증/분비물/갑작스런 변화 체크', section: '문진/상담', required: false, defaultStatus: 'DONE' },
    { key: 'otoscopy', label: '이경검사', section: '귀/중이', required: true, defaultStatus: 'DONE' },
    { key: 'deep_cleaning', label: '딥 클리닝/소모품 교체', section: '기기점검', required: true, defaultStatus: 'DONE' },
    { key: 'listening_check', label: '보청기 청취점검', section: '기기점검', required: true, defaultStatus: 'DONE' },
    { key: 'eaa_quick_check', label: '테스트박스 간이 점검', section: '기기점검', required: false, defaultStatus: 'DONE' },
    { key: 'datalogging_adj', label: '데이터로깅 기반 조정', section: '조정', required: false, defaultStatus: 'DONE' },
    { key: 'fine_tuning', label: '필요 시 프로그램/이득 조정', section: '조정', required: false, defaultStatus: 'DONE' },
    { key: 'tymp_needed', label: '필요 시 중이검사(Tymp)', section: '청각검사', required: false, defaultStatus: 'N/A' },
    { key: 'retest_needed', label: '청력변화 의심 시 재검사', section: '청각검사', required: false, defaultStatus: 'N/A' },
    { key: 'education_refresh', label: '관리/청소/교체주기 리마인드', section: '교육', required: true, defaultStatus: 'DONE' },
    { key: 'schedule_next', label: '다음 사후관리 예약(+90일)', section: '계획', required: true, defaultStatus: 'DONE' },
  ]
};
