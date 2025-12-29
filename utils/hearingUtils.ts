
export const validateDbHl = (val: number | null) => {
  if (val === null) return true;
  return val >= -10 && val <= 120;
};

// 3분법 PTA 계산 (500, 1000, 2000Hz 평균)
export const calculatePTA = (thresholds: Record<string, number | null> | undefined): number | null => {
  if (!thresholds) return null;
  const targets = ["500", "1000", "2000"];
  const values = targets.map(f => thresholds[f]).filter((v): v is number => v !== null && v !== undefined);
  if (values.length === 0) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round((sum / values.length) * 10) / 10;
};

// 6분법 PTA 계산 (청각장애 진단용)
// 공식: (500Hz×1 + 1000Hz×2 + 2000Hz×2 + 4000Hz×1) / 6
export const calculatePTA6 = (thresholds: Record<string, number | null> | undefined): number | null => {
  if (!thresholds) return null;

  const v500 = thresholds["500"];
  const v1000 = thresholds["1000"];
  const v2000 = thresholds["2000"];
  const v4000 = thresholds["4000"];

  // 모든 주파수 값이 있어야 계산
  if (v500 === null || v500 === undefined ||
      v1000 === null || v1000 === undefined ||
      v2000 === null || v2000 === undefined ||
      v4000 === null || v4000 === undefined) {
    return null;
  }

  const sum = (v500 * 1) + (v1000 * 2) + (v2000 * 2) + (v4000 * 1);
  return Math.round((sum / 6) * 10) / 10;
};

// 청각장애 등급 판정 (2024년 기준)
// 1. 양쪽 귀 모두 60dB 이상
// 2. 한쪽 80dB 이상 + 반대쪽 40dB 이상
// 3. 한쪽 80dB 이상 + 반대쪽 40dB 이하
// 4. 양쪽 귀 어음명료도 50% 이하
export const checkDisabilityEligibility = (
  pta6Right: number | null,
  pta6Left: number | null,
  wrsRight: number | null = null,
  wrsLeft: number | null = null
): { eligible: boolean; reason: string } => {
  if (pta6Right === null || pta6Left === null) {
    return { eligible: false, reason: '검사 데이터 부족' };
  }

  const betterEar = Math.min(pta6Right, pta6Left);
  const worseEar = Math.max(pta6Right, pta6Left);

  // 1. 양쪽 귀 모두 60dB 이상
  if (betterEar >= 60) {
    return { eligible: true, reason: `양측 ${betterEar}dB 이상` };
  }

  // 2. 한쪽 80dB 이상 + 반대쪽 40dB 이상
  if (worseEar >= 80 && betterEar >= 40) {
    return { eligible: true, reason: `일측 ${worseEar}dB / 반대측 ${betterEar}dB` };
  }

  // 3. 한쪽 80dB 이상 + 반대쪽 40dB 이하
  if (worseEar >= 80 && betterEar <= 40) {
    return { eligible: true, reason: `일측 ${worseEar}dB / 반대측 ${betterEar}dB 이하` };
  }

  // 4. 양쪽 귀 어음명료도 50% 이하
  if (wrsRight !== null && wrsLeft !== null) {
    if (wrsRight <= 50 && wrsLeft <= 50) {
      return { eligible: true, reason: `양측 어음명료도 ${Math.max(wrsRight, wrsLeft)}% 이하` };
    }
  }

  return { eligible: false, reason: `기준 미충족 (PTA: ${betterEar}/${worseEar}dB${wrsRight !== null && wrsLeft !== null ? `, WRS: ${wrsRight}/${wrsLeft}%` : ''})` };
};

export const suggestTympType = (peak: number | null, comp: number | null): string => {
  if (peak === null || comp === null) return "UNKNOWN";
  if (comp < 0.2) return "As";
  if (comp > 1.8) return "Ad";
  if (peak < -100) return "C";
  // B type: Low compliance, no identifiable peak
  if (comp < 0.1) return "B"; 
  return "A";
};

export const CLINICAL_FREQS = ["125", "250", "500", "750", "1000", "1500", "2000", "3000", "4000", "6000", "8000"];
export const BC_FREQS = ["250", "500", "750", "1000", "1500", "2000", "3000", "4000"];
export const SF_FREQS = ["250", "500", "750", "1000", "1500", "2000", "3000", "4000"];

// SRT-PTA 일치도 검증 (±10dB 이내가 정상)
export const validateSrtPtaAgreement = (srt: number | null, pta: number | null): {
  isValid: boolean;
  difference: number | null;
  status: 'GOOD' | 'ACCEPTABLE' | 'POOR' | 'UNKNOWN';
  message: string;
} => {
  if (srt === null || pta === null) {
    return { isValid: false, difference: null, status: 'UNKNOWN', message: '데이터 부족' };
  }

  const diff = Math.round(Math.abs(srt - pta) * 10) / 10;

  if (diff <= 6) {
    return { isValid: true, difference: diff, status: 'GOOD', message: `우수한 일치도 (${diff}dB 차이)` };
  } else if (diff <= 10) {
    return { isValid: true, difference: diff, status: 'ACCEPTABLE', message: `허용 가능한 일치도 (${diff}dB 차이)` };
  } else {
    return { isValid: false, difference: diff, status: 'POOR', message: `일치도 불량 (${diff}dB 차이) - 재검사 권장` };
  }
};

// ABG (Air-Bone Gap) 계산
export const calculateABG = (
  acThresholds: Record<string, number | null> | undefined,
  bcThresholds: Record<string, number | null> | undefined
): {
  avgABG: number | null;
  abgByFreq: Record<string, number | null>;
  hasSignificantABG: boolean;
  message: string;
} => {
  if (!acThresholds || !bcThresholds) {
    return { avgABG: null, abgByFreq: {}, hasSignificantABG: false, message: '데이터 부족' };
  }

  const abgByFreq: Record<string, number | null> = {};
  const abgValues: number[] = [];

  BC_FREQS.forEach(freq => {
    const ac = acThresholds[freq];
    const bc = bcThresholds[freq];

    if (ac !== null && ac !== undefined && bc !== null && bc !== undefined) {
      const abg = ac - bc;
      abgByFreq[freq] = abg;
      abgValues.push(abg);
    } else {
      abgByFreq[freq] = null;
    }
  });

  if (abgValues.length === 0) {
    return { avgABG: null, abgByFreq, hasSignificantABG: false, message: '계산 불가' };
  }

  const avgABG = Math.round((abgValues.reduce((a, b) => a + b, 0) / abgValues.length) * 10) / 10;
  const hasSignificantABG = avgABG >= 10;

  let message = '';
  if (avgABG < 10) {
    message = '정상 범위 (10dB 미만)';
  } else if (avgABG < 15) {
    message = '경도 전음성 요소 (10-15dB)';
  } else if (avgABG < 25) {
    message = '중등도 전음성 요소 (15-25dB)';
  } else {
    message = '중도 이상 전음성 요소 (25dB 이상)';
  }

  return { avgABG, abgByFreq, hasSignificantABG, message };
};

// 난청 유형 자동 분류
export const classifyHearingLoss = (
  acThresholds: Record<string, number | null> | undefined,
  bcThresholds: Record<string, number | null> | undefined
): {
  type: 'NORMAL' | 'CONDUCTIVE' | 'SENSORINEURAL' | 'MIXED' | 'UNKNOWN';
  severity: 'NORMAL' | 'SLIGHT' | 'MILD' | 'MODERATE' | 'MODERATELY_SEVERE' | 'SEVERE' | 'PROFOUND' | 'UNKNOWN';
  typeLabel: string;
  severityLabel: string;
  description: string;
} => {
  if (!acThresholds) {
    return {
      type: 'UNKNOWN',
      severity: 'UNKNOWN',
      typeLabel: '미분류',
      severityLabel: '미분류',
      description: '데이터 부족'
    };
  }

  // PTA 계산
  const pta = calculatePTA(acThresholds);

  if (pta === null) {
    return {
      type: 'UNKNOWN',
      severity: 'UNKNOWN',
      typeLabel: '미분류',
      severityLabel: '미분류',
      description: '데이터 부족'
    };
  }

  // 난청 정도 분류
  let severity: 'NORMAL' | 'SLIGHT' | 'MILD' | 'MODERATE' | 'MODERATELY_SEVERE' | 'SEVERE' | 'PROFOUND';
  let severityLabel: string;

  if (pta <= 15) {
    severity = 'NORMAL';
    severityLabel = '정상';
  } else if (pta <= 25) {
    severity = 'SLIGHT';
    severityLabel = '약간의 난청';
  } else if (pta <= 40) {
    severity = 'MILD';
    severityLabel = '경도 난청';
  } else if (pta <= 55) {
    severity = 'MODERATE';
    severityLabel = '중등도 난청';
  } else if (pta <= 70) {
    severity = 'MODERATELY_SEVERE';
    severityLabel = '중고도 난청';
  } else if (pta <= 90) {
    severity = 'SEVERE';
    severityLabel = '고도 난청';
  } else {
    severity = 'PROFOUND';
    severityLabel = '심도 난청';
  }

  // 난청 유형 분류
  const abgResult = calculateABG(acThresholds, bcThresholds);
  let type: 'NORMAL' | 'CONDUCTIVE' | 'SENSORINEURAL' | 'MIXED' | 'UNKNOWN';
  let typeLabel: string;
  let description: string;

  if (pta <= 15) {
    type = 'NORMAL';
    typeLabel = '정상 청력';
    description = '정상 청력 범위';
  } else if (!bcThresholds || abgResult.avgABG === null) {
    type = 'UNKNOWN';
    typeLabel = '미분류';
    description = '골도 검사 데이터 필요';
  } else if (abgResult.avgABG < 10 && (abgResult.avgABG >= 0 || pta > 15)) {
    type = 'SENSORINEURAL';
    typeLabel = '감각신경성 난청';
    description = '내이 또는 청신경 손상';
  } else if (abgResult.avgABG >= 10) {
    const bcPta = calculatePTA(bcThresholds);
    if (bcPta !== null && bcPta <= 15) {
      type = 'CONDUCTIVE';
      typeLabel = '전음성 난청';
      description = '외이 또는 중이 전달 장애';
    } else {
      type = 'MIXED';
      typeLabel = '혼합성 난청';
      description = '전음성 + 감각신경성 난청';
    }
  } else {
    type = 'UNKNOWN';
    typeLabel = '미분류';
    description = '추가 검사 필요';
  }

  return { type, severity, typeLabel, severityLabel, description };
};

// 차폐 필요 여부 판단 (Interaural Attenuation 고려)
export const checkMaskingNeed = (
  acRight: Record<string, number | null> | undefined,
  acLeft: Record<string, number | null> | undefined,
  bcRight: Record<string, number | null> | undefined,
  bcLeft: Record<string, number | null> | undefined
): {
  needMasking: boolean;
  frequencies: string[];
  reason: string;
} => {
  if (!acRight || !acLeft) {
    return { needMasking: false, frequencies: [], reason: '기도 데이터 부족' };
  }

  const needMaskingFreqs: string[] = [];
  const INTERAURAL_ATTENUATION_AC = 40; // 기도 차폐 기준 (dB)
  const INTERAURAL_ATTENUATION_BC = 0; // 골도는 두개골 전도로 차폐 필수

  // 기도 검사 시 차폐 필요 여부
  BC_FREQS.forEach(freq => {
    const rtAc = acRight[freq];
    const ltAc = acLeft[freq];

    if (rtAc !== null && rtAc !== undefined && ltAc !== null && ltAc !== undefined) {
      const diff = Math.abs(rtAc - ltAc);
      if (diff >= INTERAURAL_ATTENUATION_AC) {
        needMaskingFreqs.push(freq);
      }
    }
  });

  // 골도 검사 시 차폐 필요 여부
  if (bcRight && bcLeft) {
    BC_FREQS.forEach(freq => {
      const rtBc = bcRight[freq];
      const ltBc = bcLeft[freq];

      if ((rtBc !== null && rtBc !== undefined) || (ltBc !== null && ltBc !== undefined)) {
        if (!needMaskingFreqs.includes(freq)) {
          needMaskingFreqs.push(freq);
        }
      }
    });
  }

  return {
    needMasking: needMaskingFreqs.length > 0,
    frequencies: needMaskingFreqs.sort((a, b) => parseInt(a) - parseInt(b)),
    reason: needMaskingFreqs.length > 0
      ? `${needMaskingFreqs.join(', ')}Hz에서 차폐 필요`
      : '차폐 불필요'
  };
};
