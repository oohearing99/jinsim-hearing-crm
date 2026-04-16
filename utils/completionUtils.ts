export type CompletionStatus = 'completed' | 'in_progress' | 'not_started';

/**
 * 상담 설문지 완료 상태 판정
 * - not_started: localStorage에 데이터 없음
 * - in_progress: 데이터 존재하지만 motivations 또는 cosi_top3_goals 비어있음
 * - completed: motivations + cosi_top3_goals + APHAB/HHIE 모두 입력됨
 */
export function getQuestionnaireStatus(customerId: string, visitId: string): CompletionStatus {
  const savedByCustomer = localStorage.getItem(`q_customer_${customerId}`);
  const savedByVisit = localStorage.getItem(`q_${visitId}`);
  const raw = savedByCustomer || savedByVisit;
  if (!raw) return 'not_started';

  try {
    const data = JSON.parse(raw);
    const hasMotivations = data.visit_motives && data.visit_motives.length > 0;
    const hasCosi = data.cosi_top3_goals && data.cosi_top3_goals.length > 0 &&
      data.cosi_top3_goals.some((g: { category: string }) => g.category);
    const hasAphab = typeof data.diff_quiet_1to1 === 'number';

    if (hasMotivations && hasCosi && hasAphab) return 'completed';
    return 'in_progress';
  } catch {
    return 'not_started';
  }
}

/**
 * 순음검사 완료 상태 판정
 * - not_started: localStorage에 데이터 없음
 * - in_progress: 데이터 존재하지만 좌우 AC 중 하나만 입력됨
 * - completed: 좌우 AC 모두 1개 이상 주파수 입력됨
 */
export function getPureToneStatus(visitId: string): CompletionStatus {
  const raw = localStorage.getItem(`pta_${visitId}`);
  if (!raw) return 'not_started';

  try {
    const data = JSON.parse(raw);
    const freqs = data.frequencies || {};
    const freqKeys = Object.keys(freqs);

    let hasRightAc = false;
    let hasLeftAc = false;

    for (const key of freqKeys) {
      const f = freqs[key];
      if (f.rt_ac !== null && f.rt_ac !== undefined) hasRightAc = true;
      if (f.lt_ac !== null && f.lt_ac !== undefined) hasLeftAc = true;
    }

    if (hasRightAc && hasLeftAc) return 'completed';
    if (hasRightAc || hasLeftAc) return 'in_progress';
    return 'in_progress'; // 데이터 파일은 있지만 값 없음
  } catch {
    return 'not_started';
  }
}

/**
 * 어음검사 완료 상태 판정
 * - not_started: localStorage에 데이터 없음
 * - in_progress: 데이터 존재하지만 SRT/WRS 일부만 입력
 * - completed: 좌우 SRT + WRS 모두 입력됨
 */
export function getSpeechStatus(visitId: string): CompletionStatus {
  const raw = localStorage.getItem(`speech_${visitId}`);
  if (!raw) return 'not_started';

  try {
    const data = JSON.parse(raw);
    const hasRightSrt = data.rt?.srt && data.rt.srt.length > 0 && data.rt.srt[0] !== null;
    const hasLeftSrt = data.lt?.srt && data.lt.srt.length > 0 && data.lt.srt[0] !== null;
    const hasRightWrs = data.rt?.wrs_percent && data.rt.wrs_percent.length > 0 && data.rt.wrs_percent[0] !== null;
    const hasLeftWrs = data.lt?.wrs_percent && data.lt.wrs_percent.length > 0 && data.lt.wrs_percent[0] !== null;

    if (hasRightSrt && hasLeftSrt && hasRightWrs && hasLeftWrs) return 'completed';
    if (hasRightSrt || hasLeftSrt || hasRightWrs || hasLeftWrs) return 'in_progress';
    return 'in_progress';
  } catch {
    return 'not_started';
  }
}

/**
 * HA 프로토콜 완료 상태 판정
 * - not_started: localStorage에 데이터 없음
 * - in_progress: 데이터 존재하지만 필수 항목 중 미완료 있음
 * - completed: 필수 항목 모두 DONE
 */
export function getHaProtocolStatus(visitId: string): CompletionStatus {
  const raw = localStorage.getItem(`hasession_${visitId}`);
  if (!raw) return 'not_started';

  try {
    const data = JSON.parse(raw);
    const checklist = data.checklist || {};
    const keys = Object.keys(checklist);
    if (keys.length === 0) return 'in_progress';

    const hasDone = keys.some(k => checklist[k]?.status === 'DONE');
    const allDone = keys.every(k =>
      checklist[k]?.status === 'DONE' ||
      checklist[k]?.status === 'SKIPPED' ||
      checklist[k]?.status === 'N/A'
    );

    if (allDone && hasDone) return 'completed';
    if (hasDone) return 'in_progress';
    return 'in_progress';
  } catch {
    return 'not_started';
  }
}

/**
 * 모든 탭의 완료 상태를 한 번에 가져오기
 */
export function getAllTabStatuses(
  customerId: string,
  visitId: string,
  isHA: boolean
): Record<string, CompletionStatus> {
  return {
    Q: getQuestionnaireStatus(customerId, visitId),
    PTA: getPureToneStatus(visitId),
    SPEECH: getSpeechStatus(visitId),
    ...(isHA ? { HA: getHaProtocolStatus(visitId) } : {}),
  };
}

/**
 * 스텝 인디케이터용 — 현재 스텝 자동 결정
 * 첫 번째 미완료 스텝을 현재 스텝으로 판정
 */
export function getCurrentStep(statuses: Record<string, CompletionStatus>, isHA: boolean): number {
  const order = isHA ? ['Q', 'PTA', 'SPEECH', 'HA'] : ['Q', 'PTA', 'SPEECH'];
  for (let i = 0; i < order.length; i++) {
    if (statuses[order[i]] !== 'completed') return i;
  }
  return order.length - 1; // 모두 완료 시 마지막 스텝
}

/**
 * 전체 진행률 (완료된 스텝 수 / 전체 스텝 수)
 */
export function getOverallProgress(statuses: Record<string, CompletionStatus>, isHA: boolean): { completed: number; total: number } {
  const order = isHA ? ['Q', 'PTA', 'SPEECH', 'HA'] : ['Q', 'PTA', 'SPEECH'];
  const completed = order.filter(k => statuses[k] === 'completed').length;
  return { completed, total: order.length };
}
