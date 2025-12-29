
import React, { useState, useMemo, useEffect } from 'react';
import { Visit, Customer, HASession, HAStage, DetailedClinicalResults, QuestionnaireData, DetailedSpeech, DetailedPureTone, OtoscopyChecklist, TympanometryChecklist, FitComfortChecklist, ProgrammingChecklist, RemChecklist, MpoChecklist, ListeningCheckChecklist, EaaChecklist, DeepCleaningChecklist, OrientationCoreChecklist, AdaptationScheduleChecklist, CommStrategiesChecklist, EducationRefreshChecklist, DataloggingAdjChecklist, FineTuningChecklist, DevicePlanChecklist, ExpectationChecklist } from '../types';
import { HA_PROTOCOL_TEMPLATES } from '../data/haProtocolTemplates';
import { Save, CheckCircle2, Activity, Headphones, FileText, ClipboardList, ChevronDown, ChevronUp, AlertTriangle, Circle, AlertCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import PureToneEditor from './editors/PureToneEditor';
import SpeechEditor from './editors/SpeechEditor';
import { FREQUENCIES } from '../constants';

// 이경검사 체크리스트 항목 정의
const OTOSCOPY_CHECKLIST_ITEMS: { key: keyof OtoscopyChecklist; label: string; category: 'ear_canal' | 'tympanic' }[] = [
  // 외이도(External Ear Canal) 관련
  { key: 'earwax', label: '이구(귀지) 상태 확인', category: 'ear_canal' },
  { key: 'inflammation', label: '외이도 염증/발적 여부', category: 'ear_canal' },
  { key: 'stenosis', label: '외이도 협착 여부', category: 'ear_canal' },
  { key: 'discharge', label: '분비물 유무', category: 'ear_canal' },
  // 고막(Tympanic Membrane) 관련
  { key: 'perforation', label: '고막 천공 여부', category: 'tympanic' },
  { key: 'discoloration', label: '고막 색상 이상 (발적/혼탁)', category: 'tympanic' },
  { key: 'effusion', label: '삼출액 저류 소견', category: 'tympanic' },
  { key: 'lightReflex', label: '고막 반사(Light reflex) 정상', category: 'tympanic' },
];

const DEFAULT_OTOSCOPY_CHECKLIST: OtoscopyChecklist = {
  earwax: null,
  inflammation: null,
  stenosis: null,
  discharge: null,
  perforation: null,
  discoloration: null,
  effusion: null,
  lightReflex: null,
};

// 중이검사(Tympanometry) 체크리스트 항목 정의 (typeComplete는 별도 UI로 처리)
const TYMPANOMETRY_CHECKLIST_ITEMS: { key: keyof TympanometryChecklist; label: string; category: 'result' | 'interpretation' }[] = [
  // 결과 확인
  { key: 'peakPressureNormal', label: 'Peak Pressure 정상 범위 확인', category: 'result' },
  { key: 'complianceNormal', label: 'Compliance 정상 범위 확인', category: 'result' },
  { key: 'ecvNormal', label: 'ECV(외이도 용적) 정상 범위 확인', category: 'result' },
  // 임상적 해석
  { key: 'effusionSuspected', label: '중이 삼출액 의심 소견 확인', category: 'interpretation' },
  { key: 'tubeDysfunction', label: '이관 기능 이상 소견 확인', category: 'interpretation' },
  { key: 'perforationSuspected', label: '고막 천공 의심 소견 확인 (ECV 증가)', category: 'interpretation' },
  { key: 'ossicularAbnormality', label: '이소골 연쇄 이상 의심 확인', category: 'interpretation' },
];

// Tympanometry Type 옵션
const TYMPANOMETRY_TYPES = ['A', 'As', 'Ad', 'B', 'C'] as const;

const DEFAULT_TYMPANOMETRY_CHECKLIST: TympanometryChecklist = {
  typeComplete: null,
  peakPressureNormal: null,
  complianceNormal: null,
  ecvNormal: null,
  effusionSuspected: null,
  tubeDysfunction: null,
  perforationSuspected: null,
  ossicularAbnormality: null,
};

// 2차 피팅/검증 체크리스트 항목 정의
// 1. 착용감/피드백 체크(돔/몰드)
const FIT_COMFORT_CHECKLIST_ITEMS: { key: keyof FitComfortChecklist; label: string; category: 'physical' | 'feedback' }[] = [
  // 물리적 착용감
  { key: 'domeMoldFit', label: '돔/몰드 크기 적합성 확인', category: 'physical' },
  { key: 'painDiscomfort', label: '착용 시 통증/불편감 여부', category: 'physical' },
  { key: 'secureRetention', label: '탈락 없이 안정적 고정 확인', category: 'physical' },
  { key: 'occlusionCheck', label: '울림 여부(Occlusion) 확인', category: 'physical' },
  // 피드백 관련
  { key: 'feedbackOccurrence', label: '피드백(하울링) 발생 여부 확인', category: 'feedback' },
  { key: 'feedbackChewing', label: '씹을 때 피드백 확인', category: 'feedback' },
  { key: 'feedbackHandNear', label: '손 가까이 시 피드백 확인', category: 'feedback' },
];

const DEFAULT_FIT_COMFORT_CHECKLIST: FitComfortChecklist = {
  domeMoldFit: null,
  painDiscomfort: null,
  secureRetention: null,
  occlusionCheck: null,
  feedbackOccurrence: null,
  feedbackChewing: null,
  feedbackHandNear: null,
};

// 2. 프로그래밍(처방식 기반)
const PROGRAMMING_CHECKLIST_ITEMS: { key: keyof ProgrammingChecklist; label: string; category: 'initial' | 'fine' }[] = [
  // 초기 피팅
  { key: 'prescriptionApplied', label: '청력도 기반 처방식 적용 완료', category: 'initial' },
  { key: 'initialGainSet', label: '초기 이득(Gain) 설정 확인', category: 'initial' },
  { key: 'compressionRatioSet', label: '압축비(Compression Ratio) 설정', category: 'initial' },
  { key: 'frequencyGainAdjusted', label: '주파수별 이득 조정', category: 'initial' },
  // 미세 조정
  { key: 'loudnessPreference', label: '소리 크기 선호도 반영', category: 'fine' },
  { key: 'soundQualityPreference', label: '음질 선호도 반영 (선명도/부드러움)', category: 'fine' },
  { key: 'programSetup', label: '프로그램 수/종류 설정 (일상/소음/음악 등)', category: 'fine' },
];

const DEFAULT_PROGRAMMING_CHECKLIST: ProgrammingChecklist = {
  prescriptionApplied: null,
  initialGainSet: null,
  compressionRatioSet: null,
  frequencyGainAdjusted: null,
  loudnessPreference: null,
  soundQualityPreference: null,
  programSetup: null,
};

// 3. REM(실이측정) 수행 - Insertion Gain & Speech Mapping
const REM_CHECKLIST_ITEMS: { key: keyof RemChecklist; label: string; category: 'ig_prep' | 'ig_target' | 'sm_prep' | 'sm_level' | 'sm_audibility' }[] = [
  // Insertion Gain - 측정 준비
  { key: 'igProbePosition', label: '프로브 튜브 삽입 위치 확인', category: 'ig_prep' },
  { key: 'igReugMeasured', label: 'REUG 측정 완료', category: 'ig_prep' },
  // Insertion Gain - 타겟 매칭
  { key: 'igTargetMatch250to4k', label: '250~4000Hz 타겟 ±5dB 이내 확인', category: 'ig_target' },
  { key: 'igTargetMatchHighFreq', label: '고주파(4k~8kHz) 타겟 확인', category: 'ig_target' },
  { key: 'igLeftRightBalance', label: '좌/우 밸런스 확인', category: 'ig_target' },
  // Speech Mapping - 측정 준비
  { key: 'smProbePosition', label: '프로브 튜브 삽입 위치 확인', category: 'sm_prep' },
  { key: 'smSpeechSignalSet', label: '어음 신호 설정 완료', category: 'sm_prep' },
  // Speech Mapping - 입력 레벨별 확인
  { key: 'smSoft50dB', label: 'Soft(50dB): 가청 영역 내 확인', category: 'sm_level' },
  { key: 'smAverage65dB', label: 'Average(65dB): 타겟 근접 확인', category: 'sm_level' },
  { key: 'smLoud80dB', label: 'Loud(80dB): MPO 이하 확인', category: 'sm_level' },
  // Speech Mapping - 어음 가청도
  { key: 'smSpeechBananaCover', label: 'Speech Banana 영역 커버 확인', category: 'sm_audibility' },
  { key: 'smConsonantAudibility', label: '자음 가청 영역 확인 (/s/, /sh/ 등)', category: 'sm_audibility' },
];

const DEFAULT_REM_CHECKLIST: RemChecklist = {
  igProbePosition: null,
  igReugMeasured: null,
  igTargetMatch250to4k: null,
  igTargetMatchHighFreq: null,
  igLeftRightBalance: null,
  smProbePosition: null,
  smSpeechSignalSet: null,
  smSoft50dB: null,
  smAverage65dB: null,
  smLoud80dB: null,
  smSpeechBananaCover: null,
  smConsonantAudibility: null,
};

// 4. 최대출력(MPO) 안전 확인
const MPO_CHECKLIST_ITEMS: { key: keyof MpoChecklist; label: string; category: 'ucl' | 'safety' }[] = [
  // UCL 기반 설정
  { key: 'uclReflected', label: 'UCL 측정값 반영 여부', category: 'ucl' },
  { key: 'mpoBelowUcl', label: 'MPO가 UCL 이하로 설정 확인', category: 'ucl' },
  // 안전성 검증
  { key: 'noDiscomfortLoud', label: '큰 소리 입력 시 불쾌감 없음 확인', category: 'safety' },
  { key: 'mpo90dBLimit', label: 'MPO 90dB SPL 제한 확인 (필요시)', category: 'safety' },
  { key: 'impactSoundTest', label: '충격음 테스트 통과', category: 'safety' },
];

const DEFAULT_MPO_CHECKLIST: MpoChecklist = {
  uclReflected: null,
  mpoBelowUcl: null,
  noDiscomfortLoud: null,
  mpo90dBLimit: null,
  impactSoundTest: null,
};

// 5. Listening Check (청취 점검)
const LISTENING_CHECK_ITEMS: { key: keyof ListeningCheckChecklist; label: string; category: 'visual' | 'acoustic' }[] = [
  // 외관 점검
  { key: 'externalDamage', label: '보청기 외관 손상 여부 확인', category: 'visual' },
  { key: 'batteryDoorCharging', label: '배터리 도어/충전 단자 상태 확인', category: 'visual' },
  { key: 'micPortClear', label: '마이크 포트 막힘 여부 확인', category: 'visual' },
  { key: 'receiverTubeConnection', label: '리시버/튜브 연결 상태 확인', category: 'visual' },
  // 음향 점검
  { key: 'powerOnOff', label: '전원 ON/OFF 정상 작동 확인', category: 'acoustic' },
  { key: 'soundQuality', label: '음질 이상(끊김/잡음/왜곡) 확인', category: 'acoustic' },
  { key: 'volumeProgramButton', label: '볼륨/프로그램 버튼 작동 확인', category: 'acoustic' },
  { key: 'feedbackCheck', label: '피드백 발생 여부 확인', category: 'acoustic' },
];

const DEFAULT_LISTENING_CHECK_CHECKLIST: ListeningCheckChecklist = {
  externalDamage: null,
  batteryDoorCharging: null,
  micPortClear: null,
  receiverTubeConnection: null,
  powerOnOff: null,
  soundQuality: null,
  volumeProgramButton: null,
  feedbackCheck: null,
};

// 6. 테스트박스(EAA) 간이 점검
const EAA_CHECKLIST_ITEMS: { key: keyof EaaChecklist; label: string; category: 'measurement' | 'spec' | 'issue' }[] = [
  // 기본 측정
  { key: 'ospl90Measured', label: 'OSPL90 (최대출력) 측정 완료', category: 'measurement' },
  { key: 'fullOnGainMeasured', label: 'Full-on Gain (최대이득) 측정 완료', category: 'measurement' },
  { key: 'refTestGainMeasured', label: 'Reference Test Gain 측정 완료', category: 'measurement' },
  // 스펙 비교
  { key: 'specWithin3dB', label: '제조사 스펙 대비 ±3dB 이내 확인', category: 'spec' },
  { key: 'leftRightMatching', label: '좌/우 보청기 매칭 확인 (양이 착용 시)', category: 'spec' },
  // 이상 징후
  { key: 'outputReduction', label: '출력 저하 여부 확인', category: 'issue' },
  { key: 'frequencyResponseIssue', label: '주파수별 응답 이상 여부 확인', category: 'issue' },
];

const DEFAULT_EAA_CHECKLIST: EaaChecklist = {
  ospl90Measured: null,
  fullOnGainMeasured: null,
  refTestGainMeasured: null,
  specWithin3dB: null,
  leftRightMatching: null,
  outputReduction: null,
  frequencyResponseIssue: null,
};

// 7. 딥 클리닝/소모품 교체 (deep_cleaning)
const DEEP_CLEANING_ITEMS: { key: keyof DeepCleaningChecklist; label: string; category: 'cleaning' | 'consumables' | 'extra' }[] = [
  // 외관 클리닝
  { key: 'bodyCleaning', label: '보청기 본체 클리닝 완료', category: 'cleaning' },
  { key: 'earmoldDomCleaning', label: '이어몰드/돔 세척/교체', category: 'cleaning' },
  { key: 'waxGuardReplacement', label: '왁스가드(귀지필터) 교체', category: 'cleaning' },
  { key: 'tubeWireCheck', label: '튜브/와이어 상태 확인 및 교체', category: 'cleaning' },
  // 소모품 점검
  { key: 'batteryReplacement', label: '배터리 교체 (일반형)', category: 'consumables' },
  { key: 'chargerTerminalCleaning', label: '충전기 단자 클리닝', category: 'consumables' },
  { key: 'receiverReplacement', label: '리시버/스피커 교체', category: 'consumables' },
  { key: 'micCoverReplacement', label: '마이크 커버 교체', category: 'consumables' },
  // 추가 점검
  { key: 'moistureRemoval', label: '습기 제거 처리', category: 'extra' },
  { key: 'desiccantReplacement', label: '방습제/건조제 교체', category: 'extra' },
  { key: 'ventCleaning', label: '통풍구(벤트) 청소', category: 'extra' },
];

const DEFAULT_DEEP_CLEANING_CHECKLIST: DeepCleaningChecklist = {
  bodyCleaning: null,
  earmoldDomCleaning: null,
  waxGuardReplacement: null,
  tubeWireCheck: null,
  batteryReplacement: null,
  chargerTerminalCleaning: null,
  receiverReplacement: null,
  micCoverReplacement: null,
  moistureRemoval: null,
  desiccantReplacement: null,
  ventCleaning: null,
};

// 8. 착용/탈착, 충전/관리 교육 (orientation_core)
const ORIENTATION_CORE_ITEMS: { key: keyof OrientationCoreChecklist; label: string; category: 'wear' | 'charge' | 'care' }[] = [
  // 착용/탈착
  { key: 'wearingMethod', label: '올바른 착용 방법 시연 및 실습', category: 'wear' },
  { key: 'removalMethod', label: '올바른 탈착 방법 시연 및 실습', category: 'wear' },
  { key: 'leftRightIdentify', label: '좌/우 구분 방법 안내', category: 'wear' },
  { key: 'domeMoldDirection', label: '돔/몰드 방향 확인 방법', category: 'wear' },
  // 충전/배터리
  { key: 'chargerUsage', label: '충전기 사용법 안내', category: 'charge' },
  { key: 'chargingCycle', label: '충전 시간/주기 안내', category: 'charge' },
  { key: 'batteryLevelCheck', label: '배터리 잔량 확인 방법', category: 'charge' },
  // 관리/청소
  { key: 'dailyCleaning', label: '일일 청소 방법 안내', category: 'care' },
  { key: 'moistureStorage', label: '습기 제거/보관 방법 안내', category: 'care' },
  { key: 'waxFilterChange', label: '왁스필터 교체 방법 안내', category: 'care' },
];

const DEFAULT_ORIENTATION_CORE_CHECKLIST: OrientationCoreChecklist = {
  wearingMethod: null,
  removalMethod: null,
  leftRightIdentify: null,
  domeMoldDirection: null,
  chargerUsage: null,
  chargingCycle: null,
  batteryLevelCheck: null,
  dailyCleaning: null,
  moistureStorage: null,
  waxFilterChange: null,
};

// 8. 적응 스케줄 제공 (adaptation_schedule)
const ADAPTATION_SCHEDULE_ITEMS: { key: keyof AdaptationScheduleChecklist; label: string; category: 'duration' | 'environment' | 'expectation' }[] = [
  // 착용 시간 안내
  { key: 'week1Duration', label: '1주차 착용 시간 안내 (예: 2-4시간)', category: 'duration' },
  { key: 'week2Duration', label: '2주차 착용 시간 안내 (예: 4-6시간)', category: 'duration' },
  { key: 'week3Goal', label: '3주차 이후 목표 안내 (예: 종일 착용)', category: 'duration' },
  // 환경 단계별 안내
  { key: 'quietEnvironmentFirst', label: '조용한 환경부터 시작 안내', category: 'environment' },
  { key: 'gradualNoiseExposure', label: '소음 환경 점진적 노출 안내', category: 'environment' },
  { key: 'tvPhoneAdaptation', label: 'TV/전화 적응 안내', category: 'environment' },
  // 적응 기대치
  { key: 'initialDiscomfortNormal', label: '초기 불편감 정상임을 안내', category: 'expectation' },
  { key: 'adaptationPeriod', label: '적응 기간(4-12주) 안내', category: 'expectation' },
  { key: 'contactOnIssue', label: '문제 발생 시 연락 안내', category: 'expectation' },
];

const DEFAULT_ADAPTATION_SCHEDULE_CHECKLIST: AdaptationScheduleChecklist = {
  week1Duration: null,
  week2Duration: null,
  week3Goal: null,
  quietEnvironmentFirst: null,
  gradualNoiseExposure: null,
  tvPhoneAdaptation: null,
  initialDiscomfortNormal: null,
  adaptationPeriod: null,
  contactOnIssue: null,
};

// 9. 소음환경 대화 전략 안내 (comm_strategies)
const COMM_STRATEGIES_ITEMS: { key: keyof CommStrategiesChecklist; label: string; category: 'listening' | 'environment' | 'communication' }[] = [
  // 청취 전략
  { key: 'faceSpeaker', label: '화자 얼굴 바라보기 안내', category: 'listening' },
  { key: 'chooseQuietPlace', label: '조용한 장소 선택 안내', category: 'listening' },
  { key: 'maintainDistance', label: '적절한 거리 유지 안내', category: 'listening' },
  // 환경 조절
  { key: 'reduceBackgroundNoise', label: '배경 소음 줄이기 안내', category: 'environment' },
  { key: 'useLighting', label: '조명 활용 안내 (입술 읽기)', category: 'environment' },
  { key: 'seatPositioning', label: '좌석 위치 선택 안내', category: 'environment' },
  // 의사소통 요령
  { key: 'askForRepeat', label: '되묻기/확인 요청 안내', category: 'communication' },
  { key: 'topicAwareness', label: '대화 주제 파악 안내', category: 'communication' },
  { key: 'familyCooperation', label: '가족/주변인 협조 안내', category: 'communication' },
];

const DEFAULT_COMM_STRATEGIES_CHECKLIST: CommStrategiesChecklist = {
  faceSpeaker: null,
  chooseQuietPlace: null,
  maintainDistance: null,
  reduceBackgroundNoise: null,
  useLighting: null,
  seatPositioning: null,
  askForRepeat: null,
  topicAwareness: null,
  familyCooperation: null,
};

// 10. 관리/청소/교체주기 리마인드 (education_refresh)
const EDUCATION_REFRESH_ITEMS: { key: keyof EducationRefreshChecklist; label: string; category: 'daily' | 'cycle' | 'caution' }[] = [
  // 일상 관리 안내
  { key: 'dailyWiping', label: '매일 보청기 닦기 안내', category: 'daily' },
  { key: 'sleepStorage', label: '취침 시 보관 방법 안내', category: 'daily' },
  { key: 'dryerUsage', label: '습기 제거/건조기 사용법 안내', category: 'daily' },
  { key: 'earwaxCheck', label: '귀지 확인 및 청소 안내', category: 'daily' },
  // 교체주기 안내
  { key: 'waxGuardCycle', label: '왁스가드 교체주기 안내 (1-2주)', category: 'cycle' },
  { key: 'domeTipCycle', label: '돔/이어팁 교체주기 안내 (2-3개월)', category: 'cycle' },
  { key: 'tubeCycle', label: '튜브 교체주기 안내 (3-6개월)', category: 'cycle' },
  { key: 'desiccantCycle', label: '건조제 교체주기 안내 (1-2개월)', category: 'cycle' },
  // 주의사항 안내
  { key: 'moistureWarning', label: '물/습기 접촉 주의 안내', category: 'caution' },
  { key: 'heatWarning', label: '고온/직사광선 피하기 안내', category: 'caution' },
  { key: 'cosmeticsWarning', label: '헤어스프레이/화장품 주의 안내', category: 'caution' },
  { key: 'storageHabit', label: '분실 방지 보관 습관 안내', category: 'caution' },
];

const DEFAULT_EDUCATION_REFRESH_CHECKLIST: EducationRefreshChecklist = {
  dailyWiping: null,
  sleepStorage: null,
  dryerUsage: null,
  earwaxCheck: null,
  waxGuardCycle: null,
  domeTipCycle: null,
  tubeCycle: null,
  desiccantCycle: null,
  moistureWarning: null,
  heatWarning: null,
  cosmeticsWarning: null,
  storageHabit: null,
};

// 11. 데이터로깅 기반 조정 (datalogging_adj)
const DATALOGGING_ADJ_ITEMS: { key: keyof DataloggingAdjChecklist; label: string; category: 'pattern' | 'environment' }[] = [
  // 사용 패턴 분석
  { key: 'dailyWearTime', label: '일일 평균 착용시간 확인', category: 'pattern' },
  { key: 'environmentDistribution', label: '주요 사용 환경 분포 확인', category: 'pattern' },
  { key: 'programUsageRatio', label: '프로그램별 사용 비율 확인', category: 'pattern' },
  { key: 'volumePattern', label: '볼륨 조절 패턴 확인', category: 'pattern' },
  // 환경별 조정
  { key: 'quietOptimization', label: '조용한 환경 설정 최적화', category: 'environment' },
  { key: 'noiseAdjustment', label: '소음 환경 설정 조정', category: 'environment' },
  { key: 'musicMediaAdjustment', label: '음악/미디어 설정 조정', category: 'environment' },
  { key: 'phoneCallAdjustment', label: '전화통화 설정 조정', category: 'environment' },
];

const DEFAULT_DATALOGGING_ADJ_CHECKLIST: DataloggingAdjChecklist = {
  dailyWearTime: null,
  environmentDistribution: null,
  programUsageRatio: null,
  volumePattern: null,
  quietOptimization: null,
  noiseAdjustment: null,
  musicMediaAdjustment: null,
  phoneCallAdjustment: null,
};

// 12. 필요 시 프로그램/이득 조정 (fine_tuning)
const FINE_TUNING_ITEMS: { key: keyof FineTuningChecklist; label: string; category: 'gain' | 'program' | 'other' }[] = [
  // 이득 조정
  { key: 'overallGain', label: '전체 볼륨(Overall Gain) 조정', category: 'gain' },
  { key: 'lowFreqGain', label: '저주파 이득 조정', category: 'gain' },
  { key: 'highFreqGain', label: '고주파 이득 조정', category: 'gain' },
  { key: 'compressionAdjust', label: '압축비(Compression) 조정', category: 'gain' },
  // 프로그램 조정
  { key: 'defaultProgram', label: '기본 프로그램 수정', category: 'program' },
  { key: 'noiseProgram', label: '소음 프로그램 추가/수정', category: 'program' },
  { key: 'musicProgram', label: '음악 프로그램 추가/수정', category: 'program' },
  { key: 'streamingProgram', label: '전화/스트리밍 프로그램 조정', category: 'program' },
  // 기타 조정
  { key: 'feedbackManagement', label: '피드백 관리 설정 조정', category: 'other' },
  { key: 'noiseReduction', label: '소음 감소(NR) 레벨 조정', category: 'other' },
  { key: 'directionalMic', label: '방향성 마이크 설정 조정', category: 'other' },
  { key: 'occlusionManagement', label: '울림(Occlusion) 관리 조정', category: 'other' },
];

const DEFAULT_FINE_TUNING_CHECKLIST: FineTuningChecklist = {
  overallGain: null,
  lowFreqGain: null,
  highFreqGain: null,
  compressionAdjust: null,
  defaultProgram: null,
  noiseProgram: null,
  musicProgram: null,
  streamingProgram: null,
  feedbackManagement: null,
  noiseReduction: null,
  directionalMic: null,
  occlusionManagement: null,
};

// 13. 보청기 스타일/기능/양이 계획 수립 (device_plan)
const DEVICE_PLAN_ITEMS: { key: keyof DevicePlanChecklist; label: string; category: 'style' | 'feature' | 'binaural' | 'budget' }[] = [
  // 스타일 선정
  { key: 'hearingLossOutput', label: '청력손실 정도에 따른 출력 검토', category: 'style' },
  { key: 'earCanalCheck', label: '외이도 상태/크기 확인 (ITE/RIC/BTE)', category: 'style' },
  { key: 'dexterityVision', label: '손 민첩성/시력 고려', category: 'style' },
  { key: 'cosmeticPreference', label: '외관 선호도 확인 (눈에 띄는/은밀한)', category: 'style' },
  // 기능 선정
  { key: 'bluetoothNeed', label: '블루투스/무선 연결 필요 여부', category: 'feature' },
  { key: 'tinnitusFeature', label: '이명 기능(Tinnitus Masker) 필요 여부', category: 'feature' },
  { key: 'batteryPreference', label: '충전식/일반 배터리 선호도', category: 'feature' },
  // 양이/편측 결정
  { key: 'bilateralCheck', label: '양측 청력손실 확인', category: 'binaural' },
  { key: 'binauralBenefit', label: '양이 착용 효과 설명', category: 'binaural' },
  { key: 'unilateralConsider', label: '편측 착용 시 고려사항 안내', category: 'binaural' },
  { key: 'sideDecision', label: '착용 측 결정 (양이/우선측)', category: 'binaural' },
  // 예산/보조금
  { key: 'budgetRange', label: '예산 범위 확인', category: 'budget' },
  { key: 'subsidyCheck', label: '보조금/급여 대상 여부 확인', category: 'budget' },
  { key: 'paymentMethod', label: '결제 방식 안내 (할부/일시불)', category: 'budget' },
];

const DEFAULT_DEVICE_PLAN_CHECKLIST: DevicePlanChecklist = {
  hearingLossOutput: null,
  earCanalCheck: null,
  dexterityVision: null,
  cosmeticPreference: null,
  bluetoothNeed: null,
  tinnitusFeature: null,
  batteryPreference: null,
  bilateralCheck: null,
  binauralBenefit: null,
  unilateralConsider: null,
  sideDecision: null,
  budgetRange: null,
  subsidyCheck: null,
  paymentMethod: null,
};

// 14. 현실적 기대치/적응기간 안내 (expectation_counseling)
const EXPECTATION_ITEMS: { key: keyof ExpectationChecklist; label: string; category: 'recovery' | 'adaptation' | 'initial' }[] = [
  // 청력 회복 기대치
  { key: 'assistNotRestore', label: '보청기는 청력 "회복"이 아닌 "보조" 설명', category: 'recovery' },
  { key: 'quietVsNoiseExplain', label: '조용한 환경 vs 소음 환경 차이 설명', category: 'recovery' },
  { key: 'individualDifference', label: '개인별 효과 차이 가능성 안내', category: 'recovery' },
  // 적응 기간 안내
  { key: 'adaptationPeriodInfo', label: '초기 적응기간 (4-12주) 필요 안내', category: 'adaptation' },
  { key: 'brainRelearning', label: '뇌의 소리 재학습 과정 설명', category: 'adaptation' },
  { key: 'initialDiscomfort', label: '처음엔 불편할 수 있음 안내', category: 'adaptation' },
  { key: 'gradualWearIncrease', label: '점진적 착용시간 증가 권장', category: 'adaptation' },
  // 일반적인 초기 경험
  { key: 'ownVoiceDifferent', label: '본인 목소리가 다르게 들릴 수 있음', category: 'initial' },
  { key: 'ambientNoiseLouder', label: '주변 소음이 크게 느껴질 수 있음', category: 'initial' },
  { key: 'occlusionPossible', label: '울림/폐쇄감 초기 발생 가능성', category: 'initial' },
  { key: 'naturalOverTime', label: '시간이 지나면 자연스러워짐 안내', category: 'initial' },
];

const DEFAULT_EXPECTATION_CHECKLIST: ExpectationChecklist = {
  assistNotRestore: null,
  quietVsNoiseExplain: null,
  individualDifference: null,
  adaptationPeriodInfo: null,
  brainRelearning: null,
  initialDiscomfort: null,
  gradualWearIncrease: null,
  ownVoiceDifferent: null,
  ambientNoiseLouder: null,
  occlusionPossible: null,
  naturalOverTime: null,
};

interface Props {
  visit: Visit;
  customer: Customer;
  onSave: () => void;
  onDirtyChange: (isDirty: boolean) => void;
  saveTriggerRef: React.MutableRefObject<() => void>;
}

const RenderCustomO = (props: any) => {
  const { cx, cy, stroke, payload } = props;
  if (cx === undefined || cy === undefined) return null;
  // NR인 경우 아래 화살표 표시
  if (payload?.isNR_rt_ac) {
    return (
      <g transform={`translate(${cx},${cy})`}>
        <path d="M 0,-8 L -5,0 L 0,3 L 5,0 Z" fill={stroke} stroke={stroke} strokeWidth={1} />
      </g>
    );
  }
  return <circle cx={cx} cy={cy} r={6} stroke={stroke} strokeWidth={2} fill="none" />;
};

const RenderCustomX = (props: any) => {
  const { cx, cy, stroke, payload } = props;
  if (cx === undefined || cy === undefined) return null;
  const size = 5;
  // NR인 경우 아래 화살표 표시
  if (payload?.isNR_lt_ac) {
    return (
      <g transform={`translate(${cx},${cy})`}>
        <path d="M 0,-8 L -5,0 L 0,3 L 5,0 Z" fill={stroke} stroke={stroke} strokeWidth={1} />
      </g>
    );
  }
  return (
    <g transform={`translate(${cx},${cy})`}>
      <line x1={-size} y1={-size} x2={size} y2={size} stroke={stroke} strokeWidth={2} />
      <line x1={-size} y1={size} x2={size} y2={-size} stroke={stroke} strokeWidth={2} />
    </g>
  );
};

const RenderCustomA = (props: any) => {
  const { cx, cy, stroke, payload, dataKey } = props;
  if (cx === undefined || cy === undefined) return null;
  // NR 체크 (rt_sf 또는 lt_sf에 따라)
  const isNR = dataKey === 'rt_sf' ? payload?.isNR_rt_sf : payload?.isNR_lt_sf;
  if (isNR) {
    return (
      <g transform={`translate(${cx},${cy})`}>
        <path d="M 0,-8 L -5,0 L 0,3 L 5,0 Z" fill={stroke} stroke={stroke} strokeWidth={1} />
      </g>
    );
  }
  return (
    <g transform={`translate(${cx},${cy})`}>
      <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="black" fill={stroke}>A</text>
    </g>
  );
};

const HaProtocolTab: React.FC<Props> = ({ visit, customer, onSave, onDirtyChange, saveTriggerRef }) => {
  const prefCounselor = localStorage.getItem('jinsim_pref_counselor') || 'Admin';
  const prefCenter = localStorage.getItem('jinsim_pref_center') || 'SEOUL_MAIN';

  const stage = visit.ha_stage || 'HA_1';
  const template = HA_PROTOCOL_TEMPLATES[stage];
  
  const [session, setSession] = useState<HASession>(() => {
    const saved = localStorage.getItem(`hasession_${visit.id}`);
    // 고객 ID 기준으로 설문지 데이터 로드 (모든 방문에서 동일한 데이터 공유)
    const qSaved = localStorage.getItem(`q_customer_${customer.id}`) || localStorage.getItem(`q_${visit.id}`);

    // 고객의 일반상담 PTA 데이터 찾기
    let ptaSaved = null;
    let spSaved = null;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pta_')) {
        const ptaData = localStorage.getItem(key);
        if (ptaData) {
          const parsed = JSON.parse(ptaData);
          if (parsed.customer_id === customer.id) {
            ptaSaved = ptaData;
            // 같은 visit의 speech 데이터도 찾기
            const speechKey = `speech_${parsed.visit_id}`;
            spSaved = localStorage.getItem(speechKey);
            break;
          }
        }
      }
    }

    // 저장된 세션이 있으면 반환
    if (saved) {
      const savedSession = JSON.parse(saved);

      // 일반 상담 PTA 데이터가 있으면 항상 기본으로 표시 (performed가 false인 경우에만)
      // 이렇게 하면 HA 탭에서 검사를 수행하지 않았을 때 일반 상담 데이터가 자동으로 보임
      const ptaData = ptaSaved ? JSON.parse(ptaSaved) : null;
      if (ptaData && !savedSession.results_detailed?.pure_tone?.performed) {
        savedSession.results_detailed = savedSession.results_detailed || {};
        savedSession.results_detailed.pure_tone = {
          performed: false,
          ac_dbhl: {
            right: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.rt_ac])) : {},
            left: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.lt_ac])) : {}
          },
          sf_dbhl: {
            right: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.rt_sf])) : {},
            left: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.lt_sf])) : {}
          },
          bc_dbhl: savedSession.results_detailed?.pure_tone?.bc_dbhl || { right: {}, left: {} },
          nr: savedSession.results_detailed?.pure_tone?.nr || { right: [], left: [], sf_right: [], sf_left: [] },
          derived: savedSession.results_detailed?.pure_tone?.derived || { pta_right: null, pta_left: null, pta_sf_right: null, pta_sf_left: null }
        };
      }

      return savedSession;
    }

    const initialChecklist: any = {};
    template.forEach(item => {
      initialChecklist[item.key] = { status: item.defaultStatus, note: null };
    });

    const qData = qSaved ? JSON.parse(qSaved) as QuestionnaireData : null;
    const ptaData = ptaSaved ? JSON.parse(ptaSaved) : null;
    const spData = spSaved ? JSON.parse(spSaved) : null;

    return {
      id: Math.random().toString(36).substr(2, 9),
      customer_id: customer.id,
      visit_id: visit.id,
      visit_date: visit.visit_date,
      ha_stage: stage,
      checklist: initialChecklist,
      results_detailed: {
        pure_tone: { 
          performed: !!ptaData, 
          ac_dbhl: { 
            right: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.rt_ac])) : {}, 
            left: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.lt_ac])) : {} 
          }, 
          sf_dbhl: {
            right: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.rt_sf])) : {},
            left: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.lt_sf])) : {}
          },
          bc_dbhl: { right: {}, left: {} }, 
          nr: { right: [], left: [], sf_right: [], sf_left: [] }, 
          derived: { pta_right: null, pta_left: null, pta_sf_right: null, pta_sf_left: null } 
        },
        speech: {
          performed: !!spData,
          srt_dbhl: { right: spData?.rt?.srt || null, left: spData?.lt?.srt || null, free_field: spData?.free_field?.srt || null, free_field_right: spData?.free_field_rt?.srt || null, free_field_left: spData?.free_field_lt?.srt || null },
          wrs: {
            right: spData?.rt?.wrs_percent ? { score_percent: spData.rt.wrs_percent, list_id: null, level_dbhl: null } : null,
            left: spData?.lt?.wrs_percent ? { score_percent: spData.lt.wrs_percent, list_id: null, level_dbhl: null } : null,
            free_field: spData?.free_field?.wrs_percent ? { score_percent: spData.free_field.wrs_percent, list_id: null, level_dbhl: null } : null,
            free_field_right: spData?.free_field_rt?.wrs_percent ? { score_percent: spData.free_field_rt.wrs_percent, list_id: null, level_dbhl: null } : null,
            free_field_left: spData?.free_field_lt?.wrs_percent ? { score_percent: spData.free_field_lt.wrs_percent, list_id: null, level_dbhl: null } : null,
            notes: spData?.special_notes || null
          },
          mcl_dbhl: { right: spData?.rt?.mcl || null, left: spData?.lt?.mcl || null, free_field: spData?.free_field?.mcl || null, free_field_right: spData?.free_field_rt?.mcl || null, free_field_left: spData?.free_field_lt?.mcl || null },
          ucl_dbhl: { right: spData?.rt?.ucl || null, left: spData?.lt?.ucl || null, free_field: spData?.free_field?.ucl || null, free_field_right: spData?.free_field_rt?.ucl || null, free_field_left: spData?.free_field_lt?.ucl || null }
        },
      } as any,
      adjustments: { programming_summary: null, gain_change_summary: null, noise_program_change: null, feedback_management: null, occlusion_management: null },
      education: { insertion_removal: false, battery_charging: false, cleaning_care: false, app_bluetooth: false, adaptation_schedule_given: false, communication_strategies: false },
      validation: { satisfaction_0to10: 0 },
      brand_id: visit.brand_id,
      center_id: prefCenter,
      counselor_name: prefCounselor,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } as HASession;
  });

  const [expandedSections, setExpandedSections] = useState<string[]>(['문진/상담', '청각검사']);

  // 일반 상담 PTA 데이터를 HA 세션에 자동 로드 (컴포넌트 마운트 시 1회만 실행)
  useEffect(() => {
    // 고객의 일반상담 PTA 데이터 찾기
    let ptaSaved = null;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pta_')) {
        const ptaData = localStorage.getItem(key);
        if (ptaData) {
          const parsed = JSON.parse(ptaData);
          if (parsed.customer_id === customer.id && parsed.visit_id !== visit.id) {
            ptaSaved = ptaData;
            break;
          }
        }
      }
    }

    if (ptaSaved) {
      const ptaData = JSON.parse(ptaSaved);

      // 현재 세션에 순음검사 데이터가 없으면 일반 상담 데이터로 채움
      const currentPT = session.results_detailed?.pure_tone;
      const hasCurrentData = currentPT?.performed ||
        (currentPT?.ac_dbhl?.right && Object.keys(currentPT.ac_dbhl.right).some(k => currentPT.ac_dbhl.right[k] !== undefined && currentPT.ac_dbhl.right[k] !== null));

      if (!hasCurrentData) {
        setSession(prev => ({
          ...prev,
          results_detailed: {
            ...prev.results_detailed,
            pure_tone: {
              performed: false,
              ac_dbhl: {
                right: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.rt_ac])) : {},
                left: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.lt_ac])) : {}
              },
              sf_dbhl: {
                right: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.rt_sf])) : {},
                left: ptaData?.frequencies ? Object.fromEntries(Object.entries(ptaData.frequencies).map(([f, v]: any) => [f, v.lt_sf])) : {}
              },
              bc_dbhl: prev.results_detailed?.pure_tone?.bc_dbhl || { right: {}, left: {} },
              nr: prev.results_detailed?.pure_tone?.nr || { right: [], left: [], sf_right: [], sf_left: [] },
              derived: prev.results_detailed?.pure_tone?.derived || { pta_right: null, pta_left: null, pta_sf_right: null, pta_sf_left: null }
            }
          } as any
        }));
      }
    }
  }, [visit.id, customer.id]);

  // 고객 설문지 데이터 로드 (customer_id 기준으로 공유)
  const questionnaireData = useMemo(() => {
    const qSaved = localStorage.getItem(`q_customer_${customer.id}`) || localStorage.getItem(`q_${visit.id}`);
    return qSaved ? JSON.parse(qSaved) as QuestionnaireData : null;
  }, [customer.id, visit.id]);

  const toggleSection = (section: string) => {
    setExpandedSections(prev => prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]);
  };

  const chartData = useMemo(() => {
    const pt = session.results_detailed?.pure_tone;

    // 일반 상담의 이전 검사 결과 가져오기 (customer_id 기준으로 모든 visit 검색)
    let previousData: any = null;

    // localStorage에서 모든 키를 순회하면서 해당 고객의 일반상담(GENERAL) PTA 데이터 찾기
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pta_')) {
        const ptaData = JSON.parse(localStorage.getItem(key) || '{}');
        // 같은 고객이고, 현재 visit이 아닌 경우 (일반상담 데이터)
        if (ptaData.customer_id === customer.id && ptaData.visit_id !== visit.id) {
          previousData = ptaData.frequencies;
          break; // 첫 번째로 찾은 일반상담 데이터 사용
        }
      }
    }

    return FREQUENCIES.map(f => {
      // NR 체크
      const isNR_rt_ac = pt?.nr?.right?.includes(f);
      const isNR_lt_ac = pt?.nr?.left?.includes(f);
      const isNR_rt_sf = pt?.nr?.sf_right?.includes(f);
      const isNR_lt_sf = pt?.nr?.sf_left?.includes(f);

      return {
        frequency: f,
        // 현재 검사 결과 (NR인 경우 120으로 표시하여 그래프 하단에 화살표 표시)
        rt_ac: isNR_rt_ac ? 120 : pt?.ac_dbhl.right[f],
        lt_ac: isNR_lt_ac ? 120 : pt?.ac_dbhl.left[f],
        rt_sf: isNR_rt_sf ? 120 : pt?.sf_dbhl?.right?.[f],
        lt_sf: isNR_lt_sf ? 120 : pt?.sf_dbhl?.left?.[f],
        // NR 플래그
        isNR_rt_ac,
        isNR_lt_ac,
        isNR_rt_sf,
        isNR_lt_sf,
        // 이전 검사 결과 (옅게)
        prev_rt_ac: previousData?.[f]?.rt_ac,
        prev_lt_ac: previousData?.[f]?.lt_ac,
        prev_rt_sf: previousData?.[f]?.rt_sf,
        prev_lt_sf: previousData?.[f]?.lt_sf
      };
    });
  }, [session.results_detailed?.pure_tone, visit.id, customer.id]);

  const testDates = useMemo(() => {
    // 이전 검사 날짜 (일반 상담) - customer_id 기준으로 검색
    let previousDate = null;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('pta_')) {
        const ptaData = JSON.parse(localStorage.getItem(key) || '{}');
        if (ptaData.customer_id === customer.id && ptaData.visit_id !== visit.id) {
          previousDate = ptaData.updated_at || ptaData.created_at;
          break;
        }
      }
    }

    // 현재 검사 날짜 (HA 프로토콜)
    const currentDate = session.updated_at || session.created_at;

    return { previousDate, currentDate };
  }, [session.updated_at, session.created_at, visit.id, customer.id]);

  const handleSave = () => {
    const finalSession = { 
      ...session, 
      updated_at: new Date().toISOString() 
    };
    localStorage.setItem(`hasession_${visit.id}`, JSON.stringify(finalSession));
    
    const pt = finalSession.results_detailed?.pure_tone;
    if (pt) {
      const ptaData = {
        visit_id: visit.id,
        customer_id: customer.id,
        frequencies: Object.fromEntries(FREQUENCIES.map(f => [f, {
          rt_ac: pt.ac_dbhl.right[f],
          lt_ac: pt.ac_dbhl.left[f],
          rt_sf: pt.sf_dbhl?.right?.[f],
          lt_sf: pt.sf_dbhl?.left?.[f]
        }]))
      };
      localStorage.setItem(`pta_${visit.id}`, JSON.stringify(ptaData));
    }
    
    const sp = finalSession.results_detailed?.speech;
    if (sp) {
      const spData = {
        visit_id: visit.id,
        customer_id: customer.id,
        rt: { srt: sp.srt_dbhl.right, wrs_percent: sp.wrs.right?.score_percent, mcl: sp.mcl_dbhl.right, ucl: sp.ucl_dbhl.right },
        lt: { srt: sp.srt_dbhl.left, wrs_percent: sp.wrs.left?.score_percent, mcl: sp.mcl_dbhl.left, ucl: sp.ucl_dbhl.left },
        free_field: { srt: sp.srt_dbhl.free_field, wrs_percent: sp.wrs.free_field?.score_percent, mcl: sp.mcl_dbhl.free_field, ucl: sp.ucl_dbhl.free_field },
        special_notes: sp.wrs.notes
      };
      localStorage.setItem(`speech_${visit.id}`, JSON.stringify(spData));
    }
    onDirtyChange(false);
    onSave();
  };

  useEffect(() => {
    saveTriggerRef.current = handleSave;
  }, [session]);

  // Auto-save to localStorage whenever session changes
  useEffect(() => {
    const finalSession = {
      ...session,
      updated_at: new Date().toISOString()
    };
    localStorage.setItem(`hasession_${visit.id}`, JSON.stringify(finalSession));

    // Also save PTA and Speech data
    const pt = finalSession.results_detailed?.pure_tone;
    if (pt) {
      const ptaData = {
        visit_id: visit.id,
        customer_id: customer.id,
        frequencies: Object.fromEntries(FREQUENCIES.map(f => [f, {
          rt_ac: pt.ac_dbhl.right[f],
          lt_ac: pt.ac_dbhl.left[f],
          rt_sf: pt.sf_dbhl?.right?.[f],
          lt_sf: pt.sf_dbhl?.left?.[f]
        }]))
      };
      localStorage.setItem(`pta_${visit.id}`, JSON.stringify(ptaData));
    }

    const sp = finalSession.results_detailed?.speech;
    if (sp) {
      const spData = {
        visit_id: visit.id,
        customer_id: customer.id,
        rt: { srt: sp.srt_dbhl.right, wrs_percent: sp.wrs.right?.score_percent, mcl: sp.mcl_dbhl.right, ucl: sp.ucl_dbhl.right },
        lt: { srt: sp.srt_dbhl.left, wrs_percent: sp.wrs.left?.score_percent, mcl: sp.mcl_dbhl.left, ucl: sp.ucl_dbhl.left },
        free_field: { srt: sp.srt_dbhl.free_field, wrs_percent: sp.wrs.free_field?.score_percent, mcl: sp.mcl_dbhl.free_field, ucl: sp.ucl_dbhl.free_field },
        special_notes: sp.wrs.notes
      };
      localStorage.setItem(`speech_${visit.id}`, JSON.stringify(spData));
    }
  }, [session, visit.id, customer.id]);

  const updateSession = (updater: (prev: HASession) => HASession) => {
    setSession(prev => {
      // Ensure results_detailed structure exists
      if (!prev.results_detailed) {
        prev.results_detailed = {} as any;
      }
      if (!prev.results_detailed.pure_tone) {
        prev.results_detailed.pure_tone = {
          performed: false,
          test_date: null,
          transducer: null,
          ac_dbhl: { right: {}, left: {} },
          sf_dbhl: { right: {}, left: {} },
          bc_dbhl: { right: {}, left: {} },
          nr: { right: [], left: [], sf_right: [], sf_left: [] },
          masking_used: null,
          notes: null,
          derived: { pta_right: null, pta_left: null, pta_sf_right: null, pta_sf_left: null }
        };
      }
      if (!prev.results_detailed.speech) {
        prev.results_detailed.speech = {
          performed: false,
          srt_dbhl: { right: null, left: null, free_field: null, free_field_right: null, free_field_left: null },
          wrs: { right: null, left: null, free_field: null, free_field_right: null, free_field_left: null, notes: null },
          mcl_dbhl: { right: null, left: null, free_field: null, free_field_right: null, free_field_left: null },
          ucl_dbhl: { right: null, left: null, free_field: null, free_field_right: null, free_field_left: null }
        };
      }

      const next = updater(prev);
      onDirtyChange(true);
      return next;
    });
  };

  // 미완료 필수 항목 찾기
  const incompleteRequiredItems = useMemo(() => {
    return template.filter(item =>
      item.required && session.checklist[item.key]?.status !== 'DONE'
    );
  }, [template, session.checklist]);

  // 첫 번째 미완료 필수 항목으로 스크롤
  const scrollToFirstIncomplete = () => {
    if (incompleteRequiredItems.length > 0) {
      const firstItem = incompleteRequiredItems[0];
      // 섹션 확장
      if (!expandedSections.includes(firstItem.section)) {
        setExpandedSections(prev => [...prev, firstItem.section]);
      }
      // 스크롤
      setTimeout(() => {
        const element = document.getElementById(`checklist-item-${firstItem.key}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // 하이라이트 효과
          element.classList.add('ring-4', 'ring-red-400', 'ring-offset-2');
          setTimeout(() => {
            element.classList.remove('ring-4', 'ring-red-400', 'ring-offset-2');
          }, 2000);
        }
      }, 300);
    }
  };

  const missingRequired = template.filter(item => item.required && session.checklist[item.key]?.status !== 'DONE');

  return (
    <div className="max-w-5xl mx-auto space-y-10 pb-32">
      <div className="bg-white border-2 border-slate-100 rounded-[2.5rem] overflow-hidden shadow-2xl" data-capture="visit-summary">
        <div className="bg-slate-900 px-10 py-6 flex items-center justify-between">
           <div className="flex items-center gap-4">
              <ClipboardList className="w-8 h-8 text-orange-500" />
              <h4 className="text-white text-2xl font-black">{visit.ha_stage_label} - 임상 프로토콜</h4>
           </div>
           <div className="text-slate-400 text-sm font-bold">방문일: {new Date(visit.visit_date).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
        </div>

        <div className="p-10 space-y-12">
            {missingRequired.length > 0 && (
              <div
                onClick={scrollToFirstIncomplete}
                className="bg-orange-50 border-2 border-orange-200 p-6 rounded-3xl flex gap-4 animate-pulse cursor-pointer hover:bg-orange-100 hover:border-orange-300 transition-all"
              >
                <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0" />
                <div>
                  <p className="font-black text-orange-900">미완료 필수 항목 경고</p>
                  <p className="text-xs text-orange-700 font-bold mt-1">
                    아래 필수 항목들이 아직 완료되지 않았습니다: {missingRequired.map(m => m.label).join(', ')}
                  </p>
                  <p className="text-[10px] text-orange-600 font-bold mt-2 italic">💡 클릭하여 첫 번째 미완료 항목으로 이동</p>
                </div>
              </div>
            )}

            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200" data-capture="pure-tone-audiogram">
               <div className="flex justify-between items-center mb-6">
                 <h5 className="text-sm font-black text-slate-600 tracking-wide flex items-center gap-2">
                   <Activity className="w-5 h-5 text-orange-500" /> 순음청력검사 결과
                 </h5>
                 <div className="flex items-center gap-4 text-xs font-bold">
                   {testDates.previousDate && (
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-300 border-2 border-red-400"></div>
                       <span className="text-slate-500">이전 검사: {new Date(testDates.previousDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                     </div>
                   )}
                   {testDates.currentDate && session.results_detailed?.pure_tone?.performed && (
                     <div className="flex items-center gap-2">
                       <div className="w-3 h-3 rounded-full bg-red-600 border-2 border-red-700"></div>
                       <span className="text-slate-700">현재 검사: {new Date(testDates.currentDate).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' })}</span>
                     </div>
                   )}
                 </div>
               </div>
               <div className="w-full h-[500px] bg-white rounded-3xl border p-6 shadow-inner">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="1 1" stroke="#f1f5f9" />
                      <XAxis dataKey="frequency" tick={{ fontSize: 10, fontWeight: 700 }} />
                      <YAxis reversed domain={[-10, 120]} tick={{ fontSize: 10, fontWeight: 700 }} />
                      <Tooltip />
                      <Legend verticalAlign="top" height={36} />
                      {/* 이전 검사 결과 (옅은 색) */}
                      <Line type="monotone" dataKey="prev_rt_ac" stroke="#fca5a5" name="이전 우측 기도" strokeWidth={2} strokeDasharray="5 5" dot={<RenderCustomO stroke="#fca5a5" />} connectNulls />
                      <Line type="monotone" dataKey="prev_lt_ac" stroke="#93c5fd" name="이전 좌측 기도" strokeWidth={2} strokeDasharray="5 5" dot={<RenderCustomX stroke="#93c5fd" />} connectNulls />
                      {/* 현재 검사 결과 (진한 색) */}
                      <Line type="monotone" dataKey="rt_ac" stroke="#ef4444" name="우측 기도 (○)" strokeWidth={3} dot={<RenderCustomO stroke="#ef4444" />} connectNulls />
                      <Line type="monotone" dataKey="lt_ac" stroke="#3b82f6" name="좌측 기도 (×)" strokeWidth={3} dot={<RenderCustomX stroke="#3b82f6" />} connectNulls />
                      <Line type="monotone" dataKey="rt_sf" stroke="#ef4444" name="우측 음장 (A)" strokeWidth={3} dot={<RenderCustomA stroke="#ef4444" />} connectNulls />
                      <Line type="monotone" dataKey="lt_sf" stroke="#3b82f6" name="좌측 음장 (A)" strokeWidth={3} dot={<RenderCustomA stroke="#3b82f6" />} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
               </div>

               {/* 순음/음장검사 입력 */}
               <div className="mt-8">
                 <PureToneEditor
                   data={(() => {
                     const ptData = session.results_detailed?.pure_tone;
                     // 기본값 설정
                     const defaultData = {
                       performed: false,
                       test_date: null,
                       transducer: null,
                       ac_dbhl: { right: {}, left: {} },
                       sf_dbhl: { right: {}, left: {} },
                       bc_dbhl: { right: {}, left: {} },
                       nr: { right: [], left: [], sf_right: [], sf_left: [] },
                       masking_used: null,
                       notes: null,
                       derived: { pta_right: null, pta_left: null, pta_sf_right: null, pta_sf_left: null }
                     };

                     if (!ptData) return defaultData;

                     // 데이터 구조 검증 및 병합
                     return {
                       performed: ptData.performed ?? false,
                       ac_dbhl: {
                         right: ptData.ac_dbhl?.right ?? {},
                         left: ptData.ac_dbhl?.left ?? {}
                       },
                       sf_dbhl: {
                         right: ptData.sf_dbhl?.right ?? {},
                         left: ptData.sf_dbhl?.left ?? {}
                       },
                       bc_dbhl: {
                         right: ptData.bc_dbhl?.right ?? {},
                         left: ptData.bc_dbhl?.left ?? {}
                       },
                       nr: {
                         right: ptData.nr?.right ?? [],
                         left: ptData.nr?.left ?? [],
                         sf_right: ptData.nr?.sf_right ?? [],
                         sf_left: ptData.nr?.sf_left ?? []
                       },
                       derived: {
                         pta_right: ptData.derived?.pta_right ?? null,
                         pta_left: ptData.derived?.pta_left ?? null,
                         pta_sf_right: ptData.derived?.pta_sf_right ?? null,
                         pta_sf_left: ptData.derived?.pta_sf_left ?? null
                       }
                     };
                   })()}
                   onChange={(d) => updateSession(prev => ({...prev, results_detailed: {...prev.results_detailed, pure_tone: d}}))}
                 />
               </div>
            </div>

            <div className="space-y-6">
               {['문진/상담', '귀/중이', '청각검사', '피팅/검증', '기기점검', '교육', '계획', '조정', '결과평가'].map(section => {
                 const sectionItems = template.filter(i => i.section === section);
                 if (sectionItems.length === 0) return null;
                 const isExpanded = expandedSections.includes(section);
                 return (
                   <div key={section} className="border-2 border-slate-100 rounded-3xl overflow-hidden bg-white shadow-sm">
                      <button onClick={() => toggleSection(section)} className="w-full p-6 flex justify-between items-center bg-slate-50/50 hover:bg-slate-50 transition-all">
                        <span className="font-black text-slate-800 flex items-center gap-3">
                          <span className={`w-2 h-2 rounded-full ${isExpanded ? 'bg-blue-600' : 'bg-slate-300'}`}></span>
                          {section}
                        </span>
                        {isExpanded ? <ChevronUp /> : <ChevronDown />}
                      </button>
                      {isExpanded && (
                        <div className="p-6 space-y-6 animate-in slide-in-from-top-2 duration-300">
                          <div className="grid grid-cols-1 gap-4">
{sectionItems.map(item => {
                              // 청각검사 항목들에 대한 전문 옵션 정의
                              const getAudiologicalOptions = (key: string) => {
                                switch(key) {
                                  case 'sound_field_threshold':
                                    return {
                                      label: '측정 조건',
                                      options: [
                                        { value: 'warble_tone', label: 'Warble Tone' },
                                        { value: 'narrow_band', label: 'Narrow Band Noise' },
                                        { value: 'speech_noise', label: 'Speech Noise' }
                                      ]
                                    };
                                  case 'sound_field_speech':
                                    return {
                                      label: '테스트 종류',
                                      options: [
                                        { value: 'quiet_srt', label: 'Quiet (SRT)' },
                                        { value: 'quiet_wrs', label: 'Quiet (WRS)' },
                                        { value: 'noise_snr_5', label: 'Noise (SNR +5dB)' },
                                        { value: 'noise_snr_0', label: 'Noise (SNR 0dB)' },
                                        { value: 'noise_adaptive', label: 'Adaptive SNR' }
                                      ]
                                    };
                                  case 'din_test':
                                    return {
                                      label: '프로토콜',
                                      options: [
                                        { value: 'digits_adaptive', label: 'Digits-in-Noise (Adaptive)' },
                                        { value: 'words_fixed', label: 'Words (Fixed SNR)' },
                                        { value: 'sentences_hint', label: 'Sentences (HINT)' },
                                        { value: 'quicksin', label: 'QuickSIN' }
                                      ]
                                    };
                                  case 'sin_baseline':
                                    return {
                                      label: '측정 방법',
                                      options: [
                                        { value: 'k_din', label: 'K-DIN' },
                                        { value: 'quicksin', label: 'Quick SIN' }
                                      ]
                                    };
                                  case 'pure_tone_ac':
                                    return {
                                      label: '변환기',
                                      options: [
                                        { value: 'headphone', label: 'Head Phone' },
                                        { value: 'insert', label: 'Insert Phone' }
                                      ]
                                    };
                                  case 'pure_tone_bc':
                                    return {
                                      label: '마스킹',
                                      options: [
                                        { value: 'no_masking', label: '마스킹 불필요' },
                                        { value: 'masking_used', label: '마스킹 시행' },
                                        { value: 'plateau_confirmed', label: 'Plateau 확인' }
                                      ]
                                    };
                                  case 'rem_verification':
                                    return {
                                      label: '처방 공식',
                                      options: [
                                        { value: 'naf-naf2', label: 'NAL-NL2' },
                                        { value: 'dsl_v5', label: 'DSL v5' },
                                        { value: 'cam2', label: 'CAM2' },
                                        { value: 'manufacturer', label: '제조사 처방식' }
                                      ]
                                    };
                                  case 'ucl_ldl':
                                    return {
                                      label: '측정 신호',
                                      options: [
                                        { value: 'pure_tone', label: 'Pure Tone' },
                                        { value: 'warble', label: 'Warble Tone' },
                                        { value: 'speech', label: 'Speech' },
                                        { value: 'narrow_band', label: 'Narrow Band Noise' }
                                      ]
                                    };
                                  default:
                                    return null;
                                }
                              };

                              const audioOptions = getAudiologicalOptions(item.key);

                              return (
                                <div
                                  key={item.key}
                                  id={`checklist-item-${item.key}`}
                                  className="flex flex-col gap-4 p-5 rounded-2xl bg-white border-2 border-slate-100 hover:border-slate-200 hover:shadow-md transition-all"
                                >
                                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-3 mb-3">
                                        <span className="text-base font-black text-slate-800">{item.label}</span>
                                        {item.required && <span className="px-3 py-1 bg-red-500 text-white text-[10px] font-black rounded-full shadow-sm">필수</span>}
                                      </div>

                                      {/* 청각학적 전문 옵션 */}
                                      {audioOptions && (
                                        <div className="mb-3">
                                          <label className="block text-xs font-bold text-slate-600 mb-2">{audioOptions.label}</label>
                                          <div className="flex flex-wrap gap-2">
                                            {audioOptions.options.map(opt => {
                                              const isSelected = session.checklist[item.key]?.note?.includes(`[${opt.value}]`);
                                              return (
                                                <button
                                                  key={opt.value}
                                                  onClick={() => {
                                                    const currentNote = session.checklist[item.key]?.note || '';
                                                    let newNote = currentNote;

                                                    // 이미 선택된 경우 토글하여 제거
                                                    if (isSelected) {
                                                      newNote = currentNote.replace(`[${opt.value}] `, '').replace(`[${opt.value}]`, '').trim();
                                                    } else {
                                                      // 같은 카테고리의 다른 옵션 제거 후 현재 옵션 추가
                                                      audioOptions.options.forEach(o => {
                                                        newNote = newNote.replace(`[${o.value}] `, '').replace(`[${o.value}]`, '');
                                                      });
                                                      newNote = `[${opt.value}] ${newNote.trim()}`.trim();
                                                    }

                                                    updateSession(prev => ({
                                                      ...prev,
                                                      checklist: {
                                                        ...prev.checklist,
                                                        [item.key]: {
                                                          ...prev.checklist[item.key],
                                                          note: newNote
                                                        }
                                                      }
                                                    }));
                                                  }}
                                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                                                    isSelected
                                                      ? 'bg-blue-500 border-blue-500 text-white shadow-md'
                                                      : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
                                                  }`}
                                                >
                                                  {opt.label}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </div>
                                      )}

                                      {/* SRT/WRS 전용 입력 UI */}
                                      {(item.key === 'speech_srt' || item.key === 'speech_wrs') ? (
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 p-2 bg-slate-50 border-2 border-slate-100 rounded-xl">
                                          {/* Unaided/Aided 선택 (WRS만) */}
                                          {item.key === 'speech_wrs' && (
                                            <>
                                              <div className="flex items-center gap-1">
                                                {[
                                                  { value: 'unaided', label: 'Unaided' },
                                                  { value: 'aided', label: 'Aided' }
                                                ].map(opt => {
                                                  const isSelected = session.checklist[item.key]?.note?.includes(`[${opt.value}]`);
                                                  return (
                                                    <button
                                                      key={opt.value}
                                                      onClick={() => {
                                                        const currentNote = session.checklist[item.key]?.note || '';
                                                        let newNote = currentNote;
                                                        // 다른 옵션 제거 후 현재 옵션 토글
                                                        newNote = newNote.replace(/\[(unaided|aided)\]\s*/gi, '').trim();
                                                        if (!isSelected) {
                                                          newNote = `[${opt.value}] ${newNote}`.trim();
                                                        }
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          checklist: {
                                                            ...prev.checklist,
                                                            [item.key]: {
                                                              ...prev.checklist[item.key],
                                                              note: newNote
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                                                        isSelected
                                                          ? 'bg-purple-500 border-purple-500 text-white shadow-md'
                                                          : 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100'
                                                      }`}
                                                    >
                                                      {opt.label}
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                              <div className="w-px h-6 bg-slate-300"></div>
                                            </>
                                          )}
                                          {/* SRT/WRS 값 */}
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-red-600 whitespace-nowrap">우측:</span>
                                            <input
                                              type="number"
                                              className="w-16 p-2 text-sm text-center font-bold border-2 border-red-200 rounded-lg outline-none bg-white focus:border-red-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              placeholder="-"
                                              value={item.key === 'speech_srt'
                                                ? (session.results_detailed.speech?.srt_dbhl.right?.[0] ?? '')
                                                : (session.results_detailed.speech?.wrs.right?.score_percent?.[0] ?? '')}
                                              onChange={e => {
                                                const val = e.target.value === '' ? null : parseInt(e.target.value);
                                                updateSession(prev => {
                                                  const newSpeech = { ...prev.results_detailed.speech! };
                                                  if (item.key === 'speech_srt') {
                                                    newSpeech.srt_dbhl.right = val !== null ? [val] : [];
                                                  } else {
                                                    if (!newSpeech.wrs.right) newSpeech.wrs.right = { list_id: null, level_dbhl: null, score_percent: [] };
                                                    newSpeech.wrs.right.score_percent = val !== null ? [val] : [];
                                                  }
                                                  return {
                                                    ...prev,
                                                    results_detailed: { ...prev.results_detailed, speech: newSpeech }
                                                  };
                                                });
                                              }}
                                            />
                                            <span className="text-xs text-slate-400">{item.key === 'speech_srt' ? 'dB' : '%'}</span>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-sm font-bold text-blue-600 whitespace-nowrap">좌측:</span>
                                            <input
                                              type="number"
                                              className="w-16 p-2 text-sm text-center font-bold border-2 border-blue-200 rounded-lg outline-none bg-white focus:border-blue-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              placeholder="-"
                                              value={item.key === 'speech_srt'
                                                ? (session.results_detailed.speech?.srt_dbhl.left?.[0] ?? '')
                                                : (session.results_detailed.speech?.wrs.left?.score_percent?.[0] ?? '')}
                                              onChange={e => {
                                                const val = e.target.value === '' ? null : parseInt(e.target.value);
                                                updateSession(prev => {
                                                  const newSpeech = { ...prev.results_detailed.speech! };
                                                  if (item.key === 'speech_srt') {
                                                    newSpeech.srt_dbhl.left = val !== null ? [val] : [];
                                                  } else {
                                                    if (!newSpeech.wrs.left) newSpeech.wrs.left = { list_id: null, level_dbhl: null, score_percent: [] };
                                                    newSpeech.wrs.left.score_percent = val !== null ? [val] : [];
                                                  }
                                                  return {
                                                    ...prev,
                                                    results_detailed: { ...prev.results_detailed, speech: newSpeech }
                                                  };
                                                });
                                              }}
                                            />
                                            <span className="text-xs text-slate-400">{item.key === 'speech_srt' ? 'dB' : '%'}</span>
                                          </div>
                                          {/* MCL 값 (SRT, WRS 모두 표시) */}
                                          <div className="w-px h-6 bg-slate-300 mx-2"></div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-red-400 whitespace-nowrap">MCL 우:</span>
                                            <input
                                              type="number"
                                              className="w-14 p-2 text-sm text-center font-bold border-2 border-red-100 rounded-lg outline-none bg-white focus:border-red-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              placeholder="-"
                                              value={session.results_detailed.speech?.mcl_dbhl.right?.[0] ?? ''}
                                              onChange={e => {
                                                const val = e.target.value === '' ? null : parseInt(e.target.value);
                                                updateSession(prev => {
                                                  const newSpeech = { ...prev.results_detailed.speech! };
                                                  newSpeech.mcl_dbhl.right = val !== null ? [val] : [];
                                                  return {
                                                    ...prev,
                                                    results_detailed: { ...prev.results_detailed, speech: newSpeech }
                                                  };
                                                });
                                              }}
                                            />
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-blue-400 whitespace-nowrap">MCL 좌:</span>
                                            <input
                                              type="number"
                                              className="w-14 p-2 text-sm text-center font-bold border-2 border-blue-100 rounded-lg outline-none bg-white focus:border-blue-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                              placeholder="-"
                                              value={session.results_detailed.speech?.mcl_dbhl.left?.[0] ?? ''}
                                              onChange={e => {
                                                const val = e.target.value === '' ? null : parseInt(e.target.value);
                                                updateSession(prev => {
                                                  const newSpeech = { ...prev.results_detailed.speech! };
                                                  newSpeech.mcl_dbhl.left = val !== null ? [val] : [];
                                                  return {
                                                    ...prev,
                                                    results_detailed: { ...prev.results_detailed, speech: newSpeech }
                                                  };
                                                });
                                              }}
                                            />
                                          </div>
                                        </div>
                                      ) : (item.key === 'otoscopy' || item.key === 'otoscopy_followup') ? (
                                        /* 이경검사 체크리스트 UI */
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* 오른쪽 귀 체크리스트 */}
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                              <h6 className="font-black text-xs uppercase tracking-widest text-red-600 mb-3">Rt (오른쪽)</h6>

                                              {/* 외이도 관련 */}
                                              <div className="mb-3">
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">외이도(External Ear Canal)</div>
                                                <div className="space-y-1.5">
                                                  {OTOSCOPY_CHECKLIST_ITEMS.filter(chk => chk.category === 'ear_canal').map(chk => {
                                                    const checklistRight = session.results_detailed.middle_ear?.otoscopy?.checklistRight || DEFAULT_OTOSCOPY_CHECKLIST;
                                                    const value = checklistRight[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => {
                                                            const currentMiddleEar = prev.results_detailed.middle_ear || {
                                                              performed: true,
                                                              otoscopy: { right: null, left: null, notes: null },
                                                              tympanometry: {
                                                                right: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                left: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                notes: null
                                                              }
                                                            };
                                                            const currentChecklist = currentMiddleEar.otoscopy?.checklistRight || { ...DEFAULT_OTOSCOPY_CHECKLIST };
                                                            return {
                                                              ...prev,
                                                              results_detailed: {
                                                                ...prev.results_detailed,
                                                                middle_ear: {
                                                                  ...currentMiddleEar,
                                                                  otoscopy: {
                                                                    ...currentMiddleEar.otoscopy,
                                                                    checklistRight: { ...currentChecklist, [chk.key]: newValue }
                                                                  }
                                                                }
                                                              }
                                                            };
                                                          });
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>

                                              {/* 고막 관련 */}
                                              <div>
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">고막(Tympanic Membrane)</div>
                                                <div className="space-y-1.5">
                                                  {OTOSCOPY_CHECKLIST_ITEMS.filter(chk => chk.category === 'tympanic').map(chk => {
                                                    const checklistRight = session.results_detailed.middle_ear?.otoscopy?.checklistRight || DEFAULT_OTOSCOPY_CHECKLIST;
                                                    const value = checklistRight[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => {
                                                            const currentMiddleEar = prev.results_detailed.middle_ear || {
                                                              performed: true,
                                                              otoscopy: { right: null, left: null, notes: null },
                                                              tympanometry: {
                                                                right: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                left: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                notes: null
                                                              }
                                                            };
                                                            const currentChecklist = currentMiddleEar.otoscopy?.checklistRight || { ...DEFAULT_OTOSCOPY_CHECKLIST };
                                                            return {
                                                              ...prev,
                                                              results_detailed: {
                                                                ...prev.results_detailed,
                                                                middle_ear: {
                                                                  ...currentMiddleEar,
                                                                  otoscopy: {
                                                                    ...currentMiddleEar.otoscopy,
                                                                    checklistRight: { ...currentChecklist, [chk.key]: newValue }
                                                                  }
                                                                }
                                                              }
                                                            };
                                                          });
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>

                                            {/* 왼쪽 귀 체크리스트 */}
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                              <h6 className="font-black text-xs uppercase tracking-widest text-blue-600 mb-3">Lt (왼쪽)</h6>

                                              {/* 외이도 관련 */}
                                              <div className="mb-3">
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">외이도(External Ear Canal)</div>
                                                <div className="space-y-1.5">
                                                  {OTOSCOPY_CHECKLIST_ITEMS.filter(chk => chk.category === 'ear_canal').map(chk => {
                                                    const checklistLeft = session.results_detailed.middle_ear?.otoscopy?.checklistLeft || DEFAULT_OTOSCOPY_CHECKLIST;
                                                    const value = checklistLeft[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => {
                                                            const currentMiddleEar = prev.results_detailed.middle_ear || {
                                                              performed: true,
                                                              otoscopy: { right: null, left: null, notes: null },
                                                              tympanometry: {
                                                                right: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                left: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                notes: null
                                                              }
                                                            };
                                                            const currentChecklist = currentMiddleEar.otoscopy?.checklistLeft || { ...DEFAULT_OTOSCOPY_CHECKLIST };
                                                            return {
                                                              ...prev,
                                                              results_detailed: {
                                                                ...prev.results_detailed,
                                                                middle_ear: {
                                                                  ...currentMiddleEar,
                                                                  otoscopy: {
                                                                    ...currentMiddleEar.otoscopy,
                                                                    checklistLeft: { ...currentChecklist, [chk.key]: newValue }
                                                                  }
                                                                }
                                                              }
                                                            };
                                                          });
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>

                                              {/* 고막 관련 */}
                                              <div>
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">고막(Tympanic Membrane)</div>
                                                <div className="space-y-1.5">
                                                  {OTOSCOPY_CHECKLIST_ITEMS.filter(chk => chk.category === 'tympanic').map(chk => {
                                                    const checklistLeft = session.results_detailed.middle_ear?.otoscopy?.checklistLeft || DEFAULT_OTOSCOPY_CHECKLIST;
                                                    const value = checklistLeft[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => {
                                                            const currentMiddleEar = prev.results_detailed.middle_ear || {
                                                              performed: true,
                                                              otoscopy: { right: null, left: null, notes: null },
                                                              tympanometry: {
                                                                right: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                left: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                notes: null
                                                              }
                                                            };
                                                            const currentChecklist = currentMiddleEar.otoscopy?.checklistLeft || { ...DEFAULT_OTOSCOPY_CHECKLIST };
                                                            return {
                                                              ...prev,
                                                              results_detailed: {
                                                                ...prev.results_detailed,
                                                                middle_ear: {
                                                                  ...currentMiddleEar,
                                                                  otoscopy: {
                                                                    ...currentMiddleEar.otoscopy,
                                                                    checklistLeft: { ...currentChecklist, [chk.key]: newValue }
                                                                  }
                                                                }
                                                              }
                                                            };
                                                          });
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 정상/확인</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 이상소견</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : (item.key === 'tympanometry' || item.key === 'tymp_needed') ? (
                                        /* 중이검사(Tympanometry) 체크리스트 UI */
                                        <div className="space-y-4">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* 오른쪽 귀 체크리스트 */}
                                            <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                                              <h6 className="font-black text-xs uppercase tracking-widest text-red-600 mb-3">Rt (오른쪽)</h6>

                                              {/* 결과 확인 */}
                                              <div className="mb-3">
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">결과 확인</div>
                                                <div className="space-y-1.5">
                                                  {/* Type 선택 UI */}
                                                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                                                    <div className="text-[10px] font-bold text-slate-500 mb-2">Type 판정</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                      {TYMPANOMETRY_TYPES.map(type => {
                                                        const currentType = session.results_detailed.middle_ear?.tympanometry?.right?.type;
                                                        const isSelected = currentType === type;
                                                        return (
                                                          <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => {
                                                              updateSession(prev => {
                                                                const currentMiddleEar = prev.results_detailed.middle_ear || {
                                                                  performed: true,
                                                                  otoscopy: { right: null, left: null, notes: null },
                                                                  tympanometry: {
                                                                    right: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                    left: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                    notes: null
                                                                  }
                                                                };
                                                                return {
                                                                  ...prev,
                                                                  results_detailed: {
                                                                    ...prev.results_detailed,
                                                                    middle_ear: {
                                                                      ...currentMiddleEar,
                                                                      tympanometry: {
                                                                        ...currentMiddleEar.tympanometry,
                                                                        right: {
                                                                          ...currentMiddleEar.tympanometry.right,
                                                                          type: isSelected ? null : type
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                };
                                                              });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                                                              isSelected
                                                                ? 'bg-red-500 border-red-500 text-white'
                                                                : 'bg-white border-slate-200 text-slate-600 hover:border-red-300 hover:bg-red-50'
                                                            }`}
                                                          >
                                                            {type}
                                                          </button>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                  {TYMPANOMETRY_CHECKLIST_ITEMS.filter(chk => chk.category === 'result').map(chk => {
                                                    const checklistRight = session.results_detailed.middle_ear?.tympanometry?.checklistRight || DEFAULT_TYMPANOMETRY_CHECKLIST;
                                                    const value = checklistRight[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => {
                                                            const currentMiddleEar = prev.results_detailed.middle_ear || {
                                                              performed: true,
                                                              otoscopy: { right: null, left: null, notes: null },
                                                              tympanometry: {
                                                                right: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                left: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                notes: null
                                                              }
                                                            };
                                                            const currentChecklist = currentMiddleEar.tympanometry?.checklistRight || { ...DEFAULT_TYMPANOMETRY_CHECKLIST };
                                                            return {
                                                              ...prev,
                                                              results_detailed: {
                                                                ...prev.results_detailed,
                                                                middle_ear: {
                                                                  ...currentMiddleEar,
                                                                  tympanometry: {
                                                                    ...currentMiddleEar.tympanometry,
                                                                    checklistRight: { ...currentChecklist, [chk.key]: newValue }
                                                                  }
                                                                }
                                                              }
                                                            };
                                                          });
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>

                                              {/* 임상적 해석 */}
                                              <div>
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">임상적 해석</div>
                                                <div className="space-y-1.5">
                                                  {TYMPANOMETRY_CHECKLIST_ITEMS.filter(chk => chk.category === 'interpretation').map(chk => {
                                                    const checklistRight = session.results_detailed.middle_ear?.tympanometry?.checklistRight || DEFAULT_TYMPANOMETRY_CHECKLIST;
                                                    const value = checklistRight[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => {
                                                            const currentMiddleEar = prev.results_detailed.middle_ear || {
                                                              performed: true,
                                                              otoscopy: { right: null, left: null, notes: null },
                                                              tympanometry: {
                                                                right: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                left: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                notes: null
                                                              }
                                                            };
                                                            const currentChecklist = currentMiddleEar.tympanometry?.checklistRight || { ...DEFAULT_TYMPANOMETRY_CHECKLIST };
                                                            return {
                                                              ...prev,
                                                              results_detailed: {
                                                                ...prev.results_detailed,
                                                                middle_ear: {
                                                                  ...currentMiddleEar,
                                                                  tympanometry: {
                                                                    ...currentMiddleEar.tympanometry,
                                                                    checklistRight: { ...currentChecklist, [chk.key]: newValue }
                                                                  }
                                                                }
                                                              }
                                                            };
                                                          });
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>

                                            {/* 왼쪽 귀 체크리스트 */}
                                            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                              <h6 className="font-black text-xs uppercase tracking-widest text-blue-600 mb-3">Lt (왼쪽)</h6>

                                              {/* 결과 확인 */}
                                              <div className="mb-3">
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">결과 확인</div>
                                                <div className="space-y-1.5">
                                                  {/* Type 선택 UI */}
                                                  <div className="p-2 bg-white rounded-lg border border-slate-200">
                                                    <div className="text-[10px] font-bold text-slate-500 mb-2">Type 판정</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                      {TYMPANOMETRY_TYPES.map(type => {
                                                        const currentType = session.results_detailed.middle_ear?.tympanometry?.left?.type;
                                                        const isSelected = currentType === type;
                                                        return (
                                                          <button
                                                            key={type}
                                                            type="button"
                                                            onClick={() => {
                                                              updateSession(prev => {
                                                                const currentMiddleEar = prev.results_detailed.middle_ear || {
                                                                  performed: true,
                                                                  otoscopy: { right: null, left: null, notes: null },
                                                                  tympanometry: {
                                                                    right: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                    left: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                    notes: null
                                                                  }
                                                                };
                                                                return {
                                                                  ...prev,
                                                                  results_detailed: {
                                                                    ...prev.results_detailed,
                                                                    middle_ear: {
                                                                      ...currentMiddleEar,
                                                                      tympanometry: {
                                                                        ...currentMiddleEar.tympanometry,
                                                                        left: {
                                                                          ...currentMiddleEar.tympanometry.left,
                                                                          type: isSelected ? null : type
                                                                        }
                                                                      }
                                                                    }
                                                                  }
                                                                };
                                                              });
                                                            }}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${
                                                              isSelected
                                                                ? 'bg-blue-500 border-blue-500 text-white'
                                                                : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50'
                                                            }`}
                                                          >
                                                            {type}
                                                          </button>
                                                        );
                                                      })}
                                                    </div>
                                                  </div>
                                                  {TYMPANOMETRY_CHECKLIST_ITEMS.filter(chk => chk.category === 'result').map(chk => {
                                                    const checklistLeft = session.results_detailed.middle_ear?.tympanometry?.checklistLeft || DEFAULT_TYMPANOMETRY_CHECKLIST;
                                                    const value = checklistLeft[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => {
                                                            const currentMiddleEar = prev.results_detailed.middle_ear || {
                                                              performed: true,
                                                              otoscopy: { right: null, left: null, notes: null },
                                                              tympanometry: {
                                                                right: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                left: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                notes: null
                                                              }
                                                            };
                                                            const currentChecklist = currentMiddleEar.tympanometry?.checklistLeft || { ...DEFAULT_TYMPANOMETRY_CHECKLIST };
                                                            return {
                                                              ...prev,
                                                              results_detailed: {
                                                                ...prev.results_detailed,
                                                                middle_ear: {
                                                                  ...currentMiddleEar,
                                                                  tympanometry: {
                                                                    ...currentMiddleEar.tympanometry,
                                                                    checklistLeft: { ...currentChecklist, [chk.key]: newValue }
                                                                  }
                                                                }
                                                              }
                                                            };
                                                          });
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>

                                              {/* 임상적 해석 */}
                                              <div>
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">임상적 해석</div>
                                                <div className="space-y-1.5">
                                                  {TYMPANOMETRY_CHECKLIST_ITEMS.filter(chk => chk.category === 'interpretation').map(chk => {
                                                    const checklistLeft = session.results_detailed.middle_ear?.tympanometry?.checklistLeft || DEFAULT_TYMPANOMETRY_CHECKLIST;
                                                    const value = checklistLeft[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => {
                                                            const currentMiddleEar = prev.results_detailed.middle_ear || {
                                                              performed: true,
                                                              otoscopy: { right: null, left: null, notes: null },
                                                              tympanometry: {
                                                                right: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                left: { type: null, peak_pressure_daPa: null, compliance_ml: null, ecv_ml: null },
                                                                notes: null
                                                              }
                                                            };
                                                            const currentChecklist = currentMiddleEar.tympanometry?.checklistLeft || { ...DEFAULT_TYMPANOMETRY_CHECKLIST };
                                                            return {
                                                              ...prev,
                                                              results_detailed: {
                                                                ...prev.results_detailed,
                                                                middle_ear: {
                                                                  ...currentMiddleEar,
                                                                  tympanometry: {
                                                                    ...currentMiddleEar.tympanometry,
                                                                    checklistLeft: { ...currentChecklist, [chk.key]: newValue }
                                                                  }
                                                                }
                                                              }
                                                            };
                                                          });
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 정상/확인</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 이상소견</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'physical_fit_check' ? (
                                        /* 착용감/피드백 체크(돔/몰드) 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-teal-50 to-emerald-50 rounded-2xl border border-teal-100">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* 물리적 착용감 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">물리적 착용감</div>
                                              <div className="space-y-1.5">
                                                {FIT_COMFORT_CHECKLIST_ITEMS.filter(chk => chk.category === 'physical').map(chk => {
                                                  const checklist = session.results_detailed.fitComfortChecklist || DEFAULT_FIT_COMFORT_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            fitComfortChecklist: {
                                                              ...(prev.results_detailed.fitComfortChecklist || DEFAULT_FIT_COMFORT_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 피드백 관련 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">피드백 관련</div>
                                              <div className="space-y-1.5">
                                                {FIT_COMFORT_CHECKLIST_ITEMS.filter(chk => chk.category === 'feedback').map(chk => {
                                                  const checklist = session.results_detailed.fitComfortChecklist || DEFAULT_FIT_COMFORT_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            fitComfortChecklist: {
                                                              ...(prev.results_detailed.fitComfortChecklist || DEFAULT_FIT_COMFORT_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 정상/확인</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 이상소견</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'programming_done' ? (
                                        /* 프로그래밍(처방식 기반) 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* 초기 피팅 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">초기 피팅</div>
                                              <div className="space-y-1.5">
                                                {PROGRAMMING_CHECKLIST_ITEMS.filter(chk => chk.category === 'initial').map(chk => {
                                                  const checklist = session.results_detailed.programmingChecklist || DEFAULT_PROGRAMMING_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            programmingChecklist: {
                                                              ...(prev.results_detailed.programmingChecklist || DEFAULT_PROGRAMMING_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 미세 조정 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">미세 조정</div>
                                              <div className="space-y-1.5">
                                                {PROGRAMMING_CHECKLIST_ITEMS.filter(chk => chk.category === 'fine').map(chk => {
                                                  const checklist = session.results_detailed.programmingChecklist || DEFAULT_PROGRAMMING_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            programmingChecklist: {
                                                              ...(prev.results_detailed.programmingChecklist || DEFAULT_PROGRAMMING_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 정상/확인</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 이상소견</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'rem_verification' ? (
                                        /* REM(실이측정) 수행 체크리스트 - Insertion Gain & Speech Mapping */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-sky-50 to-cyan-50 rounded-2xl border border-sky-100">
                                          {/* Insertion Gain 섹션 */}
                                          <div className="bg-sky-100/50 p-3 rounded-xl border border-sky-200">
                                            <div className="text-xs font-black text-sky-700 mb-3">Insertion Gain (삽입이득)</div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              {/* IG 측정 준비 */}
                                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">측정 준비</div>
                                                <div className="space-y-1.5">
                                                  {REM_CHECKLIST_ITEMS.filter(chk => chk.category === 'ig_prep').map(chk => {
                                                    const checklist = session.results_detailed.remChecklist || DEFAULT_REM_CHECKLIST;
                                                    const value = checklist[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => ({
                                                            ...prev,
                                                            results_detailed: {
                                                              ...prev.results_detailed,
                                                              remChecklist: {
                                                                ...(prev.results_detailed.remChecklist || DEFAULT_REM_CHECKLIST),
                                                                [chk.key]: newValue
                                                              }
                                                            }
                                                          }));
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>

                                              {/* IG 타겟 매칭 */}
                                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">타겟 매칭</div>
                                                <div className="space-y-1.5">
                                                  {REM_CHECKLIST_ITEMS.filter(chk => chk.category === 'ig_target').map(chk => {
                                                    const checklist = session.results_detailed.remChecklist || DEFAULT_REM_CHECKLIST;
                                                    const value = checklist[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => ({
                                                            ...prev,
                                                            results_detailed: {
                                                              ...prev.results_detailed,
                                                              remChecklist: {
                                                                ...(prev.results_detailed.remChecklist || DEFAULT_REM_CHECKLIST),
                                                                [chk.key]: newValue
                                                              }
                                                            }
                                                          }));
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* Speech Mapping 섹션 */}
                                          <div className="bg-cyan-100/50 p-3 rounded-xl border border-cyan-200">
                                            <div className="text-xs font-black text-cyan-700 mb-3">Speech Mapping (어음맵핑)</div>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                              {/* SM 측정 준비 */}
                                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">측정 준비</div>
                                                <div className="space-y-1.5">
                                                  {REM_CHECKLIST_ITEMS.filter(chk => chk.category === 'sm_prep').map(chk => {
                                                    const checklist = session.results_detailed.remChecklist || DEFAULT_REM_CHECKLIST;
                                                    const value = checklist[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => ({
                                                            ...prev,
                                                            results_detailed: {
                                                              ...prev.results_detailed,
                                                              remChecklist: {
                                                                ...(prev.results_detailed.remChecklist || DEFAULT_REM_CHECKLIST),
                                                                [chk.key]: newValue
                                                              }
                                                            }
                                                          }));
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>

                                              {/* SM 입력 레벨별 확인 */}
                                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">입력 레벨별 확인</div>
                                                <div className="space-y-1.5">
                                                  {REM_CHECKLIST_ITEMS.filter(chk => chk.category === 'sm_level').map(chk => {
                                                    const checklist = session.results_detailed.remChecklist || DEFAULT_REM_CHECKLIST;
                                                    const value = checklist[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => ({
                                                            ...prev,
                                                            results_detailed: {
                                                              ...prev.results_detailed,
                                                              remChecklist: {
                                                                ...(prev.results_detailed.remChecklist || DEFAULT_REM_CHECKLIST),
                                                                [chk.key]: newValue
                                                              }
                                                            }
                                                          }));
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>

                                              {/* SM 어음 가청도 */}
                                              <div className="bg-white p-3 rounded-lg border border-slate-200">
                                                <div className="text-[10px] font-bold text-slate-400 mb-2">어음 가청도</div>
                                                <div className="space-y-1.5">
                                                  {REM_CHECKLIST_ITEMS.filter(chk => chk.category === 'sm_audibility').map(chk => {
                                                    const checklist = session.results_detailed.remChecklist || DEFAULT_REM_CHECKLIST;
                                                    const value = checklist[chk.key];
                                                    return (
                                                      <button
                                                        key={chk.key}
                                                        type="button"
                                                        onClick={() => {
                                                          const newValue = value === null ? true : value === true ? false : null;
                                                          updateSession(prev => ({
                                                            ...prev,
                                                            results_detailed: {
                                                              ...prev.results_detailed,
                                                              remChecklist: {
                                                                ...(prev.results_detailed.remChecklist || DEFAULT_REM_CHECKLIST),
                                                                [chk.key]: newValue
                                                              }
                                                            }
                                                          }));
                                                        }}
                                                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                          value === true
                                                            ? 'bg-green-100 text-green-700 border border-green-200'
                                                            : value === false
                                                              ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                              : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                        }`}
                                                      >
                                                        {value === true ? (
                                                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                        ) : value === false ? (
                                                          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                        ) : (
                                                          <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                        )}
                                                        <span className="text-left">{chk.label}</span>
                                                      </button>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 정상/확인</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 이상소견</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'mpo_safety_check' ? (
                                        /* 최대출력(MPO) 안전 확인 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl border border-rose-100">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* UCL 기반 설정 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">UCL 기반 설정</div>
                                              <div className="space-y-1.5">
                                                {MPO_CHECKLIST_ITEMS.filter(chk => chk.category === 'ucl').map(chk => {
                                                  const checklist = session.results_detailed.mpoChecklist || DEFAULT_MPO_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            mpoChecklist: {
                                                              ...(prev.results_detailed.mpoChecklist || DEFAULT_MPO_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 안전성 검증 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">안전성 검증</div>
                                              <div className="space-y-1.5">
                                                {MPO_CHECKLIST_ITEMS.filter(chk => chk.category === 'safety').map(chk => {
                                                  const checklist = session.results_detailed.mpoChecklist || DEFAULT_MPO_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            mpoChecklist: {
                                                              ...(prev.results_detailed.mpoChecklist || DEFAULT_MPO_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 정상/확인</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 이상소견</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'listening_check' ? (
                                        /* Listening Check (청취 점검) 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-cyan-50 to-sky-50 rounded-2xl border border-cyan-100">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* 외관 점검 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">외관 점검</div>
                                              <div className="space-y-1.5">
                                                {LISTENING_CHECK_ITEMS.filter(chk => chk.category === 'visual').map(chk => {
                                                  const checklist = session.results_detailed.listeningCheckChecklist || DEFAULT_LISTENING_CHECK_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            listeningCheckChecklist: {
                                                              ...(prev.results_detailed.listeningCheckChecklist || DEFAULT_LISTENING_CHECK_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 음향 점검 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">음향 점검</div>
                                              <div className="space-y-1.5">
                                                {LISTENING_CHECK_ITEMS.filter(chk => chk.category === 'acoustic').map(chk => {
                                                  const checklist = session.results_detailed.listeningCheckChecklist || DEFAULT_LISTENING_CHECK_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            listeningCheckChecklist: {
                                                              ...(prev.results_detailed.listeningCheckChecklist || DEFAULT_LISTENING_CHECK_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 정상/확인</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 이상소견</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'eaa_testbox' || item.key === 'eaa_quick_check' ? (
                                        /* 테스트박스(EAA) 간이 점검 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-2xl border border-amber-100">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* 기본 측정 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">기본 측정</div>
                                              <div className="space-y-1.5">
                                                {EAA_CHECKLIST_ITEMS.filter(chk => chk.category === 'measurement').map(chk => {
                                                  const checklist = session.results_detailed.eaaChecklist || DEFAULT_EAA_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            eaaChecklist: {
                                                              ...(prev.results_detailed.eaaChecklist || DEFAULT_EAA_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 스펙 비교 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">스펙 비교</div>
                                              <div className="space-y-1.5">
                                                {EAA_CHECKLIST_ITEMS.filter(chk => chk.category === 'spec').map(chk => {
                                                  const checklist = session.results_detailed.eaaChecklist || DEFAULT_EAA_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            eaaChecklist: {
                                                              ...(prev.results_detailed.eaaChecklist || DEFAULT_EAA_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 이상 징후 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">이상 징후</div>
                                              <div className="space-y-1.5">
                                                {EAA_CHECKLIST_ITEMS.filter(chk => chk.category === 'issue').map(chk => {
                                                  const checklist = session.results_detailed.eaaChecklist || DEFAULT_EAA_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            eaaChecklist: {
                                                              ...(prev.results_detailed.eaaChecklist || DEFAULT_EAA_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 정상/확인</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 이상소견</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'deep_cleaning' || item.key === 'cleaning_consumables' ? (
                                        /* 딥 클리닝/소모품 교체 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* 외관 클리닝 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">외관 클리닝</div>
                                              <div className="space-y-1.5">
                                                {DEEP_CLEANING_ITEMS.filter(chk => chk.category === 'cleaning').map(chk => {
                                                  const checklist = session.results_detailed.deepCleaningChecklist || DEFAULT_DEEP_CLEANING_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            deepCleaningChecklist: {
                                                              ...(prev.results_detailed.deepCleaningChecklist || DEFAULT_DEEP_CLEANING_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 소모품 점검 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">소모품 점검</div>
                                              <div className="space-y-1.5">
                                                {DEEP_CLEANING_ITEMS.filter(chk => chk.category === 'consumables').map(chk => {
                                                  const checklist = session.results_detailed.deepCleaningChecklist || DEFAULT_DEEP_CLEANING_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            deepCleaningChecklist: {
                                                              ...(prev.results_detailed.deepCleaningChecklist || DEFAULT_DEEP_CLEANING_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 추가 점검 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">추가 점검</div>
                                              <div className="space-y-1.5">
                                                {DEEP_CLEANING_ITEMS.filter(chk => chk.category === 'extra').map(chk => {
                                                  const checklist = session.results_detailed.deepCleaningChecklist || DEFAULT_DEEP_CLEANING_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            deepCleaningChecklist: {
                                                              ...(prev.results_detailed.deepCleaningChecklist || DEFAULT_DEEP_CLEANING_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 정상/확인</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 이상소견</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'orientation_core' ? (
                                        /* 착용/탈착, 충전/관리 교육 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border border-indigo-100">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* 착용/탈착 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">착용/탈착</div>
                                              <div className="space-y-1.5">
                                                {ORIENTATION_CORE_ITEMS.filter(chk => chk.category === 'wear').map(chk => {
                                                  const checklist = session.results_detailed.orientationCoreChecklist || DEFAULT_ORIENTATION_CORE_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            orientationCoreChecklist: {
                                                              ...(prev.results_detailed.orientationCoreChecklist || DEFAULT_ORIENTATION_CORE_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 충전/배터리 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">충전/배터리</div>
                                              <div className="space-y-1.5">
                                                {ORIENTATION_CORE_ITEMS.filter(chk => chk.category === 'charge').map(chk => {
                                                  const checklist = session.results_detailed.orientationCoreChecklist || DEFAULT_ORIENTATION_CORE_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            orientationCoreChecklist: {
                                                              ...(prev.results_detailed.orientationCoreChecklist || DEFAULT_ORIENTATION_CORE_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 관리/청소 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">관리/청소</div>
                                              <div className="space-y-1.5">
                                                {ORIENTATION_CORE_ITEMS.filter(chk => chk.category === 'care').map(chk => {
                                                  const checklist = session.results_detailed.orientationCoreChecklist || DEFAULT_ORIENTATION_CORE_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            orientationCoreChecklist: {
                                                              ...(prev.results_detailed.orientationCoreChecklist || DEFAULT_ORIENTATION_CORE_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 완료</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 미완료</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'adaptation_schedule' ? (
                                        /* 적응 스케줄 제공 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* 착용 시간 안내 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">착용 시간 안내</div>
                                              <div className="space-y-1.5">
                                                {ADAPTATION_SCHEDULE_ITEMS.filter(chk => chk.category === 'duration').map(chk => {
                                                  const checklist = session.results_detailed.adaptationScheduleChecklist || DEFAULT_ADAPTATION_SCHEDULE_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            adaptationScheduleChecklist: {
                                                              ...(prev.results_detailed.adaptationScheduleChecklist || DEFAULT_ADAPTATION_SCHEDULE_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 환경 단계별 안내 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">환경 단계별 안내</div>
                                              <div className="space-y-1.5">
                                                {ADAPTATION_SCHEDULE_ITEMS.filter(chk => chk.category === 'environment').map(chk => {
                                                  const checklist = session.results_detailed.adaptationScheduleChecklist || DEFAULT_ADAPTATION_SCHEDULE_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            adaptationScheduleChecklist: {
                                                              ...(prev.results_detailed.adaptationScheduleChecklist || DEFAULT_ADAPTATION_SCHEDULE_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 적응 기대치 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">적응 기대치</div>
                                              <div className="space-y-1.5">
                                                {ADAPTATION_SCHEDULE_ITEMS.filter(chk => chk.category === 'expectation').map(chk => {
                                                  const checklist = session.results_detailed.adaptationScheduleChecklist || DEFAULT_ADAPTATION_SCHEDULE_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            adaptationScheduleChecklist: {
                                                              ...(prev.results_detailed.adaptationScheduleChecklist || DEFAULT_ADAPTATION_SCHEDULE_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 완료</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 미완료</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'comm_strategies' ? (
                                        /* 소음환경 대화 전략 안내 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-fuchsia-50 to-pink-50 rounded-2xl border border-fuchsia-100">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* 청취 전략 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">청취 전략</div>
                                              <div className="space-y-1.5">
                                                {COMM_STRATEGIES_ITEMS.filter(chk => chk.category === 'listening').map(chk => {
                                                  const checklist = session.results_detailed.commStrategiesChecklist || DEFAULT_COMM_STRATEGIES_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            commStrategiesChecklist: {
                                                              ...(prev.results_detailed.commStrategiesChecklist || DEFAULT_COMM_STRATEGIES_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 환경 조절 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">환경 조절</div>
                                              <div className="space-y-1.5">
                                                {COMM_STRATEGIES_ITEMS.filter(chk => chk.category === 'environment').map(chk => {
                                                  const checklist = session.results_detailed.commStrategiesChecklist || DEFAULT_COMM_STRATEGIES_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            commStrategiesChecklist: {
                                                              ...(prev.results_detailed.commStrategiesChecklist || DEFAULT_COMM_STRATEGIES_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 의사소통 요령 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">의사소통 요령</div>
                                              <div className="space-y-1.5">
                                                {COMM_STRATEGIES_ITEMS.filter(chk => chk.category === 'communication').map(chk => {
                                                  const checklist = session.results_detailed.commStrategiesChecklist || DEFAULT_COMM_STRATEGIES_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            commStrategiesChecklist: {
                                                              ...(prev.results_detailed.commStrategiesChecklist || DEFAULT_COMM_STRATEGIES_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 완료</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 미완료</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'education_refresh' ? (
                                        /* 관리/청소/교체주기 리마인드 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-lime-50 to-green-50 rounded-2xl border border-lime-100">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* 일상 관리 안내 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">일상 관리 안내</div>
                                              <div className="space-y-1.5">
                                                {EDUCATION_REFRESH_ITEMS.filter(chk => chk.category === 'daily').map(chk => {
                                                  const checklist = session.results_detailed.educationRefreshChecklist || DEFAULT_EDUCATION_REFRESH_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            educationRefreshChecklist: {
                                                              ...(prev.results_detailed.educationRefreshChecklist || DEFAULT_EDUCATION_REFRESH_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 교체주기 안내 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">교체주기 안내</div>
                                              <div className="space-y-1.5">
                                                {EDUCATION_REFRESH_ITEMS.filter(chk => chk.category === 'cycle').map(chk => {
                                                  const checklist = session.results_detailed.educationRefreshChecklist || DEFAULT_EDUCATION_REFRESH_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            educationRefreshChecklist: {
                                                              ...(prev.results_detailed.educationRefreshChecklist || DEFAULT_EDUCATION_REFRESH_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 주의사항 안내 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">주의사항 안내</div>
                                              <div className="space-y-1.5">
                                                {EDUCATION_REFRESH_ITEMS.filter(chk => chk.category === 'caution').map(chk => {
                                                  const checklist = session.results_detailed.educationRefreshChecklist || DEFAULT_EDUCATION_REFRESH_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            educationRefreshChecklist: {
                                                              ...(prev.results_detailed.educationRefreshChecklist || DEFAULT_EDUCATION_REFRESH_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 완료</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 미완료</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'datalogging_adj' ? (
                                        /* 데이터로깅 기반 조정 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
                                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {/* 사용 패턴 분석 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">사용 패턴 분석</div>
                                              <div className="space-y-1.5">
                                                {DATALOGGING_ADJ_ITEMS.filter(chk => chk.category === 'pattern').map(chk => {
                                                  const checklist = session.results_detailed.dataloggingAdjChecklist || DEFAULT_DATALOGGING_ADJ_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            dataloggingAdjChecklist: {
                                                              ...(prev.results_detailed.dataloggingAdjChecklist || DEFAULT_DATALOGGING_ADJ_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 환경별 조정 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">환경별 조정</div>
                                              <div className="space-y-1.5">
                                                {DATALOGGING_ADJ_ITEMS.filter(chk => chk.category === 'environment').map(chk => {
                                                  const checklist = session.results_detailed.dataloggingAdjChecklist || DEFAULT_DATALOGGING_ADJ_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            dataloggingAdjChecklist: {
                                                              ...(prev.results_detailed.dataloggingAdjChecklist || DEFAULT_DATALOGGING_ADJ_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 완료</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 미완료</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'fine_tuning' ? (
                                        /* 필요 시 프로그램/이득 조정 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-2xl border border-violet-100">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* 이득 조정 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">이득 조정</div>
                                              <div className="space-y-1.5">
                                                {FINE_TUNING_ITEMS.filter(chk => chk.category === 'gain').map(chk => {
                                                  const checklist = session.results_detailed.fineTuningChecklist || DEFAULT_FINE_TUNING_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            fineTuningChecklist: {
                                                              ...(prev.results_detailed.fineTuningChecklist || DEFAULT_FINE_TUNING_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 프로그램 조정 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">프로그램 조정</div>
                                              <div className="space-y-1.5">
                                                {FINE_TUNING_ITEMS.filter(chk => chk.category === 'program').map(chk => {
                                                  const checklist = session.results_detailed.fineTuningChecklist || DEFAULT_FINE_TUNING_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            fineTuningChecklist: {
                                                              ...(prev.results_detailed.fineTuningChecklist || DEFAULT_FINE_TUNING_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 기타 조정 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">기타 조정</div>
                                              <div className="space-y-1.5">
                                                {FINE_TUNING_ITEMS.filter(chk => chk.category === 'other').map(chk => {
                                                  const checklist = session.results_detailed.fineTuningChecklist || DEFAULT_FINE_TUNING_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            fineTuningChecklist: {
                                                              ...(prev.results_detailed.fineTuningChecklist || DEFAULT_FINE_TUNING_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 완료</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 미완료</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'device_plan' ? (
                                        /* 보청기 스타일/기능/양이 계획 수립 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-rose-50 to-orange-50 rounded-2xl border border-rose-100">
                                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {/* 스타일 선정 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">스타일 선정</div>
                                              <div className="space-y-1.5">
                                                {DEVICE_PLAN_ITEMS.filter(chk => chk.category === 'style').map(chk => {
                                                  const checklist = session.results_detailed.devicePlanChecklist || DEFAULT_DEVICE_PLAN_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            devicePlanChecklist: {
                                                              ...(prev.results_detailed.devicePlanChecklist || DEFAULT_DEVICE_PLAN_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 기능 선정 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">기능 선정</div>
                                              <div className="space-y-1.5">
                                                {DEVICE_PLAN_ITEMS.filter(chk => chk.category === 'feature').map(chk => {
                                                  const checklist = session.results_detailed.devicePlanChecklist || DEFAULT_DEVICE_PLAN_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            devicePlanChecklist: {
                                                              ...(prev.results_detailed.devicePlanChecklist || DEFAULT_DEVICE_PLAN_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 양이/편측 결정 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">양이/편측 결정</div>
                                              <div className="space-y-1.5">
                                                {DEVICE_PLAN_ITEMS.filter(chk => chk.category === 'binaural').map(chk => {
                                                  const checklist = session.results_detailed.devicePlanChecklist || DEFAULT_DEVICE_PLAN_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            devicePlanChecklist: {
                                                              ...(prev.results_detailed.devicePlanChecklist || DEFAULT_DEVICE_PLAN_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 예산/보조금 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">예산/보조금</div>
                                              <div className="space-y-1.5">
                                                {DEVICE_PLAN_ITEMS.filter(chk => chk.category === 'budget').map(chk => {
                                                  const checklist = session.results_detailed.devicePlanChecklist || DEFAULT_DEVICE_PLAN_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            devicePlanChecklist: {
                                                              ...(prev.results_detailed.devicePlanChecklist || DEFAULT_DEVICE_PLAN_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 완료</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 미완료</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : item.key === 'expectation_counseling' ? (
                                        /* 현실적 기대치/적응기간 안내 체크리스트 */
                                        <div className="space-y-4 p-4 bg-gradient-to-br from-cyan-50 to-sky-50 rounded-2xl border border-cyan-100">
                                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* 청력 회복 기대치 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">청력 회복 기대치</div>
                                              <div className="space-y-1.5">
                                                {EXPECTATION_ITEMS.filter(chk => chk.category === 'recovery').map(chk => {
                                                  const checklist = session.results_detailed.expectationChecklist || DEFAULT_EXPECTATION_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            expectationChecklist: {
                                                              ...(prev.results_detailed.expectationChecklist || DEFAULT_EXPECTATION_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 적응 기간 안내 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">적응 기간 안내</div>
                                              <div className="space-y-1.5">
                                                {EXPECTATION_ITEMS.filter(chk => chk.category === 'adaptation').map(chk => {
                                                  const checklist = session.results_detailed.expectationChecklist || DEFAULT_EXPECTATION_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            expectationChecklist: {
                                                              ...(prev.results_detailed.expectationChecklist || DEFAULT_EXPECTATION_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>

                                            {/* 일반적인 초기 경험 */}
                                            <div className="bg-white p-3 rounded-lg border border-slate-200">
                                              <div className="text-[10px] font-bold text-slate-400 mb-2">일반적인 초기 경험</div>
                                              <div className="space-y-1.5">
                                                {EXPECTATION_ITEMS.filter(chk => chk.category === 'initial').map(chk => {
                                                  const checklist = session.results_detailed.expectationChecklist || DEFAULT_EXPECTATION_CHECKLIST;
                                                  const value = checklist[chk.key];
                                                  return (
                                                    <button
                                                      key={chk.key}
                                                      type="button"
                                                      onClick={() => {
                                                        const newValue = value === null ? true : value === true ? false : null;
                                                        updateSession(prev => ({
                                                          ...prev,
                                                          results_detailed: {
                                                            ...prev.results_detailed,
                                                            expectationChecklist: {
                                                              ...(prev.results_detailed.expectationChecklist || DEFAULT_EXPECTATION_CHECKLIST),
                                                              [chk.key]: newValue
                                                            }
                                                          }
                                                        }));
                                                      }}
                                                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-xs font-medium transition-all ${
                                                        value === true
                                                          ? 'bg-green-100 text-green-700 border border-green-200'
                                                          : value === false
                                                            ? 'bg-amber-100 text-amber-700 border border-amber-200'
                                                            : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'
                                                      }`}
                                                    >
                                                      {value === true ? (
                                                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                                      ) : value === false ? (
                                                        <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                                                      ) : (
                                                        <Circle className="w-4 h-4 text-slate-300 flex-shrink-0" />
                                                      )}
                                                      <span className="text-left">{chk.label}</span>
                                                    </button>
                                                  );
                                                })}
                                              </div>
                                            </div>
                                          </div>

                                          {/* 범례 */}
                                          <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-2 border-t border-slate-200">
                                            <span className="flex items-center gap-1"><Circle className="w-3 h-3" /> 미확인</span>
                                            <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-green-500" /> 완료</span>
                                            <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3 text-amber-500" /> 미완료</span>
                                          </div>

                                          {/* 추가 메모 */}
                                          <input
                                            className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                            placeholder="추가 메모를 입력하세요..."
                                            value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                            onChange={e => {
                                              const currentNote = session.checklist[item.key]?.note || '';
                                              const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                              const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                              updateSession(prev => ({
                                                ...prev,
                                                checklist: {
                                                  ...prev.checklist,
                                                  [item.key]: {
                                                    ...prev.checklist[item.key],
                                                    note: newNote
                                                  }
                                                }
                                              }));
                                            }}
                                          />
                                        </div>
                                      ) : (
                                        <input
                                          className="w-full p-3 text-sm border-2 border-slate-100 rounded-xl outline-none bg-slate-50 focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400"
                                          placeholder="추가 메모를 입력하세요..."
                                          value={(session.checklist[item.key]?.note || '').replace(/\[.*?\]\s*/g, '')}
                                          onChange={e => {
                                            const currentNote = session.checklist[item.key]?.note || '';
                                            const tags = currentNote.match(/\[.*?\]/g)?.join(' ') || '';
                                            const newNote = tags ? `${tags} ${e.target.value}`.trim() : e.target.value;
                                            updateSession(prev => ({
                                              ...prev,
                                              checklist: {
                                                ...prev.checklist,
                                                [item.key]: {
                                                  ...prev.checklist[item.key],
                                                  note: newNote
                                                }
                                              }
                                            }));
                                          }}
                                        />
                                      )}
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                      {[
                                        { key: 'DONE', label: '완료', color: 'bg-emerald-500 border-emerald-500 text-white', inactive: 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100' },
                                        { key: 'SKIPPED', label: '건너뜀', color: 'bg-amber-500 border-amber-500 text-white', inactive: 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100' },
                                        { key: 'N/A', label: '해당없음', color: 'bg-slate-500 border-slate-500 text-white', inactive: 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200' }
                                      ].map(status => (
                                        <button
                                          key={status.key}
                                          onClick={() => updateSession(prev => ({...prev, checklist: {...prev.checklist, [item.key]: {...prev.checklist[item.key], status: status.key as any}}}))}
                                          className={`px-4 py-2.5 rounded-xl text-xs font-black border-2 transition-all shadow-sm ${session.checklist[item.key]?.status === status.key ? status.color + ' shadow-md' : status.inactive}`}
                                        >
                                          {status.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {section === '문진/상담' && questionnaireData && (
                            <div className="mt-6 p-6 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-6">
                               <div className="flex items-center gap-2 mb-4">
                                 <FileText className="w-5 h-5 text-blue-600" />
                                 <h6 className="text-sm font-black text-blue-900">일반 상담/청력검사 설문지 요약</h6>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 {questionnaireData.visit_motives && questionnaireData.visit_motives.length > 0 && (
                                   <div className="bg-white p-4 rounded-2xl border border-blue-100">
                                     <label className="text-[10px] font-black text-blue-400 uppercase">방문 동기</label>
                                     <p className="text-sm font-bold text-slate-700 mt-1">{questionnaireData.visit_motives.join(', ')}</p>
                                   </div>
                                 )}

                                 {questionnaireData.hearing_loss_onset_note && (
                                   <div className="bg-white p-4 rounded-2xl border border-blue-100">
                                     <label className="text-[10px] font-black text-blue-400 uppercase">발병 시기</label>
                                     <p className="text-sm font-bold text-slate-700 mt-1">{questionnaireData.hearing_loss_onset_note}</p>
                                   </div>
                                 )}

                                 {questionnaireData.better_ear && (
                                   <div className="bg-white p-4 rounded-2xl border border-blue-100">
                                     <label className="text-[10px] font-black text-blue-400 uppercase">더 잘 들리는 귀</label>
                                     <p className="text-sm font-bold text-slate-700 mt-1">{questionnaireData.better_ear}</p>
                                   </div>
                                 )}

                                 {questionnaireData.desired_aid_ear && (
                                   <div className="bg-white p-4 rounded-2xl border border-blue-100">
                                     <label className="text-[10px] font-black text-blue-400 uppercase">보청기 희망 위치</label>
                                     <p className="text-sm font-bold text-slate-700 mt-1">{questionnaireData.desired_aid_ear}</p>
                                   </div>
                                 )}

                                 {questionnaireData.hearing_aid_experience && (
                                   <div className="bg-white p-4 rounded-2xl border border-blue-100">
                                     <label className="text-[10px] font-black text-blue-400 uppercase">보청기 경험</label>
                                     <p className="text-sm font-bold text-slate-700 mt-1">{questionnaireData.hearing_aid_experience}</p>
                                     {questionnaireData.hearing_aid_exp_note && <p className="text-xs text-slate-500 mt-1">{questionnaireData.hearing_aid_exp_note}</p>}
                                   </div>
                                 )}

                                 {questionnaireData.tinnitus && (
                                   <div className="bg-white p-4 rounded-2xl border border-blue-100">
                                     <label className="text-[10px] font-black text-blue-400 uppercase">이명 증상</label>
                                     <p className="text-sm font-bold text-slate-700 mt-1">{questionnaireData.tinnitus}</p>
                                     {questionnaireData.tinnitus_note && <p className="text-xs text-slate-500 mt-1">{questionnaireData.tinnitus_note}</p>}
                                   </div>
                                 )}
                               </div>

                               {questionnaireData.concerns_multi && questionnaireData.concerns_multi.length > 0 && (
                                 <div className="bg-white p-4 rounded-2xl border border-orange-100">
                                   <label className="text-[10px] font-black text-orange-400 uppercase">보청기 우려사항</label>
                                   <div className="flex flex-wrap gap-2 mt-2">
                                     {questionnaireData.concerns_multi.map((c, idx) => (
                                       <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-700 text-xs font-bold rounded-full">{c}</span>
                                     ))}
                                   </div>
                                 </div>
                               )}

                               {questionnaireData.cosi_top3_goals && questionnaireData.cosi_top3_goals.length > 0 && (
                                 <div className="bg-white p-4 rounded-2xl border border-emerald-100">
                                   <label className="text-[10px] font-black text-emerald-400 uppercase">COSI 목표 (TOP 3)</label>
                                   <div className="space-y-2 mt-2">
                                     {questionnaireData.cosi_top3_goals.map((goal, idx) => (
                                       <div key={idx} className="flex items-start gap-2">
                                         <span className="w-5 h-5 bg-emerald-600 text-white text-[10px] font-black rounded-full flex items-center justify-center shrink-0">{idx + 1}</span>
                                         <div>
                                           <span className="text-xs font-bold text-emerald-700">{goal.category}</span>
                                           {goal.note && <p className="text-xs text-slate-600 mt-0.5">{goal.note}</p>}
                                         </div>
                                       </div>
                                     ))}
                                   </div>
                                 </div>
                               )}
                            </div>
                          )}

                          {section === '청각검사' && (
                            <div className="mt-6 p-6 bg-slate-50 rounded-3xl border border-slate-200" data-capture="speech-validation">
                               <SpeechEditor
                                 data={session.results_detailed?.speech || {
                                   performed: false,
                                   srt_dbhl: { right: null, left: null, free_field: null, free_field_right: null, free_field_left: null },
                                   wrs: { right: null, left: null, free_field: null, free_field_right: null, free_field_left: null, notes: null },
                                   mcl_dbhl: { right: null, left: null, free_field: null, free_field_right: null, free_field_left: null },
                                   ucl_dbhl: { right: null, left: null, free_field: null, free_field_right: null, free_field_left: null }
                                 }}
                                 onChange={(d) => updateSession(prev => ({...prev, results_detailed: {...prev.results_detailed, speech: d}}))}
                                 pureToneData={session.results_detailed?.pure_tone || {
                                   performed: false,
                                   test_date: null,
                                   transducer: null,
                                   ac_dbhl: { right: {}, left: {} },
                                   sf_dbhl: { right: {}, left: {} },
                                   bc_dbhl: { right: {}, left: {} },
                                   nr: { right: [], left: [], sf_right: [], sf_left: [] },
                                   masking_used: null,
                                   notes: null,
                                   derived: { pta_right: null, pta_left: null, pta_sf_right: null, pta_sf_left: null }
                                 }}
                               />
                            </div>
                          )}

                          {section === '결과평가' && (
                             <div className="bg-orange-50/50 p-6 rounded-3xl border border-orange-100">
                                <label className="block text-xs font-black text-orange-900 mb-3 uppercase">사용자 만족도 (0~10)</label>
                                <div className="flex justify-between gap-1">
                                  {[0,1,2,3,4,5,6,7,8,9,10].map(v => (
                                    <button 
                                      key={v}
                                      onClick={() => updateSession(prev => ({...prev, validation: {...prev.validation, satisfaction_0to10: v}}))}
                                      className={`flex-1 h-10 rounded-lg font-black text-xs transition-all ${session.validation?.satisfaction_0to10 === v ? 'bg-orange-600 text-white' : 'bg-white border text-slate-400'}`}
                                    >
                                      {v}
                                    </button>
                                  ))}
                                </div>
                             </div>
                          )}
                        </div>
                      )}
                   </div>
                 );
               })}
            </div>
        </div>
      </div>

      <div className="sticky bottom-8 flex justify-center z-50">
        <button onClick={handleSave} className="bg-slate-900 text-white px-28 py-6 rounded-3xl font-black text-2xl flex items-center gap-4 shadow-2xl hover:scale-105 active:scale-95 transition-all">
          <Save className="w-8 h-8" /> 프로토콜 최종 저장
        </button>
      </div>
    </div>
  );
};

export default HaProtocolTab;
