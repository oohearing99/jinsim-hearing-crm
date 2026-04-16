export interface ClassifySignals {
  hasAudiogram: boolean;
  hasQuestionnaire: boolean;
  hasHearingAidExperience: boolean;
  isFirstVisit: boolean;
}

export function classifyGeneralVisit(s: ClassifySignals): 'INITIAL' | 'SERVICE' {
  if (s.hasHearingAidExperience) return 'SERVICE';
  if (s.isFirstVisit && (s.hasQuestionnaire || s.hasAudiogram)) return 'INITIAL';
  if (s.isFirstVisit) return 'INITIAL';
  return 'SERVICE';
}
