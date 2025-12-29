
export interface BaseRecord {
  brand_id: string;
  center_id: string;
  counselor_name: string;
  created_at: string;
  updated_at: string;
}

export interface Customer extends BaseRecord {
  id: string;
  name: string;
  phone: string;
  gender: 'M' | 'F' | null;
  birth_date: string | null;
  age: number | null;
  address?: string;
  guardian_name?: string;
  guardian_phone?: string;
  disability_status: 'Y' | 'N' | null;
  disability_date?: string;
  hearing_aid_experience: 'Y' | 'N' | null;
  surgery_history: 'Y' | 'N' | null;
}

export type VisitType = 'GENERAL' | 'HA_PROTOCOL';
export type HAStage = 'HA_1' | 'HA_2' | 'HA_3' | 'AFTERCARE_3MO';

export interface Visit extends BaseRecord {
  id: string;
  customer_id: string;
  visit_date: string;
  purpose: string[];
  memo?: string;
  visit_type: VisitType;
  ha_stage: HAStage | null;
  ha_stage_label?: string;
  recommended_next_visit_date?: string | null;
  next_visit_rule?: 'WEEKLY' | '3MONTH' | null;
  protocol_version?: string;
}

export interface CosiGoal {
  category: string;
  note: string;
}

export interface QuestionnaireData extends BaseRecord {
  visit_id: string;
  customer_id: string;
  visit_motives: string[];
  visit_motives_intro_name?: string;
  visit_motives_other?: string;
  hearing_test_experience?: string;
  hearing_test_exp_note?: string;
  ent_visit_within_1y?: string;
  ent_visit_note?: string;
  hearing_aid_experience?: string;
  hearing_aid_exp_note?: string;
  hearing_loss_onset_note?: string;
  ear_disease_treatment_history?: string;
  ear_disease_note?: string;
  tinnitus?: string;
  tinnitus_note?: string;
  better_ear?: string;
  desired_aid_ear?: string;
  phone_ear?: string;
  dexterity_issue?: string;
  occupation_hobby?: string;
  diff_quiet_1to1?: number;
  diff_small_group?: number;
  diff_background_noise?: number;
  diff_party_multi_talkers?: number;
  diff_reverberation_distance?: number;
  diff_tv_volume?: number;
  diff_phone_speech?: number;
  aversive_loud_sounds?: number;
  social_withdrawal?: number;
  emotional_impact?: number;
  expectation_level?: string;
  expectation_other?: string;
  concerns_multi: string[];
  concerns_other?: string;
  cosi_top3_goals: CosiGoal[];

  // F. 보청기 스타일/기능/양이 계획 수립
  ha_style_hearing_loss_level?: string[];
  ha_style_ear_canal_check?: string[];
  ha_style_dexterity?: string[];
  ha_style_cosmetic_preference?: string;
  ha_features_connectivity?: string[];
  ha_features_tinnitus?: string[];
  ha_features_charging?: string[];
  ha_binaural_bilateral_check?: string[];
  ha_binaural_effect_explanation?: string[];
  ha_binaural_unilateral_considerations?: string[];
  ha_binaural_side_decision?: string[];
  ha_budget_price_range?: string;
  ha_budget_subsidy?: string[];
  ha_budget_payment_options?: string[];
  ha_fitting_adaptation_plan?: string[];
  ha_fitting_checkup_schedule?: string[];
  ha_fitting_warranty_as?: string[];
  ha_additional_work_environment?: string[];
  ha_additional_comorbidity?: string[];

  // G. 현실적 기대치/적응기간 안내
  expectation_realistic_understanding?: string[];
  expectation_adaptation_goals?: string[];
  expectation_initial_experiences?: string[];
  expectation_improvement_areas?: string[];
  expectation_difficult_situations?: string[];
  expectation_success_practices?: string[];
}

export interface DetailedPureTone {
  performed: boolean;
  test_date: string | null;
  transducer: 'INSERT' | 'SUPRA' | 'FREE_FIELD' | null;
  ac_dbhl: {
    right: Record<string, number | null>;
    left: Record<string, number | null>;
  };
  bc_dbhl: {
    right: Record<string, number | null>;
    left: Record<string, number | null>;
  };
  sf_dbhl: {
    right: Record<string, number | null>;
    left: Record<string, number | null>;
  };
  nr: { right: string[]; left: string[]; sf_right: string[]; sf_left: string[] };
  masking_used: boolean | null;
  notes: string | null;
  derived: {
    pta_right: number | null;
    pta_left: number | null;
    pta_sf_right: number | null;
    pta_sf_left: number | null;
  };
}

export interface OtoscopyChecklist {
  // 외이도(External Ear Canal) 관련
  earwax: boolean | null;           // 이구(귀지) 상태 확인
  inflammation: boolean | null;     // 외이도 염증/발적 여부
  stenosis: boolean | null;         // 외이도 협착 여부
  discharge: boolean | null;        // 분비물 유무
  // 고막(Tympanic Membrane) 관련
  perforation: boolean | null;      // 고막 천공 여부
  discoloration: boolean | null;    // 고막 색상 이상 (발적/혼탁)
  effusion: boolean | null;         // 삼출액 저류 소견
  lightReflex: boolean | null;      // 고막 반사(Light reflex) 정상 여부
}

export interface TympanometryChecklist {
  // 결과 확인
  typeComplete: boolean | null;           // Type 판정 완료 (A/As/Ad/B/C)
  peakPressureNormal: boolean | null;     // Peak Pressure 정상 범위 확인
  complianceNormal: boolean | null;       // Compliance 정상 범위 확인
  ecvNormal: boolean | null;              // ECV(외이도 용적) 정상 범위 확인
  // 임상적 해석
  effusionSuspected: boolean | null;      // 중이 삼출액 의심 소견 확인
  tubeDysfunction: boolean | null;        // 이관 기능 이상 소견 확인
  perforationSuspected: boolean | null;   // 고막 천공 의심 소견 확인 (ECV 증가)
  ossicularAbnormality: boolean | null;   // 이소골 연쇄 이상 의심 확인
}

export interface DetailedMiddleEar {
  performed: boolean;
  otoscopy: {
    right: string | null;
    left: string | null;
    notes: string | null;
    checklistRight?: OtoscopyChecklist;
    checklistLeft?: OtoscopyChecklist;
  };
  tympanometry: {
    right: {
      type: 'A' | 'As' | 'Ad' | 'B' | 'C' | 'UNKNOWN' | null;
      peak_pressure_daPa: number | null;
      compliance_ml: number | null;
      ecv_ml: number | null;
    };
    left: {
      type: 'A' | 'As' | 'Ad' | 'B' | 'C' | 'UNKNOWN' | null;
      peak_pressure_daPa: number | null;
      compliance_ml: number | null;
      ecv_ml: number | null;
    };
    notes: string | null;
    checklistRight?: TympanometryChecklist;
    checklistLeft?: TympanometryChecklist;
  };
}

export interface DetailedSpeech {
  performed: boolean;
  srt_dbhl: { right: number[] | null; left: number[] | null; free_field: number[] | null; free_field_right: number[] | null; free_field_left: number[] | null };
  wrs: {
    right: { list_id: string | null; level_dbhl: number | null; score_percent: number[] | null } | null;
    left: { list_id: string | null; level_dbhl: number | null; score_percent: number[] | null } | null;
    free_field: { list_id: string | null; level_dbhl: number | null; score_percent: number[] | null } | null;
    free_field_right: { list_id: string | null; level_dbhl: number | null; score_percent: number[] | null } | null;
    free_field_left: { list_id: string | null; level_dbhl: number | null; score_percent: number[] | null } | null;
    notes: string | null;
  };
  mcl_dbhl: { right: number[] | null; left: number[] | null; free_field: number[] | null; free_field_right: number[] | null; free_field_left: number[] | null };
  ucl_dbhl: { right: number[] | null; left: number[] | null; free_field: number[] | null; free_field_right: number[] | null; free_field_left: number[] | null };
}

export interface DetailedSoundField {
  performed: boolean;
  aided_thresholds?: {
    right?: Record<string, number | null>;
    left?: Record<string, number | null>;
  } | null;
  aided_speech?: {
    test_name: string | null;
    score_right: number | null;
    score_left: number | null;
    note: string | null;
  } | null;
}

export interface DetailedVerification {
  rem: { performed: boolean | null; formula?: string; target_match?: string; mpo_safe: boolean | null; summary: string | null };
  eaa: { performed: boolean | null; pass: boolean | null; summary: string | null };
}

// 2차 피팅/검증 체크리스트 인터페이스
export interface FitComfortChecklist {
  // 물리적 착용감
  domeMoldFit: boolean | null;           // 돔/몰드 크기 적합성 확인
  painDiscomfort: boolean | null;        // 착용 시 통증/불편감 여부
  secureRetention: boolean | null;       // 탈락 없이 안정적 고정 확인
  occlusionCheck: boolean | null;        // 울림 여부(Occlusion) 확인
  // 피드백 관련
  feedbackOccurrence: boolean | null;    // 피드백(하울링) 발생 여부 확인
  feedbackChewing: boolean | null;       // 씹을 때 피드백 확인
  feedbackHandNear: boolean | null;      // 손 가까이 시 피드백 확인
}

export interface ProgrammingChecklist {
  // 초기 피팅
  prescriptionApplied: boolean | null;   // 청력도 기반 처방식 적용 완료
  initialGainSet: boolean | null;        // 초기 이득(Gain) 설정 확인
  compressionRatioSet: boolean | null;   // 압축비(Compression Ratio) 설정
  frequencyGainAdjusted: boolean | null; // 주파수별 이득 조정
  // 미세 조정
  loudnessPreference: boolean | null;    // 소리 크기 선호도 반영
  soundQualityPreference: boolean | null;// 음질 선호도 반영 (선명도/부드러움)
  programSetup: boolean | null;          // 프로그램 수/종류 설정 (일상/소음/음악 등)
}

export interface RemChecklist {
  // Insertion Gain - 측정 준비
  igProbePosition: boolean | null;       // 프로브 튜브 삽입 위치 확인
  igReugMeasured: boolean | null;        // REUG(비보청 이득) 측정 완료
  // Insertion Gain - 타겟 매칭
  igTargetMatch250to4k: boolean | null;  // 250~4000Hz 타겟 ±5dB 이내 확인
  igTargetMatchHighFreq: boolean | null; // 고주파(4k~8kHz) 타겟 확인
  igLeftRightBalance: boolean | null;    // 좌/우 밸런스 확인
  // Speech Mapping - 측정 준비
  smProbePosition: boolean | null;       // 프로브 튜브 삽입 위치 확인
  smSpeechSignalSet: boolean | null;     // 어음 신호 설정 완료
  // Speech Mapping - 입력 레벨별 확인
  smSoft50dB: boolean | null;            // Soft(50dB): 가청 영역 내 확인
  smAverage65dB: boolean | null;         // Average(65dB): 타겟 근접 확인
  smLoud80dB: boolean | null;            // Loud(80dB): MPO 이하 확인
  // Speech Mapping - 어음 가청도
  smSpeechBananaCover: boolean | null;   // 바나나(Speech Banana) 영역 커버 확인
  smConsonantAudibility: boolean | null; // 자음 가청 영역 확인 (/s/, /sh/ 등 고주파)
}

export interface MpoChecklist {
  // UCL 기반 설정
  uclReflected: boolean | null;          // UCL 측정값 반영 여부
  mpoBelowUcl: boolean | null;           // MPO가 UCL 이하로 설정 확인
  // 안전성 검증
  noDiscomfortLoud: boolean | null;      // 큰 소리 입력 시 불쾌감 없음 확인
  mpo90dBLimit: boolean | null;          // MPO 90dB SPL 제한 확인 (필요시)
  impactSoundTest: boolean | null;       // 충격음 테스트 통과
}

// 기기점검 체크리스트 인터페이스
export interface ListeningCheckChecklist {
  // 외관 점검
  externalDamage: boolean | null;        // 보청기 외관 손상 여부 확인
  batteryDoorCharging: boolean | null;   // 배터리 도어/충전 단자 상태 확인
  micPortClear: boolean | null;          // 마이크 포트 막힘 여부 확인
  receiverTubeConnection: boolean | null;// 리시버/튜브 연결 상태 확인
  // 음향 점검
  powerOnOff: boolean | null;            // 전원 ON/OFF 정상 작동 확인
  soundQuality: boolean | null;          // 음질 이상(끊김/잡음/왜곡) 확인
  volumeProgramButton: boolean | null;   // 볼륨/프로그램 버튼 작동 확인
  feedbackCheck: boolean | null;         // 피드백 발생 여부 확인
}

export interface EaaChecklist {
  // 기본 측정
  ospl90Measured: boolean | null;        // OSPL90 (최대출력) 측정 완료
  fullOnGainMeasured: boolean | null;    // Full-on Gain (최대이득) 측정 완료
  refTestGainMeasured: boolean | null;   // Reference Test Gain 측정 완료
  // 스펙 비교
  specWithin3dB: boolean | null;         // 제조사 스펙 대비 ±3dB 이내 확인
  leftRightMatching: boolean | null;     // 좌/우 보청기 매칭 확인 (양이 착용 시)
  // 이상 징후
  outputReduction: boolean | null;       // 출력 저하 여부 확인
  frequencyResponseIssue: boolean | null;// 주파수별 응답 이상 여부 확인
}

// 딥 클리닝/소모품 교체 체크리스트 인터페이스
export interface DeepCleaningChecklist {
  // 외관 클리닝
  bodyCleaning: boolean | null;          // 보청기 본체 클리닝 완료
  earmoldDomCleaning: boolean | null;    // 이어몰드/돔 세척/교체
  waxGuardReplacement: boolean | null;   // 왁스가드(귀지필터) 교체
  tubeWireCheck: boolean | null;         // 튜브/와이어 상태 확인 및 교체
  // 소모품 점검
  batteryReplacement: boolean | null;    // 배터리 교체 (일반형)
  chargerTerminalCleaning: boolean | null;// 충전기 단자 클리닝
  receiverReplacement: boolean | null;   // 리시버/스피커 교체
  micCoverReplacement: boolean | null;   // 마이크 커버 교체
  // 추가 점검
  moistureRemoval: boolean | null;       // 습기 제거 처리
  desiccantReplacement: boolean | null;  // 방습제/건조제 교체
  ventCleaning: boolean | null;          // 통풍구(벤트) 청소
}

// 교육 체크리스트 인터페이스
export interface OrientationCoreChecklist {
  // 착용/탈착
  wearingMethod: boolean | null;         // 올바른 착용 방법 시연 및 실습
  removalMethod: boolean | null;         // 올바른 탈착 방법 시연 및 실습
  leftRightIdentify: boolean | null;     // 좌/우 구분 방법 안내
  domeMoldDirection: boolean | null;     // 돔/몰드 방향 확인 방법
  // 충전/배터리
  chargerUsage: boolean | null;          // 충전기 사용법 안내
  chargingCycle: boolean | null;         // 충전 시간/주기 안내
  batteryLevelCheck: boolean | null;     // 배터리 잔량 확인 방법
  // 관리/청소
  dailyCleaning: boolean | null;         // 일일 청소 방법 안내
  moistureStorage: boolean | null;       // 습기 제거/보관 방법 안내
  waxFilterChange: boolean | null;       // 왁스필터 교체 방법 안내
}

export interface AdaptationScheduleChecklist {
  // 착용 시간 안내
  week1Duration: boolean | null;         // 1주차 착용 시간 안내 (예: 2-4시간)
  week2Duration: boolean | null;         // 2주차 착용 시간 안내 (예: 4-6시간)
  week3Goal: boolean | null;             // 3주차 이후 목표 안내 (예: 종일 착용)
  // 환경 단계별 안내
  quietEnvironmentFirst: boolean | null; // 조용한 환경부터 시작 안내
  gradualNoiseExposure: boolean | null;  // 소음 환경 점진적 노출 안내
  tvPhoneAdaptation: boolean | null;     // TV/전화 적응 안내
  // 적응 기대치
  initialDiscomfortNormal: boolean | null;// 초기 불편감 정상임을 안내
  adaptationPeriod: boolean | null;      // 적응 기간(4-12주) 안내
  contactOnIssue: boolean | null;        // 문제 발생 시 연락 안내
}

export interface CommStrategiesChecklist {
  // 청취 전략
  faceSpeaker: boolean | null;           // 화자 얼굴 바라보기 안내
  chooseQuietPlace: boolean | null;      // 조용한 장소 선택 안내
  maintainDistance: boolean | null;      // 적절한 거리 유지 안내
  // 환경 조절
  reduceBackgroundNoise: boolean | null; // 배경 소음 줄이기 안내
  useLighting: boolean | null;           // 조명 활용 안내 (입술 읽기)
  seatPositioning: boolean | null;       // 좌석 위치 선택 안내
  // 의사소통 요령
  askForRepeat: boolean | null;          // 되묻기/확인 요청 안내
  topicAwareness: boolean | null;        // 대화 주제 파악 안내
  familyCooperation: boolean | null;     // 가족/주변인 협조 안내
}

// 관리/청소/교체주기 리마인드 체크리스트 인터페이스
export interface EducationRefreshChecklist {
  // 일상 관리 안내
  dailyWiping: boolean | null;           // 매일 보청기 닦기 안내
  sleepStorage: boolean | null;          // 취침 시 보관 방법 안내
  dryerUsage: boolean | null;            // 습기 제거/건조기 사용법 안내
  earwaxCheck: boolean | null;           // 귀지 확인 및 청소 안내
  // 교체주기 안내
  waxGuardCycle: boolean | null;         // 왁스가드 교체주기 안내 (1-2주)
  domeTipCycle: boolean | null;          // 돔/이어팁 교체주기 안내 (2-3개월)
  tubeCycle: boolean | null;             // 튜브 교체주기 안내 (3-6개월)
  desiccantCycle: boolean | null;        // 건조제 교체주기 안내 (1-2개월)
  // 주의사항 안내
  moistureWarning: boolean | null;       // 물/습기 접촉 주의 안내
  heatWarning: boolean | null;           // 고온/직사광선 피하기 안내
  cosmeticsWarning: boolean | null;      // 헤어스프레이/화장품 주의 안내
  storageHabit: boolean | null;          // 분실 방지 보관 습관 안내
}

// 데이터로깅 기반 조정 체크리스트 인터페이스
export interface DataloggingAdjChecklist {
  // 사용 패턴 분석
  dailyWearTime: boolean | null;         // 일일 평균 착용시간 확인
  environmentDistribution: boolean | null;// 주요 사용 환경 분포 확인
  programUsageRatio: boolean | null;     // 프로그램별 사용 비율 확인
  volumePattern: boolean | null;         // 볼륨 조절 패턴 확인
  // 환경별 조정
  quietOptimization: boolean | null;     // 조용한 환경 설정 최적화
  noiseAdjustment: boolean | null;       // 소음 환경 설정 조정
  musicMediaAdjustment: boolean | null;  // 음악/미디어 설정 조정
  phoneCallAdjustment: boolean | null;   // 전화통화 설정 조정
}

// 필요 시 프로그램/이득 조정 체크리스트 인터페이스
export interface FineTuningChecklist {
  // 이득 조정
  overallGain: boolean | null;           // 전체 볼륨(Overall Gain) 조정
  lowFreqGain: boolean | null;           // 저주파 이득 조정
  highFreqGain: boolean | null;          // 고주파 이득 조정
  compressionAdjust: boolean | null;     // 압축비(Compression) 조정
  // 프로그램 조정
  defaultProgram: boolean | null;        // 기본 프로그램 수정
  noiseProgram: boolean | null;          // 소음 프로그램 추가/수정
  musicProgram: boolean | null;          // 음악 프로그램 추가/수정
  streamingProgram: boolean | null;      // 전화/스트리밍 프로그램 조정
  // 기타 조정
  feedbackManagement: boolean | null;    // 피드백 관리 설정 조정
  noiseReduction: boolean | null;        // 소음 감소(NR) 레벨 조정
  directionalMic: boolean | null;        // 방향성 마이크 설정 조정
  occlusionManagement: boolean | null;   // 울림(Occlusion) 관리 조정
}

// 현실적 기대치/적응기간 안내 체크리스트 인터페이스
export interface ExpectationChecklist {
  // 청력 회복 기대치
  assistNotRestore: boolean | null;      // 보청기는 청력 "회복"이 아닌 "보조" 설명
  quietVsNoiseExplain: boolean | null;   // 조용한 환경 vs 소음 환경 차이 설명
  individualDifference: boolean | null;  // 개인별 효과 차이 가능성 안내
  // 적응 기간 안내
  adaptationPeriodInfo: boolean | null;  // 초기 적응기간 (4-12주) 필요 안내
  brainRelearning: boolean | null;       // 뇌의 소리 재학습 과정 설명
  initialDiscomfort: boolean | null;     // 처음엔 불편할 수 있음 안내
  gradualWearIncrease: boolean | null;   // 점진적 착용시간 증가 권장
  // 일반적인 초기 경험
  ownVoiceDifferent: boolean | null;     // 본인 목소리가 다르게 들릴 수 있음
  ambientNoiseLouder: boolean | null;    // 주변 소음이 크게 느껴질 수 있음
  occlusionPossible: boolean | null;     // 울림/폐쇄감 초기 발생 가능성
  naturalOverTime: boolean | null;       // 시간이 지나면 자연스러워짐 안내
}

// 보청기 스타일/기능/양이 계획 수립 체크리스트 인터페이스
export interface DevicePlanChecklist {
  // 스타일 선정
  hearingLossOutput: boolean | null;     // 청력손실 정도에 따른 출력 검토
  earCanalCheck: boolean | null;         // 외이도 상태/크기 확인 (ITE/RIC/BTE)
  dexterityVision: boolean | null;       // 손 민첩성/시력 고려
  cosmeticPreference: boolean | null;    // 외관 선호도 확인 (눈에 띄는/은밀한)
  // 기능 선정
  bluetoothNeed: boolean | null;         // 블루투스/무선 연결 필요 여부
  tinnitusFeature: boolean | null;       // 이명 기능(Tinnitus Masker) 필요 여부
  batteryPreference: boolean | null;     // 충전식/일반 배터리 선호도
  // 양이/편측 결정
  bilateralCheck: boolean | null;        // 양측 청력손실 확인
  binauralBenefit: boolean | null;       // 양이 착용 효과 설명
  unilateralConsider: boolean | null;    // 편측 착용 시 고려사항 안내
  sideDecision: boolean | null;          // 착용 측 결정 (양이/우선측)
  // 예산/보조금
  budgetRange: boolean | null;           // 예산 범위 확인
  subsidyCheck: boolean | null;          // 보조금/급여 대상 여부 확인
  paymentMethod: boolean | null;         // 결제 방식 안내 (할부/일시불)
}

export interface DetailedClinicalResults {
  pure_tone?: DetailedPureTone;
  middle_ear?: DetailedMiddleEar;
  speech?: DetailedSpeech;
  sound_field?: DetailedSoundField;
  verification?: DetailedVerification;
  datalogging?: { hours_per_day: number | null; environment_notes: string | null; note: string | null };
  // 2차 피팅/검증 체크리스트
  fitComfortChecklist?: FitComfortChecklist;
  programmingChecklist?: ProgrammingChecklist;
  remChecklist?: RemChecklist;
  mpoChecklist?: MpoChecklist;
  // 기기점검 체크리스트
  listeningCheckChecklist?: ListeningCheckChecklist;
  eaaChecklist?: EaaChecklist;
  deepCleaningChecklist?: DeepCleaningChecklist;
  // 교육 체크리스트
  orientationCoreChecklist?: OrientationCoreChecklist;
  adaptationScheduleChecklist?: AdaptationScheduleChecklist;
  commStrategiesChecklist?: CommStrategiesChecklist;
  educationRefreshChecklist?: EducationRefreshChecklist;
  // 조정 체크리스트
  dataloggingAdjChecklist?: DataloggingAdjChecklist;
  fineTuningChecklist?: FineTuningChecklist;
  // 1차 피팅/검증 체크리스트
  devicePlanChecklist?: DevicePlanChecklist;
  expectationChecklist?: ExpectationChecklist;
}

export interface EarTestValue {
  mcl?: number[];
  srt?: number[];
  ucl?: number[];
  wrs_percent?: number[];
}

export interface SpeechTestData extends BaseRecord {
  visit_id: string;
  customer_id: string;
  rt: EarTestValue;
  lt: EarTestValue;
  free_field: EarTestValue;
  free_field_rt: EarTestValue;
  free_field_lt: EarTestValue;
  special_notes?: string;
}

export interface PureToneTestData extends BaseRecord {
  visit_id: string;
  customer_id: string;
  frequencies: Record<string, {
    rt_ac?: number | null;
    lt_ac?: number | null;
    rt_bc?: number | null;
    lt_bc?: number | null;
    rt_sf?: number | null;
    lt_sf?: number | null;
  }>;
}

export interface HASession extends BaseRecord {
  id: string;
  customer_id: string;
  visit_id: string;
  visit_date: string;
  ha_stage: HAStage;
  checklist: Record<string, { status: 'DONE' | 'SKIPPED' | 'N/A'; note: string | null }>;
  results_detailed: DetailedClinicalResults;
  adjustments: {
    programming_summary: string | null;
    gain_change_summary: string | null;
    noise_program_change: string | null;
    feedback_management: string | null;
    occlusion_management: string | null;
  };
  education: {
    insertion_removal: boolean | null;
    battery_charging: boolean | null;
    cleaning_care: boolean | null;
    app_bluetooth: boolean | null;
    adaptation_schedule_given: boolean | null;
    communication_strategies: boolean | null;
  };
  validation: {
    cosi_top3_review?: { 
      goal1: string | null; goal2: string | null; goal3: string | null; 
      improvement_1: number | null; improvement_2: number | null; improvement_3: number | null 
    };
    satisfaction_0to10?: number | null;
  };
}

export enum AppState {
  SEARCH = 'SEARCH',
  CUSTOMER_DETAIL = 'CUSTOMER_DETAIL',
  VISIT_DETAIL = 'VISIT_DETAIL'
}
