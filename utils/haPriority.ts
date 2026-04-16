import type { HAStage } from '../types';

export type PriorityStatus = 'PENDING' | 'DONE' | 'SKIPPED';

export interface PrioritizableItem {
  id: string;
  stage: HAStage;
  priority: number;
  status: PriorityStatus;
}

export function selectTopPriorities<T extends PrioritizableItem>(
  items: T[],
  stage: HAStage,
  limit: number
): T[] {
  return items
    .filter(i => i.stage === stage && i.status === 'PENDING')
    .sort((a, b) => a.priority - b.priority)
    .slice(0, limit);
}
